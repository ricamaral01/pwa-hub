import sys

with open('/opt/pcp-concrefer/app/api/routers/pcp.py', 'r') as f:
    lines = f.read().splitlines()

# Comment out the Depends require_roles for /programacao (line 259)
for i, line in enumerate(lines):
    if '@router.get("/programacao"' in line:
        # found the endpoint. The Depends is a few lines below.
        for j in range(i, i+10):
            if '_=Depends(require_roles(' in lines[j]:
                lines[j] = '# ' + lines[j]
                break
        break

with open('/opt/pcp-concrefer/app/api/routers/pcp.py', 'w') as f:
    f.write('\n'.join(lines) + '\n')

print("Patched!")
