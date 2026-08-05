# Privacidade da biometria facial

Finalidade: autenticar operadores autorizados em tablets vinculados a maquinas.

Dados tratados: template biometrico criptografado, qualidade, modelo, versao,
status, datas de emissao, utilizacao e revogacao, e eventos de auditoria sem foto
ou embedding bruto.

Retencao: manter apenas enquanto a finalidade operacional e a base legal estiverem
validas. Revogacao bloqueia novo uso; exclusao remove o template.

Acessos: cadastro, teste, consulta, auditoria, revogacao e exclusao dependem das
permissoes `biometria.*`. Login facial depende de `operadores.autenticar_face`.

Fallback: matricula e PIN permanecem obrigatorios como contingencia. Supervisor
pode bloquear e solicitar recadastro.

Incidentes: revogar templates afetados, bloquear feature flag, preservar eventos
sem dados biometricos crus e registrar decisao administrativa.
