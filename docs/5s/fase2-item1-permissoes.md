# 5S — Fase 2, item 1: permissões públicas

**Execução:** 17/10/2026, aproximadamente 21h52–21h55 (São Paulo; snapshot na VPS em 18/10 00h52 UTC). **Escopo exclusivo:** `/opt/concrefer-unificado/public` e `/opt/concrefer-unificado/homolog-next/public` na VPS nova. Nenhum upload fora do público, banco, código, Nginx ou serviço foi alterado.

## Snapshot e retorno

- Snapshot de modo/dono/grupo de **441 caminhos**, anterior à alteração: `/root/backups/5s-permissions-20261018T005223Z/modes-before.tsv` (SHA-256 `ed719818f06e472f0f3d35b8dcc186f65413723b04c602b660aa11f66c89fd07`). Inclui os diretórios `public` de produção e teste, seus filhos e `namei` das duas cascas. Arquivos do snapshot com modo 600, fora do público.
- Estado final: `modes-after.tsv` no mesmo diretório (SHA-256 `166bd2cfe3908309cd35a0d63d41d61e78ead7ee6af3748366fdb3c59f8f8a93`). Os 441 caminhos continuam presentes; comparação caminho a caminho confirmou apenas as mudanças de modo previstas, **sem mudança de dono/grupo**. O snapshot anterior permite restaurar o modo de cada caminho se uma regressão posterior for atribuída a esta etapa. Nenhum retorno foi necessário.

| Ambiente | Diretórios 777→755 | Arquivos 666→644 | Outros metadados alterados |
|---|---:|---:|---:|
| Teste `:18446` | 35 | 82 | 0 |
| Produção | 31 (inclui o próprio `public`) | 76 | 0 |
| **Total** | **66** | **158** | **0** |

## Sequência e verificações

1. Antes da mudança, gate de produção **7/7**. No teste, o PCP anônimo retorna **401**, ao contrário do **403** de produção; o gate de teste passou **7/7** ao usar a expectativa correta `PCP_ANON_EXPECTED=401`. Não se mudou nenhuma regra de autenticação.
2. Snapshot acima. Ensaio no teste: `find ... -type d -perm 0777 -exec chmod 755 {} +` e `find ... -type f -perm 0666 -exec chmod 644 {} +`, somente na árvore pública do `homolog-next`. Sobraram **0** caminhos com esses modos. Comparação com snapshot: exatamente **117** mudanças previstas, sem troca de dono/grupo.
3. Como `www-data`, leitura **8/8**: casca, login, entrada PWA, manifest, ícone, menu Modelo A, JS da Mão de Obra e CSS do Mapa. HTTP **200 em 8/8** nas mesmas rotas públicas do `:18446`. Gate de teste pós-mudança **7/7** (casca, login, PCP, Mapa, Laboratório, Qualidade, QR GED).
4. Aplicação em produção com os mesmos comandos, limitada ao `public` de produção. Sobraram **0** caminhos com modo 777/666. Leitura `www-data` **8/8**, HTTP **200 em 8/8** e gate pós-mudança **7/7**. PCP anônimo permaneceu **403** na produção.
5. Comparação final dos 441 caminhos: **224 diferenças esperadas** (117 teste + 107 produção); **0 diferenças inesperadas**. Nenhum arquivo foi movido/apagado e nenhum conteúdo foi editado.

## Parada

O item 1 está concluído. **Itens 2–6 não iniciados.** Aguardar aprovação específica para iniciar o item 2 (índice Git e detector de segredos). A proposta Seiton permanece adiada.
