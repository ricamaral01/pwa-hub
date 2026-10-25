"""Concretrack Temperatura - standalone/local API, no SQL dependency."""
from __future__ import annotations
import hmac, os, re
import json
import urllib.request
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Literal
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from filelock import FileLock, Timeout
from pydantic import BaseModel, ConfigDict, Field, model_validator
from sqlalchemy.exc import SQLAlchemyError
from .store import Store, now_ms
from .postes_api import router as postes_router, current_user
from .postes_certificates import router as postes_certificates_router
from .slump_api import router as slump_router
from .cec_api import router as cec_router
from cronoanalise.api import router as crono_router, CronoError, crono_error_handler
from .postes_db import connect as connect_postes, seed as seed_postes
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / '.env')
ID_PATTERN = r'^[A-Za-z0-9_-]{1,48}$'

class Strict(BaseModel):
    model_config = ConfigDict(extra='forbid', allow_inf_nan=False)

class Sample(Strict):
    seq: int = Field(ge=0, le=4294967295)
    ts_ms: int = Field(ge=1577836800000, le=4102444800000)
    temperatures: list[float | None] = Field(min_length=4, max_length=4)
    faults: list[int] = Field(min_length=4, max_length=4)
    clock_quality: Literal['server_sync', 'estimated_from_uptime'] = 'server_sync'

    @model_validator(mode='after')
    def valid_channels(self):
        for value, fault in zip(self.temperatures, self.faults):
            if not 0 <= fault <= 65535:
                raise ValueError('Fault deve estar entre 0 e 65535.')
            if value is not None and not -270 <= value <= 400:
                raise ValueError('Temperatura fora da faixa admitida para o projeto tipo T.')
            if fault and value is not None:
                raise ValueError('Canal com falha deve transmitir temperatura null, não zero.')
            if value is None and not fault:
                raise ValueError('Temperatura null requer código de falha.')
        return self

class Packet(Strict):
    device_id: str = Field(pattern=ID_PATTERN)
    boot_id: str = Field(pattern=r'^[a-fA-F0-9]{16,32}$')
    firmware: str = Field(max_length=40)
    interval_minutes: int = Field(ge=1, le=1440)
    config_revision: int = Field(ge=0)
    buffered: int = Field(ge=0, le=720)
    dropped: int = Field(ge=0)
    rssi: int = Field(ge=-127, le=0)
    clock_synced: bool
    live: Sample | None = None
    samples: list[Sample] = Field(default_factory=list, max_length=30)

class DeviceConfig(Strict):
    name: str = Field(min_length=1, max_length=100)
    interval_minutes: int = Field(ge=1, le=1440)
    concreted_at_ms: int | None = Field(default=None, ge=1577836800000, le=4102444800000)

class Event(Strict):
    label: str = Field(min_length=1, max_length=120)
    ts_ms: int = Field(ge=1577836800000, le=4102444800000)
    note: str = Field(default='', max_length=500)

def create_app(data_dir: Path | None = None, device_key: str | None = None, admin_key: str | None = None) -> FastAPI:
    unified_copy = os.getenv('LAB_UNIFIED_COPY') == '1'
    store = Store(Path(data_dir or os.getenv('DATA_DIR', str(ROOT / 'data'))))
    dkey = device_key or os.getenv('DEVICE_API_KEY', '')
    akey = admin_key or os.getenv('ADMIN_API_KEY', '')
    writer_lock = FileLock(str(store.root / '.writer.lock'))

    @asynccontextmanager
    async def lifespan(app):
        if not unified_copy and (min(len(dkey), len(akey)) < 24 or dkey == akey):
            raise RuntimeError('Execute python setup_local.py: as chaves devem ser distintas, com 24+ caracteres.')
        if not unified_copy:
            try:
                writer_lock.acquire(timeout=0)
            except Timeout as exc:
                raise RuntimeError('A pasta de dados já tem um processo escritor. Use --workers 1.') from exc
        try:
            yield
        finally:
            if not unified_copy:
                writer_lock.release()

    app = FastAPI(title='Concretrack Temperatura', version='1.0.0', lifespan=lifespan,
                  docs_url=None, redoc_url=None, openapi_url=None)
    app.state.store = store
    app.state.postes_session = None
    database_url = os.getenv('DATABASE_URL', '')
    if database_url:
        try:
            if unified_copy:
                app.state.postes_session = sessionmaker(create_engine(database_url, pool_pre_ping=True), expire_on_commit=False)
            else:
                app.state.postes_session = connect_postes(database_url)
                with app.state.postes_session() as session:
                    seed_postes(session)
        except SQLAlchemyError:
            # The existing ESP32 collection must stay available during a DB outage.
            app.state.postes_session = None
    app.include_router(postes_router)
    app.include_router(postes_certificates_router)
    app.include_router(slump_router)
    app.include_router(cec_router)
    app.include_router(crono_router)
    app.add_exception_handler(CronoError, crono_error_handler)

    def admin(request: Request, authorization: str = Header(default='')):
        if unified_copy:
            from .postes_api import gateway_user
            if gateway_user(request):
                return
            raise HTTPException(401, 'Sessão do sistema unificado inválida.')
        if akey and hmac.compare_digest(authorization, 'Bearer ' + akey):
            return
        try:
            factory = request.app.state.postes_session
            if factory:
                with factory() as session:
                    user = current_user(request, session)
                    if user.role in ('tecnico', 'engenheiro', 'admin'):
                        return
        except HTTPException:
            pass
        raise HTTPException(401, 'Faça login para acessar o painel.')

    def device(x_device_key: str = Header(default='')):
        if not dkey or not hmac.compare_digest(x_device_key, dkey):
            raise HTTPException(401, 'Chave do coletor inválida.')

    def check_id(value: str) -> str:
        if not re.fullmatch(ID_PATTERN, value):
            raise HTTPException(422, 'Identificação do coletor inválida.')
        return value

    def official_read(path: str):
        """Read live device state from the sole writer's memory; no file mutation."""
        req = urllib.request.Request('http://127.0.0.1:8088' + path,
                                     headers={'Authorization': 'Bearer ' + akey})
        with urllib.request.urlopen(req, timeout=5) as response:
            return json.load(response)

    def period(from_ms, to_ms):
        end = now_ms() if to_ms is None else to_ms
        start = end - 86400000 if from_ms is None else from_ms
        if start < 1577836800000 or end > 4102444800000 or end <= start or end - start > 31 * 86400000:
            raise HTTPException(422, 'Selecione um período válido de até 31 dias.')
        return start, end

    @app.exception_handler(OSError)
    async def disk_error(request, exc):
        return JSONResponse(status_code=503, content={'detail': 'Falha de armazenamento. Nenhum ACK seguro; verificar disco e permissões.'})

    @app.get('/health')
    def health():
        return {'ok': True, 'server_time_ms': now_ms(), 'version': '1.0.0'}

    @app.get('/')
    def page():
        if unified_copy:
            return FileResponse(ROOT / 'server' / 'static' / 'novo' / 'index.html', media_type='text/html; charset=utf-8', headers={'Cache-Control': 'no-store'})
        return FileResponse(ROOT / 'server' / 'static' / 'index.html', media_type='text/html; charset=utf-8', headers={'Cache-Control': 'no-store'})

    @app.get('/laboratorio-bridge.js')
    def bridge_script():
        return FileResponse(ROOT / 'server' / 'static' / 'laboratorio-bridge.js', media_type='application/javascript')

    @app.get('/laboratorio-embedded.css')
    def bridge_style():
        return FileResponse(ROOT / 'server' / 'static' / 'laboratorio-embedded.css', media_type='text/css')

    @app.get('/usinas-relatorios/')
    def usinas_relatorios_page():
        return FileResponse(ROOT / 'server' / 'static' / 'usinas-relatorios' / 'index.html', media_type='text/html; charset=utf-8', headers={'Cache-Control': 'no-store'})

    @app.get('/usinas-relatorios/{asset}')
    def usinas_relatorios_asset(asset: str):
        if asset not in {'native-areas.js', 'native-areas.css'}:
            raise HTTPException(404)
        return FileResponse(ROOT / 'server' / 'static' / 'usinas-relatorios' / asset)

    @app.get('/postes')
    def postes_page():
        return FileResponse(ROOT / 'server' / 'static' / 'postes' / 'index.html', media_type='text/html; charset=utf-8', headers={'Cache-Control': 'no-store'})

    @app.get('/slump')
    @app.get('/slump/')
    def slump_page():
        return FileResponse(ROOT / 'server' / 'static' / 'slump' / 'index.html', media_type='text/html; charset=utf-8', headers={'Cache-Control': 'no-store'})

    slump_static = ROOT / 'server' / 'static' / 'slump'
    app.mount('/slump', StaticFiles(directory=slump_static), name='slump-assets')

    cec_static = ROOT / 'server' / 'static' / 'cec'
    if cec_static.exists():
        app.mount('/cec', StaticFiles(directory=cec_static, html=True), name='cec')

    @app.get('/novo')
    def novo_page():
        return FileResponse(ROOT / 'server' / 'static' / 'novo' / 'index.html', media_type='text/html; charset=utf-8', headers={'Cache-Control': 'no-store'})

    @app.get('/novo/postes')
    def novo_postes_page():
        return FileResponse(ROOT / 'server' / 'static' / 'novo' / 'postes' / 'novo.html', media_type='text/html; charset=utf-8', headers={'Cache-Control': 'no-store'})

    crono_static = ROOT / 'server' / 'static' / 'cronoanalise'
    if (crono_static / 'assets').exists():
        app.mount('/cronoanalise/assets', StaticFiles(directory=crono_static / 'assets'), name='cronoanalise-assets')

    @app.get('/cronoanalise/metodologia-conteudo.html')
    def crono_methodology():
        return FileResponse(crono_static / 'metodologia-conteudo.html', media_type='text/html; charset=utf-8')

    @app.get('/cronoanalise')
    @app.get('/cronoanalise/{page:path}')
    def crono_page(page: str = ''):
        if page and page not in {'inicio', 'coletar', 'medicoes', 'catalogo', 'dimensionar', 'simular', 'metodologia'}:
            raise HTTPException(404)
        return FileResponse(crono_static / 'cronoanalise.html', media_type='text/html; charset=utf-8', headers={'Cache-Control': 'no-store'})

    novo_assets = ROOT / 'server' / 'static' / 'novo' / 'assets'
    if novo_assets.exists():
        app.mount('/novo/assets', StaticFiles(directory=novo_assets), name='novo-assets')
    novo_postes_assets = ROOT / 'server' / 'static' / 'novo' / 'postes' / 'assets'
    if novo_postes_assets.exists():
        app.mount('/novo/postes/assets', StaticFiles(directory=novo_postes_assets), name='novo-postes-assets')

    assets = ROOT / 'server' / 'static' / 'postes' / 'assets'
    if assets.exists():
        app.mount('/postes/assets', StaticFiles(directory=assets), name='postes-assets')

    @app.get('/api/v1/device-config/{device_id}', dependencies=[Depends(device)])
    def read_device_config(device_id: str):
        if unified_copy:
            raise HTTPException(404)
        return {**store.config(check_id(device_id)), 'server_time_ms': now_ms()}

    @app.post('/api/v1/ingest', dependencies=[Depends(device)])
    def ingest(packet: Packet):
        if unified_copy:
            raise HTTPException(404)
        if any(s.ts_ms > now_ms() + 300000 for s in [*packet.samples, *([packet.live] if packet.live else [])]):
            raise HTTPException(422, 'Horário futuro superior a 5 minutos; verificar relógio do servidor/coletor.')
        try:
            ack = store.ingest(packet.model_dump())
        except ValueError as exc:
            raise HTTPException(409, str(exc)) from exc
        return {'ok': True, 'ack': ack, 'server_time_ms': now_ms()}

    @app.get('/api/v1/devices', dependencies=[Depends(admin)])
    def devices():
        if unified_copy:
            return official_read('/api/v1/devices')
        return {'devices': store.devices(), 'server_time_ms': now_ms()}

    @app.get('/api/v1/devices/{device_id}', dependencies=[Depends(admin)])
    def status(device_id: str):
        if unified_copy:
            return official_read('/api/v1/devices/' + check_id(device_id))
        return store.status(check_id(device_id))

    @app.put('/api/v1/devices/{device_id}/config', dependencies=[Depends(admin)])
    def config(device_id: str, cfg: DeviceConfig):
        if unified_copy:
            raise HTTPException(403, 'Disponível na tela oficial.')
        return store.save_config(check_id(device_id), cfg.model_dump())

    @app.post('/api/v1/devices/{device_id}/events', dependencies=[Depends(admin)])
    def event(device_id: str, ev: Event):
        if unified_copy:
            raise HTTPException(403, 'Disponível na tela oficial.')
        try:
            return store.event(check_id(device_id), ev.model_dump())
        except ValueError as exc:
            raise HTTPException(409, str(exc)) from exc

    @app.get('/api/v1/devices/{device_id}/history', dependencies=[Depends(admin)])
    def history(device_id: str, from_ms: int | None = None, to_ms: int | None = None,
                max_points: int = Query(default=600, ge=50, le=2000)):
        start, end = period(from_ms, to_ms)
        return store.history(check_id(device_id), start, end, max_points)

    @app.get('/api/v1/devices/{device_id}/export.csv', dependencies=[Depends(admin)])
    def export(device_id: str, from_ms: int | None = None, to_ms: int | None = None):
        start, end = period(from_ms, to_ms)
        dev = check_id(device_id)
        return StreamingResponse(store.export_csv(dev, start, end), media_type='text/csv; charset=utf-8',
           headers={'Content-Disposition': f'attachment; filename="temperatura_{dev}.csv"'})

    @app.get('/api/v1/storage', dependencies=[Depends(admin)])
    def storage():
        files = list((store.root / 'readings').rglob('*.ndjson*'))
        return {'format': 'NDJSON / gzip', 'files': len(files), 'bytes': sum(p.stat().st_size for p in files),
                'sql': False, 'writer_processes': 1}

    return app

app = create_app()
