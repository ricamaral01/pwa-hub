set +e
echo MAIN_PAGE
curl -s -o /dev/null -w "%{http_code}\n" https://dautomacao.com/concretrack/estoque/entrada/
grep -n "Valor do Frete Unit?rio\|% ICMS do Frete\|freteBrutoTotal" /var/www/concretrack-erp/public/estoque/entrada/index.html
grep -n "frete_bruto_total\|val_icms_frete_perc" /var/www/concretrack-erp/api/routers/estoque.py
