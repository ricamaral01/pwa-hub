for s in concretrack-api.service; do echo ===$s===; systemctl show $s -p Environment -p EnvironmentFiles --no-pager; done
