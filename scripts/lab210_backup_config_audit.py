"""Complete and hash private configuration backups without changing any config."""
import hashlib,json,re,shutil,subprocess
from pathlib import Path
S=Path('/opt/concrefer-unificado/staging/lab210-production-20261122')
def main():
    reports=[]
    for name,prefix,key in [('release.json','config','unit_states'),('capacity.json','files','services')]:
        r=json.loads((S/name).read_text());b=Path(r['backup']);assert b.is_relative_to(Path('/opt/concrefer-unificado/backups'))
        units=list(r[key]) if name=='release.json' else [x['service'] for x in r[key] if not x['service'].startswith('docker:')]
        files=[]
        for unit in units:
            raw=subprocess.check_output(['systemctl','show',unit,'-p','FragmentPath','-p','DropInPaths','-p','EnvironmentFiles'],text=True)
            props={}
            for line in raw.splitlines():
                k,v=line.split('=',1);props[k]=(props.get(k,'')+' '+v).strip()
            paths=[props['FragmentPath'],*props['DropInPaths'].split(),*re.findall(r'(/[^ ]+) \(ignore_errors=',props.get('EnvironmentFiles',''))]
            for path in paths:
                source=Path(path)
                if not source.is_file():continue
                destination=b/prefix/path.lstrip('/');destination.parent.mkdir(parents=True,exist_ok=True)
                if destination.exists():assert source.read_bytes()==destination.read_bytes(),'Configuration changed since backup: '+path
                else:shutil.copy2(source,destination)
                destination.chmod(0o600);files.append({'service':unit,'source':path,'backup':str(destination),'sha256':hashlib.sha256(destination.read_bytes()).hexdigest()})
        r['configuration_backups_verified']=files;(S/name).write_text(json.dumps(r,indent=2))
        if name=='release.json' and (b/'rollback').is_dir():(b/'rollback/release.json').write_text(json.dumps(r,indent=2))
        reports.append({'receipt':name,'backup':str(b),'config_files':files,'source_configs_unchanged':True})
    print(json.dumps(reports))
if __name__=='__main__':main()
