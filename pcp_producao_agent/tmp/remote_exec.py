import os
import sys

import paramiko


host = os.environ["SSH_HOST"]
password = os.environ["SSH_PASS"]
user = os.environ.get("SSH_USER", "root")
command = sys.argv[1]

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(hostname=host, username=user, password=password, timeout=20, look_for_keys=False, allow_agent=False)
stdin, stdout, stderr = client.exec_command(command, get_pty=True)
out = stdout.read().decode("utf-8", errors="replace")
err = stderr.read().decode("utf-8", errors="replace")
code = stdout.channel.recv_exit_status()
client.close()
if out:
    print(out, end="")
if err:
    print(err, end="", file=sys.stderr)
sys.exit(code)
