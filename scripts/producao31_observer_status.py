"""Fetch the current observation evidence without printing its entire time series."""
import json
from producao31_common import remote,save,S
data=remote("import json\nfrom pathlib import Path\ns=Path("+repr(S)+");o=json.loads((s/'observation.json').read_text());o['monitor_error']=json.loads((s/'observation-error.json').read_text()) if (s/'observation-error.json').exists() else None;print(json.dumps(o))")
save('observation.json',data);print(json.dumps({k:v for k,v in data.items() if k not in ['samples','events']}));assert not data['monitor_error'] and not data['rolled_back'] and not data['critical_events'],data
