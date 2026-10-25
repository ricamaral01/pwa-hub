CREATE TABLE IF NOT EXISTS ensaio_postes.slump_registro (
    id varchar(36) PRIMARY KEY,
    massada char(6) NOT NULL CHECK (massada ~ '^[0-9]{6}$'),
    tipo varchar(5) NOT NULL CHECK (tipo IN ('slump', 'flow')),
    valor numeric(6,2) NOT NULL CHECK (valor > 0 AND valor <= 9999.99),
    unidade varchar(2) NOT NULL CHECK ((tipo = 'slump' AND unidade = 'cm') OR (tipo = 'flow' AND unidade = 'mm')),
    medido_em timestamptz NOT NULL,
    origem_horario varchar(10) NOT NULL CHECK (origem_horario IN ('automatico', 'manual')),
    criado_em timestamptz NOT NULL DEFAULT now(),
    criado_por varchar(200) NOT NULL
);

CREATE INDEX IF NOT EXISTS slump_registro_criado_em_idx
    ON ensaio_postes.slump_registro (criado_em DESC);
