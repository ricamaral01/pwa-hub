import os
import sys

import paramiko


host = os.environ["SSH_HOST"]
password = os.environ["SSH_PASS"]
user = os.environ.get("SSH_USER", "root")
script_path = sys.argv[1]
with open(script_path, "r", encoding="utf-8") as handle:
    script = handle.read()

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(hostname=host, username=user, password=password, timeout=20, look_for_keys=False, allow_agent=False)
stdin, stdout, stderr = client.exec_command("bash -s", get_pty=False)
stdin.write(script)
stdin.flush()
stdin.close()
out = stdout.read().decode("utf-8", errors="replace")
err = stderr.read().decode("utf-8", errors="replace")
code = stdout.channel.recv_exit_status()
client.close()
if out:
    sys.stdout.buffer.write(out.encode("utf-8", errors="replace"))
if err:
    sys.stderr.buffer.write(err.encode("utf-8", errors="replace"))
sys.exit(code)
