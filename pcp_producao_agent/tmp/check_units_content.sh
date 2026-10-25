set +e
echo PED
curl -s -o /dev/null -w "%{http_code}\n" https://pederneiras.concrefer.com.br/estoque/entrada/
grep -n "Valor do Frete Unit?rio\|% ICMS do Frete\|freteBrutoTotal\|btnFotoNF" /var/www/concretrack-pederneiras/public/estoque/entrada/index.html | head -12
grep -n "frete_bruto_total\|val_percentuais\|nota-fiscal" /var/www/concretrack-pederneiras/api/routers/estoque.py | head -20
[ -f /var/www/concretrack-pederneiras/api/ai_providers.py ] && echo AI_PROVIDER_PED_OK

echo RIBE
curl -s -o /dev/null -w "%{http_code}\n" https://ribeirao.concretrack.com.br/concretrack/estoque/entrada/
grep -n "Valor do Frete Unit?rio\|% ICMS do Frete\|freteBrutoTotal\|btnFotoNF" /var/www/supervisorio_ribe/public/estoque/entrada/index.html | head -12
grep -n "frete_bruto_total\|val_icms_frete\|nota-fiscal" /var/www/supervisorio_ribe/api/routers/estoque.py | head -20
[ -f /var/www/supervisorio_ribe/api/ai_providers.py ] && echo AI_PROVIDER_RIBE_OK

echo NORO
curl -s -o /dev/null -w "%{http_code}\n" https://noro.concretrack.com.br/concretrack/estoque/entrada/
grep -n "Valor do Frete Unit?rio\|% ICMS do Frete\|freteBrutoTotal\|btnFotoNF" /var/www/supervisorio_noro/public/estoque/entrada/index.html | head -12
grep -n "frete_bruto_total\|val_icms_frete\|nota-fiscal" /var/www/supervisorio_noro/api/routers/estoque.py | head -20
[ -f /var/www/supervisorio_noro/api/ai_providers.py ] && echo AI_PROVIDER_NORO_OK
