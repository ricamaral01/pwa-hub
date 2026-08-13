# Fluxo do Operador — ConcreTrack Injeção

## Primeiro acesso (tablet novo)

1. Operador liga o tablet.
2. App abre em `/activate` — tela de ativação do dispositivo.
3. Administrador acessa a tela, copia o identificador UUID.
4. Administrador registra o dispositivo no sistema (backend).
5. Administrador preenche código e nome da máquina na tela.
6. Toca em **Ativar este dispositivo**.
7. App redireciona para `/login`.

> [!IMPORTANT]
> Se o tablet não estiver ativado, nenhum apontamento é permitido.
> A tela mostra claramente que é necessária ativação.

## Turno normal

### 1. Login do operador
1. Operador vê a tela de login exibindo a máquina vinculada.
2. Digita a **matrícula** no campo de texto.
3. Digita o **PIN** no teclado numérico grande (4 ou 6 dígitos).
4. Ao completar o PIN, o sistema valida automaticamente.
5. Operador entra na tela de apontamento (`/`).

### 2. Iniciar apontamento
1. Operador seleciona a **Ordem de Produção** no campo esquerdo.
2. O **Item** é preenchido automaticamente pela OP.
3. Operador seleciona o **Molde** (filtrado pelo item da OP).
4. Operador seleciona o **Lote de Resina** na coluna central.
5. **Resina, fornecedor, tipo e saldo** são preenchidos automaticamente.
6. Toca em **INICIAR APONTAMENTO**.
7. O cronômetro começa na coluna direita.

### 3. Durante a produção
- O apontamento fica persistido no IndexedDB.
- Se o tablet for recarregado, o apontamento é restaurado.
- O operador pode **salvar rascunho** a qualquer momento.
- Qualquer inatividade por 5 minutos bloqueia a tela (sem perder dados).

### 4. Registrar parada (ocorrência)
1. Operador toca em **Registrar parada** na faixa de ocorrências.
2. Seleciona o tipo de parada (P = Planejada, NP = Não-Planejada).
3. O cronômetro da parada começa.
4. Quando a parada termina, operador toca em **Encerrar parada**.
5. Se o tipo exige ação corretiva, o sistema bloqueia até que seja preenchida.

### 5. Concluir apontamento
1. Operador preenche as quantidades: peças boas, refugo, falha de preenchimento, borra, galho, outras perdas.
2. O sistema calcula a perda em tempo real e exibe o status visual.
3. Operador toca em **CONCLUIR APONTAMENTO**.
4. Se online: enviado diretamente para a API.
5. Se offline: enfileirado no IndexedDB com idempotency key.
6. Tela exibe confirmação de sucesso por 2,5 segundos.
7. Formulário é limpo. Sistema volta ao estado IDLE.

### 6. Trocar de operador
1. Operador toca no botão de troca de operador (ícone na TopBar).
2. Sessão atual é encerrada.
3. **O apontamento ativo NÃO é perdido** — fica salvo no IndexedDB.
4. Novo operador faz login.
5. O apontamento em andamento é restaurado automaticamente.

### 7. Cancelar apontamento
1. Operador toca em **Cancelar**.
2. Sistema exige justificativa (campo obrigatório).
3. Após confirmar, o apontamento é cancelado e o estado volta para IDLE.

## Comportamento offline

1. Quando a rede cai, o badge na TopBar muda para **Offline — N registros aguardando**.
2. O operador pode continuar apontando normalmente.
3. Os registros são salvos na fila local (IndexedDB).
4. Quando a rede retorna, a fila é processada automaticamente.
5. Se houver conflito de versão (HTTP 409), o registro é marcado como **conflito** e o supervisor é notificado.

## Bloqueio por inatividade

- Após 5 minutos sem toque, a tela é bloqueada.
- O apontamento ativo **não é perdido**.
- O operador pode desbloquear com o PIN.
- Outro operador pode fazer login na tela de desbloqueio.

## Estados visuais por prioridade

| Estado | Cor | Ícone | Borda | Mensagem |
|---|---|---|---|---|
| Em produção | Verde | ▶ | Verde sutil | "Em produção" |
| Parada ativa | Vermelho | ⏸ | Vermelho | "Parada: NP — [tipo]" |
| Perda normal | Verde | ✓ | Verde | "Normal — X%" |
| Perda atenção | Âmbar | ⚠ | Âmbar | "Atenção — X%" |
| Perda acima | Vermelho | ✕ | Vermelho | "Acima do limite — X%" |
| Perda crítica | Vermelho piscante | ‼ | Vermelho animado | "Crítico — X%" |
| Offline | Âmbar | ● | — | "Offline — N registros" |
| Erro de sync | Vermelho | ! | — | "Erro de sincronização" |
