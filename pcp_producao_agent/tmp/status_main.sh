for s in concretrack-api.service; do echo ===$s===; systemctl show $s -p ExecStart --no-pager; systemctl status $s --no-pager -l | head -25; done
