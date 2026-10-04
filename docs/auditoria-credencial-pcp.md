# Classificação de valores com aparência de credencial no backend PCP

Auditoria de 04/10/2026, sem registrar nem exibir os valores.

| Arquivo e linha | Variável | Classificação | Uso no oficial | Acesso que permitiria |
|---|---|---|---|---|
| `unificado/pcp/backend/app/core/config.py:10` | `SECRET_KEY` | Valor padrão literal de exemplo, com aparência de segredo; 45 caracteres. É usado apenas se nenhuma configuração externa o substituir. | **Não está em uso** nos processos ativos `pcp-concrefer.service` e `pcpconcrefer-api.service`: ambos têm `SECRET_KEY` no ambiente e no arquivo privado de configuração. O serviço PCP de testes também tem substituição no ambiente. | Se fosse usado como chave efetiva, permitiria assinar e validar tokens JWT do PCP. |
| `unificado/pcp/backend/app/core/config.py:7` | `DATABASE_URL` | URL local padrão com usuário e senha de exemplo. | **Não está em uso** nos dois processos oficiais nem no serviço de testes: todos têm `DATABASE_URL` no ambiente. | Com uma configuração real e rede acessível, daria acesso ao banco indicado; este valor padrão aponta apenas para uma instalação local de exemplo. |

`app/core/security.py:31` usa `settings.SECRET_KEY` para assinar JWTs e a linha 36
para validá-los. A auditoria leu apenas a presença dos nomes das variáveis nos
processos e arquivos privados; nenhum valor de segredo foi impresso ou incluído
no repositório. Os 47 arquivos copiados do backend PCP permanecem idênticos aos
do oficial.
