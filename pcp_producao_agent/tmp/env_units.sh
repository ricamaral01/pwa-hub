for s in concretrack-pederneiras.service supervisorio-ribeirao.service supervisorio_noro.service; do echo ===$s===; systemctl show $s -p Environment -p EnvironmentFiles --no-pager; done
