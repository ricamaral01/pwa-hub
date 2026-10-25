# Pacote Codex — Mão de Obra mobile (PWA)

## Onde extrair

Extraia o zip na **raiz do repositório do Unificado**, de modo que fique assim:

```
<repositório>/
└── docs/
    └── maodeobra-mobile/
        ├── README.md                 ← este arquivo
        ├── PROMPT_CODEX.md           ← texto para colar no Codex
        ├── maodeobra-mobile-pwa.md   ← especificação e plano
        └── mockups/
            ├── png/                  ← telas 00 a 06 (imagens)
            └── fonte/                ← HTML de referência de cada tela
```

**Não extraia dentro de `unificado/`** nem de outra pasta publicada pelo servidor: isto é documentação, não
deve ir para produção. Se o repositório não tiver `docs/`, crie.

## Como usar

1. Extraia como acima e faça commit (ex.: `docs: especificação Mão de Obra mobile`).
2. Abra o Codex no repositório e cole o conteúdo de `PROMPT_CODEX.md`.
3. O Codex começa pela etapa 1 (protótipo) e para para aprovação. Compare com os PNGs.

## Telas

| Arquivo | Tela |
|---------|------|
| `00-instalar.png` | Instalar app (Android: botão; iPhone: passo a passo) |
| `01-lancamento.png` | Lançamento diário (S1/S2) |
| `02-conferencia.png` | Conferir antes de enviar |
| `03-enviado.png` | Confirmação do servidor |
| `04-erro.png` | Não enviado — valores preservados |
| `05-sem-producao.png` | Confirmar dia sem produção |
| `06-historico.png` | Histórico por dia e grupo |

Os dados nas telas são exemplos. As atividades reais vêm do cadastro atual.
