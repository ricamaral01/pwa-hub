"""Append-only daily NDJSON. One writer process, bounded query output, no SQL."""
from __future__ import annotations
import csv, gzip, heapq, io, json, math, os, threading, time
from collections import OrderedDict
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Iterator

UTC = timezone.utc

def now_ms() -> int:
    return time.time_ns() // 1_000_000

def day_of(ms: int) -> str:
    return datetime.fromtimestamp(ms / 1000, UTC).strftime('%Y-%m-%d')

def atomic_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + '.tmp')
    with tmp.open('w', encoding='utf-8') as f:
        json.dump(value, f, ensure_ascii=False, separators=(',', ':'), allow_nan=False)
        f.flush(); os.fsync(f.fileno())
    os.replace(tmp, path)

def json_file(path: Path, default):
    return json.loads(path.read_text('utf-8')) if path.exists() else default

class Store:
    def __init__(self, root: Path):
        self.root = root
        root.mkdir(parents=True, exist_ok=True)
        self.lock = threading.RLock()
        self.live: dict[str, dict] = {}
        self.ids: OrderedDict[tuple[str, str], dict[str, dict]] = OrderedDict()

    def config(self, device: str) -> dict:
        with self.lock:
            return json_file(self.root / 'config' / (device + '.json'), {
                'device_id': device, 'name': 'Coletor ' + device,
                'interval_minutes': 1, 'revision': 1,
                'concreted_at_ms': None,
            })

    def save_config(self, device: str, data: dict) -> dict:
        with self.lock:
            cfg = self.config(device)
            cfg.update(data)
            cfg['revision'] += 1
            atomic_json(self.root / 'config' / (device + '.json'), cfg)
            return cfg

    def events(self, device: str) -> list:
        with self.lock:
            return json_file(self.root / 'events' / (device + '.json'), [])

    def event(self, device: str, event: dict) -> dict:
        with self.lock:
            events = self.events(device)
            if len(events) >= 10000:
                raise ValueError('Limite de 10.000 eventos por coletor nesta versão.')
            event = {**event, 'id': os.urandom(8).hex()}
            events.append(event)
            atomic_json(self.root / 'events' / (device + '.json'), events)
            return event

    def paths(self, device: str, day: str) -> list[Path]:
        base = self.root / 'readings' / device / day[:4] / day[5:7]
        # Archived base plus a new delta file can coexist after late deliveries.
        return [p for p in [base / (day + '.ndjson.gz'), base / (day + '.ndjson')] if p.exists()]

    @staticmethod
    def rows(path: Path) -> Iterator[dict]:
        opener = gzip.open if path.suffix == '.gz' else open
        with opener(path, 'rt', encoding='utf-8') as f:
            for number, line in enumerate(f, 1):
                if not line.endswith('\n'):
                    # An interrupted final write is not an acknowledged record.
                    continue
                try:
                    yield json.loads(line)
                except json.JSONDecodeError as exc:
                    raise RuntimeError(f'Arquivo corrompido: {path.name}, linha {number}') from exc

    def day_ids(self, device: str, day: str) -> dict[str, dict]:
        key = (device, day)
        if key not in self.ids:
            ids = {}
            for path in self.paths(device, day):
                for row in self.rows(path):
                    sample = {field: row[field] for field in ('seq', 'ts_ms', 'temperatures', 'faults', 'clock_quality')}
                    previous = ids.get(row['record_id'])
                    if previous is not None and previous != sample:
                        raise RuntimeError('Histórico contém registros conflitantes.')
                    ids[row['record_id']] = sample
            self.ids[key] = ids
            while len(self.ids) > 128:
                self.ids.popitem(last=False)
        self.ids.move_to_end(key)
        return self.ids[key]

    @staticmethod
    def repair_tail(path: Path) -> None:
        """Preserve an interrupted tail before truncating; never drop a full line."""
        if not path.exists() or path.stat().st_size == 0:
            return
        with path.open('r+b') as f:
            size = f.seek(0, 2)
            f.seek(size - 1)
            if f.read(1) == b'\n':
                return
            start = max(0, size - 65536)
            f.seek(start); tail = f.read()
            split = tail.rfind(b'\n')
            cut = start + split + 1 if split >= 0 else 0
            if start and split < 0:
                raise RuntimeError('Cauda excessiva/corrompida; revisar arquivo antes de continuar.')
            f.seek(cut); damaged = f.read()
            recovery = path.with_name(path.name + f'.recovered-{now_ms()}')
            recovery.write_bytes(damaged)
            f.truncate(cut); f.flush(); os.fsync(f.fileno())

    def ingest(self, packet: dict) -> list[int]:
        device, boot = packet['device_id'], packet['boot_id']
        received = now_ms()
        ack: list[int] = []
        with self.lock:
            # Create persistent metadata even when only live readings have arrived.
            cfg_path = self.root / 'config' / (device + '.json')
            if not cfg_path.exists():
                atomic_json(cfg_path, self.config(device))
            for sample in packet['samples']:
                day = day_of(sample['ts_ms'])
                key = f"{boot}:{sample['seq']}"
                known = self.day_ids(device, day)
                canonical = {field: sample[field] for field in ('seq', 'ts_ms', 'temperatures', 'faults', 'clock_quality')}
                if key in known and known[key] != canonical:
                    raise ValueError('Retransmissão conflitante para boot_id e seq.')
                if key not in known:
                    path = self.root / 'readings' / device / day[:4] / day[5:7] / (day + '.ndjson')
                    path.parent.mkdir(parents=True, exist_ok=True)
                    self.repair_tail(path)
                    row = {**sample, 'record_id': key, 'device_id': device,
                           'boot_id': boot, 'received_at_ms': received}
                    encoded = json.dumps(row, ensure_ascii=False, separators=(',', ':'), allow_nan=False)
                    try:
                        with path.open('a', encoding='utf-8') as f:
                            f.write(encoded + '\n'); f.flush(); os.fsync(f.fileno())
                    except OSError:
                        self.ids.pop((device, day), None)
                        raise
                    known[key] = canonical
                ack.append(sample['seq'])
            live_sample = packet.get('live')
            if live_sample is None:
                previous = self.live.get(device, {}).get('sample')
                newest = max(packet['samples'], key=lambda sample: sample['ts_ms'], default=None)
                live_sample = max((sample for sample in (previous, newest) if sample is not None),
                                  key=lambda sample: sample['ts_ms'], default=None)
            self.live[device] = {
                'received_at_ms': received, 'boot_id': boot,
                'sample': live_sample,
                'reported_interval_minutes': packet['interval_minutes'],
                'reported_revision': packet['config_revision'],
                'buffered': packet['buffered'], 'dropped': packet['dropped'],
                'rssi': packet['rssi'], 'firmware': packet['firmware'],
                'clock_synced': packet['clock_synced'],
            }
        return ack

    def devices(self) -> list[dict]:
        with self.lock:
            names = {p.stem for p in (self.root / 'config').glob('*.json')} | set(self.live)
            return [self.status(d) for d in sorted(names)]

    def status(self, device: str) -> dict:
        with self.lock:
            live = self.live.get(device)
            return {'config': self.config(device), 'live': live,
                    'online': bool(live and now_ms() - live['received_at_ms'] < 45000),
                    'events': self.events(device)}

    def range_rows(self, device: str, start: int, end: int) -> Iterator[dict]:
        first = datetime.fromtimestamp(start / 1000, UTC).date()
        last = datetime.fromtimestamp(end / 1000, UTC).date()
        day = first
        while day <= last:
            seen = set()
            for path in self.paths(device, day.isoformat()):
                for row in self.rows(path):
                    if start <= row['ts_ms'] <= end and row['record_id'] not in seen:
                        seen.add(row['record_id'])
                        yield row
            day += timedelta(days=1)

    def history(self, device: str, start: int, end: int, max_points: int) -> dict:
        # Exact statistics use every stored sample; graph output is bounded.
        n = 0; raw = []; recent = []; latest = None
        stats = [{'min': None, 'max': None, 'peak_at_ms': None, 'sum': 0., 'count': 0} for _ in range(4)]
        width = max(1, math.ceil((end - start + 1) / max_points))
        bins: dict[int, dict] = {}
        fault_records = 0
        max_delta = None
        with self.lock:
            for row in self.range_rows(device, start, end):
                n += 1
                if n <= max_points:
                    raw.append(row)
                if n == max_points + 1:
                    raw = []
                if latest is None or row['ts_ms'] > latest['ts_ms']:
                    latest = row
                heapq.heappush(recent, (row['ts_ms'], row['record_id'], row))
                if len(recent) > 200:
                    heapq.heappop(recent)
                fault_records += int(any(row['faults']))
                if row['temperatures'][0] is not None and row['temperatures'][3] is not None:
                    delta = row['temperatures'][0] - row['temperatures'][3]
                    max_delta = delta if max_delta is None else max(max_delta, delta)
                b = (row['ts_ms'] - start) // width
                bucket = bins.setdefault(b, {'ts_ms': start + b * width + width // 2,
                     'sum': [0.] * 4, 'count': [0] * 4, 'minimum': [None]*4, 'maximum': [None]*4})
                for i, value in enumerate(row['temperatures']):
                    if value is None:
                        continue
                    s = stats[i]
                    if s['max'] is None or value > s['max']:
                        s['max'], s['peak_at_ms'] = value, row['ts_ms']
                    s['min'] = value if s['min'] is None else min(s['min'], value)
                    s['sum'] += value; s['count'] += 1
                    bucket['sum'][i] += value; bucket['count'][i] += 1
                    for label, fn in [('minimum', min), ('maximum', max)]:
                        old = bucket[label][i]
                        bucket[label][i] = value if old is None else fn(old, value)
        for s in stats:
            s['average'] = round(s.pop('sum') / s['count'], 4) if s['count'] else None
        if n <= max_points:
            points = sorted(raw, key=lambda x: x['ts_ms'])
        else:
            points = []
            for _, b in sorted(bins.items()):
                points.append({'ts_ms': b['ts_ms'],
                    'temperatures': [round(v / c, 4) if c else None for v, c in zip(b['sum'], b['count'])],
                    'minimum': b['minimum'], 'maximum': b['maximum']})
        return {'count': n, 'points': points, 'aggregated': n > max_points,
                'bucket_ms': width if n > max_points else 0, 'stats': stats,
                'latest': latest, 'recent': [r for _, _, r in sorted(recent, reverse=True)],
                'fault_records': fault_records, 'max_delta': max_delta,
                'from_ms': start, 'to_ms': end}

    def export_csv(self, device: str, start: int, end: int) -> Iterator[str]:
        out = io.StringIO(); writer = csv.writer(out, delimiter=';')
        writer.writerow(['timestamp_utc', 'device_id', 'record_id', 'T1_nucleo_C', 'T2_centro_C',
                         'T3_forma_C', 'T4_ambiente_C', 'fault_T1', 'fault_T2', 'fault_T3', 'fault_T4',
                         'clock_quality'])
        yield '\ufeff' + out.getvalue(); out.seek(0); out.truncate(0)
        # One day at a time bounds sorting memory; retries can arrive out of order.
        first = datetime.fromtimestamp(start / 1000, UTC).date()
        last = datetime.fromtimestamp(end / 1000, UTC).date()
        while first <= last:
            lo = int(datetime.combine(first, datetime.min.time(), UTC).timestamp() * 1000)
            with self.lock:
                rows = sorted(self.range_rows(device, max(start, lo), min(end, lo + 86399999)), key=lambda r: r['ts_ms'])
            for row in rows:
                writer.writerow([datetime.fromtimestamp(row['ts_ms']/1000, UTC).isoformat(), device,
                    row['record_id'], *['' if v is None else str(v).replace('.', ',') for v in row['temperatures']],
                    *row['faults'], row['clock_quality']])
                yield out.getvalue(); out.seek(0); out.truncate(0)
            first += timedelta(days=1)
