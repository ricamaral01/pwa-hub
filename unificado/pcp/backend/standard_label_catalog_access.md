# Acesso ao catálogo das Etiquetas Padrão

O endpoint `/api/etiquetas-padrao/programacao` consulta `produto_id` e
`codigo_tipo_forma` no catálogo do PCP unificado. Aplique no banco
`pcp_unificado_teste`:

```sql
GRANT SELECT (produto_id, codigo_tipo_forma)
ON public.catalogo_tipos_forma TO pcp_unificado_app;
```
