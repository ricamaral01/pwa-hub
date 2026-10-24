# T9 — PWA Produção Pederneiras

Instalador separado em `/unificado/producao/pederneiras/app/`, com manifesto e service worker próprios. Telas Hoje, Lançar e Revisar e enviar; botões de 44 px, total ao vivo, busca, famílias, repetição e confirmação. O shell é armazenado pelo service worker e as leituras recentes e gravações offline ficam no armazenamento local do próprio app. Ao reconectar, a fila sincroniza em ordem; conflitos de API mantêm os itens pendentes para revisão. A confirmação exige conexão e fila vazia.

Evidência visual com API sintética: [captura celular](prints/09-pwa-producao-mobile.png). `tests/pederneiras/test_ui_smoke.py` verificou fila offline → reconexão → envio por API simulada. A validação de instalação em aparelhos reais ainda é necessária.
