// Fase 1: a casca não autentica nem envia credenciais.
// A integração das duas sessões depende do ambiente de teste isolado e da
// decisão registrada em docs/plano-unificacao.md.
window.UnificadoAuth = Object.freeze({
  phase: 1,
  enabled: false
});
