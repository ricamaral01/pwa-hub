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
