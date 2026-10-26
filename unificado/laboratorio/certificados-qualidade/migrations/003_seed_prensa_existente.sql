-- Preserve the real equipment identity; the calibrating laboratory was absent
-- from the source record and must be completed before issuing.
INSERT INTO cq_prensas (fabricante,modelo,serie,patrimonio,capacidade_kn,classe,
                        certificado_calibracao,laboratorio_rbc,data_calibracao,validade,ativa)
SELECT 'Kratos','IK-14 A/P',e.numero_serie,'',NULL,'',e.certificado,
       'Não informado no cadastro de origem',e.data_calibracao,
       (e.data_calibracao + make_interval(months => e.validade_meses))::date,e.ativo
FROM ensaio_postes.equipamento e
WHERE e.numero_serie='2220879' AND e.certificado='2354/26'
  AND NOT EXISTS (SELECT 1 FROM cq_prensas p WHERE p.serie=e.numero_serie
                   AND p.certificado_calibracao=e.certificado);
