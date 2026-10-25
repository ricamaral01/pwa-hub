# U07 — Aprovação de primeira ação MISTA

**Resultado:** `tbl_receitas` Campinas foi priorizada para estudo de escrita. O proprietário definiu `nome_traco` normalizado como chave de um **novo** cadastro. `write_preflight.py` consultou a fonte oficial em modo somente leitura e detectou uma chave existente e uma ausente; nove testes locais passaram. A API legada e a tabela original conservaram seus hashes/estrutura. A decisão mais recente do proprietário foi **manter API e banco antigos intactos e continuar somente leitura**. Nenhuma ação MISTA está aprovada para despacho.

**Limite:** a checagem antes do `POST /tracos` não impede concorrência com a tela legada; o endpoint não implementa idempotência nem conflito atômico. `criar`, `nova_revisao` e `alterar_ativa` permanecem desligadas.

## Pendências para aprovação

- Nenhuma aprovação de escrita é presumida. Para retomar U07, uma nova decisão explícita deve substituir o estado de somente leitura, nomeando **unidade, tabela, ação, perfis e responsável pela edição**.
- Essa decisão também precisa escolher como cumprir idempotência e conflito sem infringir a restrição de manter a API/banco antigos intactos. Sem solução demonstrada, a ação continua indisponível.
