"""Repeatable read-only source to isolated test photo storage copy.

Run from the operator workspace with SSH aliases vps-rh and vps-staging.
Copies only missing source files, refuses conflicts or extra destination files,
and verifies per-file SHA-256, total bytes, file count and index row count.
"""

from __future__ import annotations

import json
import re
import subprocess


SOURCE = "/opt/mapaproducao-storage"
TARGET = "/opt/mapa-unificado-photo-storage"
REMOTE_MANIFEST = r'''
import hashlib,json,os,pathlib,sys
root=pathlib.Path(sys.argv[1]).resolve()
if not root.is_dir(): raise SystemExit('storage directory missing')
files={}
for entry in root.iterdir():
    if entry.is_symlink() or not entry.is_file() or not entry.name.replace('.','').replace('-','').isalnum():
        raise SystemExit('unexpected storage entry')
    data=entry.read_bytes()
    files[entry.name]={'size':len(data),'sha256':hashlib.sha256(data).hexdigest()}
index=json.loads((root/'fotos-inspecao.json').read_text(encoding='utf-8'))
if not isinstance(index,list): raise SystemExit('invalid photo index')
print(json.dumps({'files':files,'photos':len(index),'bytes':sum(v['size'] for k,v in files.items() if k!='fotos-inspecao.json')},sort_keys=True))
'''


def manifest(alias: str, directory: str) -> dict:
    result = subprocess.run(["ssh", alias, "python3", "-", directory], input=REMOTE_MANIFEST,
                            text=True, capture_output=True, check=True)
    return json.loads(result.stdout)


def main() -> None:
    source = manifest("vps-rh", SOURCE)
    target = manifest("vps-staging", TARGET)
    if "fotos-inspecao.json" not in source["files"] or "fotos-inspecao.json" not in target["files"]:
        raise SystemExit("Photo index missing")
    extra = set(target["files"]) - set(source["files"])
    if extra:
        raise SystemExit("Test storage contains extra files; inspect before copying")
    index_name = "fotos-inspecao.json"
    source_index = source["files"][index_name]
    target_index = target["files"][index_name]
    if target_index != source_index and target["photos"] > source["photos"]:
        raise SystemExit("Test photo index has additional records; refusing overwrite")
    copied = []
    for name, checksum in source["files"].items():
        if name == index_name:
            continue
        if not re.fullmatch(r"[A-Za-z0-9._-]+", name):
            raise SystemExit("Unexpected source filename")
        existing = target["files"].get(name)
        if existing and existing != checksum:
            raise SystemExit("Conflicting test photo file; refusing overwrite")
        if not existing:
            subprocess.run(["scp", "-3", f"vps-rh:{SOURCE}/{name}",
                            f"vps-staging:{TARGET}/{name}"], check=True)
            copied.append(name)
    if target_index != source_index:
        subprocess.run(["scp", "-3", f"vps-rh:{SOURCE}/{index_name}",
                        f"vps-staging:{TARGET}/{index_name}"], check=True)
        copied.append(index_name)
    if copied:
        adjust = r'''
import os,pathlib,sys
root=pathlib.Path(sys.argv[1]).resolve()
expected=pathlib.Path('/opt/mapa-unificado-photo-storage').resolve()
if root!=expected: raise SystemExit('wrong destination')
for name in sys.argv[2:]:
    p=(root/name).resolve()
    if p.parent!=root or not p.is_file(): raise SystemExit('wrong copied path')
    os.chown(p,33,33)
    p.chmod(0o600)
'''
        subprocess.run(["ssh", "vps-staging", "python3", "-", TARGET, *copied],
                       input=adjust, text=True, check=True)
    final = manifest("vps-staging", TARGET)
    if final != source:
        raise SystemExit("Photo count/bytes/hash verification failed")
    print(f"photos={source['photos']} files={len(source['files'])-1} bytes={source['bytes']} copied={len(copied)} verified=True")


if __name__ == "__main__":
    main()
