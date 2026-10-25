# Continuação da implantação da Dosagem v2 — Curva de Abrams

Data: 21/10/2026 (America/Sao_Paulo)

## Implementação

- A ferramenta **Curva de Abrams** agora recebe os pontos de ensaio (a/c, resistência aos 28 dias e água), ajusta os modelos potência e exponencial e mostra **A, B, k1, k2, R²** e a tabela de projeto com fck, desvio padrão, fcj, a/c, água, cimento e indicação de extrapolação.
- A tela usa `fitAbrams41` e `projectAbrams41`, os mesmos cálculos do golden P2 em TypeScript e Python. Os valores iniciais são o exemplo P2 e trazem aviso explícito para substituição por ensaios medidos.
- O resultado tabular é uma região acessível por teclado no celular.
- O fluxo E2E **R1-03** verifica coeficientes, tabela e axe nos quatro tamanhos com API real.

## Portões

| Perfil | Resultado |
|---|---|
| `npm run gates` | **F1 e F2 verdes. F3 e F4 vermelhos.** Build, 24/24 testes E2E existentes, backup/restauração e N−1 passaram. O mínimo obrigatório é 56 testes; o auditor ainda aponta R1-01, R1-02, R1-04 a R1-12 e R1-14 ausentes nos quatro tamanhos. Registro em `GATES.json`, encerrado em 21/10/2026 21:20:40 BRT. |
| `npm run gates -- --perfil piloto` | **P-F1 a P-F4 verdes.** P-F3 e P-F4 passaram 32/32 E2E cada, incluindo R1-03; backup/restauração e N−1 passaram. Registro em `GATES-PILOTO.json`, encerrado em 21/10/2026 21:25:11 BRT. |

Na primeira tentativa de F3, a porta 18444 estava ocupada pela homologação direcionada. A instância foi encerrada; a terceira tentativa do compose e os 24 testes E2E prosseguiram. Isso não explica o vermelho de F3/F4, que decorre da cobertura obrigatória ausente.

## Publicação no piloto

- Release ativa: `/opt/concretrack-dosagem/releases/20261021-frontend-abrams-piloto`.
- Rollback preservado: `/opt/concretrack-dosagem/releases/20261021-frontend-layout-piloto`.
- Pacote frontend: `pilot-web-abrams-20261021.tar.gz`, SHA-256 `bb21410e997606f53bd9578e6f5b8da82d1b2239311e2abeb3ed77679efdc2ff`, igual local e remoto.
- Apenas `web` foi substituído. API, banco, credenciais e `.env` não mudaram.
- `https://dosagem.concretrack.com.br/` e o bundle `/assets/index-BibV0N-o.js` responderam HTTP 200; o bundle contém a nova ferramenta e o aviso de exemplo. `/api/v1/saude` respondeu HTTP 200, `banco=ok`, `piloto=true`.
- Nove sites vizinhos conservaram os códigos 200/200/301/302/302/200/200/200/200.

## Próxima sessão

Implementar e verificar os 12 fluxos R1 ainda ausentes, em quatro tamanhos com axe e API real, até F1–F4 ficarem verdes. Só então preparar a virada oficial e decidir o destino dos dados piloto. O legado permanece oficial e o aviso PILOTO continua visível.
