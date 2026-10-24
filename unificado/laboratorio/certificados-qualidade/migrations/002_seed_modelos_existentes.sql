-- Idempotent read of the Laboratory's existing pole catalog; source is not modified.
INSERT INTO cq_modelos_poste (modelo,altura_m,carga_dan,peso_kg)
SELECT left(btrim(descricao),64),altura_m,"resistencia_daN",NULL
FROM ensaio_postes.poste_modelo
WHERE ativo AND nullif(btrim(descricao),'') IS NOT NULL
ON CONFLICT (modelo) DO NOTHING;
