# Avaliacao de impacto biometrica

Escopo: autenticacao 1:N restrita a operadores ativos da mesma empresa e unidade,
somente em dispositivo ativo e maquina vinculada.

Riscos:
- falso positivo;
- falso negativo;
- ambiguidade entre colaboradores;
- uso sem governanca;
- vazamento de template criptografado;
- indisponibilidade de camera ou rede.

Mitigacoes:
- feature flag desativada por padrao;
- AES-256-GCM com chave exclusiva do ambiente;
- threshold e margem minima;
- prova de presenca com multiplos frames;
- bloqueio por tentativas;
- auditoria sem imagens;
- fallback por PIN;
- proibicao de reconhecimento offline.

Limitacoes: a prova de presenca reduz risco, mas nao declara protecao absoluta
contra fraude. Teste fisico com tablet real e iluminacao industrial e obrigatorio
antes de piloto.

## Checklist de teste fisico controlado

1. Instalar/confiar na CA local no tablet.
2. Abrir a URL HTTPS do tablet.
3. Permitir camera.
4. Cadastrar biometria no desktop com colaborador adulto autorizado.
5. Confirmar que nenhuma foto foi armazenada.
6. Testar login frontal.
7. Testar angulo moderado.
8. Testar iluminacao normal.
9. Testar pessoa nao cadastrada.
10. Testar foto impressa.
11. Testar fotografia em outra tela.
12. Testar dois rostos.
13. Revogar biometria.
14. Confirmar bloqueio.
15. Validar fallback por PIN.
