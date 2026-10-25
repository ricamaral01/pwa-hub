import os
import sys

import paramiko


host = os.environ["SSH_HOST"]
password = os.environ["SSH_PASS"]
user = os.environ.get("SSH_USER", "root")
mode, src, dst = sys.argv[1:4]

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(hostname=host, username=user, password=password, timeout=20, look_for_keys=False, allow_agent=False)
sftp = client.open_sftp()
if mode == "get":
    sftp.get(src, dst)
elif mode == "put":
    sftp.put(src, dst)
else:
    raise SystemExit(f"unknown mode: {mode}")
sftp.close()
client.close()
