import urllib.request
import json
url = "http://127.0.0.1:500/api/programacao?setor_id=3"
try:
    resp = urllib.request.urlopen(url)
    print(resp.read().decode()[:500])
except Exception as e:
    print(f"Error: {e}")
