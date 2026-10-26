"""Insert the more-specific CQ route ahead of the general laboratory route."""
import sys
from pathlib import Path


target=Path(sys.argv[1]); fragment=Path(sys.argv[2]).read_text(encoding='utf-8')
raw=target.read_text(encoding='utf-8')
if 'location ^~ /unificado/laboratorio/certificados-qualidade/' not in raw:
    anchor='    location ^~ /unificado/laboratorio/ {'
    if raw.count(anchor)!=1: raise RuntimeError('Unexpected Nginx snippet layout')
    raw=raw.replace(anchor,fragment+'\n'+anchor,1)
if 'location ^~ /v/' not in raw and 'location ^~ /v/' in fragment:
    anchor='    location ^~ /unificado/laboratorio/ {'
    verification='    location ^~ /v/ {'+fragment.split('    location ^~ /v/ {',1)[1]
    raw=raw.replace(anchor,verification+'\n'+anchor,1)
start=raw.index('location ^~ /unificado/laboratorio/certificados-qualidade/')
end=raw.index('\n    }',start)
section=raw[start:end].replace('client_max_body_size 1m;','client_max_body_size 8m;')
raw=raw[:start]+section+raw[end:]
target.write_text(raw,encoding='utf-8')
print('CQ route present in',target)
