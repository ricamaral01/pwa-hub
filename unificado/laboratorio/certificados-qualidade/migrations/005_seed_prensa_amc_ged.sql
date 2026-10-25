-- GED verification d06562a5-5e89-4e24-9c27-8ec786de86ff and the
-- calibration PDF M-0397/26 identify a separate AMC 2TQC press. The issuer
-- is Técnica Paraíso Ltda - EPP. IPT RBC Cal 0003 calibrated its reference
-- load cell, not this press; do not attribute the press calibration to IPT.
INSERT INTO cq_prensas (
    fabricante, modelo, serie, patrimonio, capacidade_kn, classe,
    certificado_calibracao, laboratorio_rbc, data_calibracao, validade, ativa
)
SELECT 'AMC', '2TQC', 'S/N', '2TQC-226', 1000, '',
       'M-0397/26', 'Técnica Paraíso Ltda - EPP',
       DATE '2026-07-10', DATE '2027-07-10', true
WHERE NOT EXISTS (
    SELECT 1 FROM cq_prensas
    WHERE fabricante = 'AMC' AND modelo = '2TQC'
      AND certificado_calibracao = 'M-0397/26'
      AND patrimonio = '2TQC-226'
);
