-- Tabela 1: Producao / Liberacao (antiga aba Pagina1)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.producao (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    data_hora TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    setor TEXT NOT NULL,
    forma TEXT NOT NULL,
    modelo TEXT,
    codigo_poste TEXT,
    descricao_poste TEXT,
    codigo_produto TEXT,
    tipo_concreto TEXT DEFAULT 'Padrao'::TEXT,
    colaborador TEXT,
    data_fabricacao DATE,
    status TEXT NOT NULL
);

ALTER TABLE public.producao
    ADD COLUMN IF NOT EXISTS codigo_poste TEXT,
    ADD COLUMN IF NOT EXISTS descricao_poste TEXT,
    ADD COLUMN IF NOT EXISTS codigo_produto TEXT;

-- Tabela 2: Usuarios (antiga aba usuarios_mapa)
CREATE TABLE IF NOT EXISTS public.usuarios (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    perfil TEXT NOT NULL,
    senha TEXT NOT NULL,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela 3: Montagem Poste (antiga aba montagem_poste)
CREATE TABLE IF NOT EXISTS public.montagem_poste (
    id TEXT PRIMARY KEY,
    record_id TEXT,
    data_fabricacao DATE,
    setor TEXT,
    forma_numero TEXT,
    modelo TEXT,
    codigo_poste TEXT,
    descricao_poste TEXT,
    codigo_produto TEXT,
    status_montagem TEXT,
    motivo_recusa TEXT,
    etapa TEXT,
    inicio_inspecao_montagem TIMESTAMP WITH TIME ZONE,
    finalizado_em TIMESTAMP WITH TIME ZONE,
    checklists JSONB DEFAULT '{}'::jsonb,
    banco TEXT DEFAULT 'montagem_poste'::TEXT,
    observacoes_montagem TEXT,
    montador_nome TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.montagem_poste
    ADD COLUMN IF NOT EXISTS codigo_poste TEXT,
    ADD COLUMN IF NOT EXISTS descricao_poste TEXT,
    ADD COLUMN IF NOT EXISTS codigo_produto TEXT;

-- Tabela 4: Catalogo de postes Duplo T vinculado aos codigos das formas.
CREATE TABLE IF NOT EXISTS public.postes_duplo_t (
    codigo TEXT PRIMARY KEY,
    descricao TEXT NOT NULL,
    setor TEXT NOT NULL,
    codigo_produto TEXT NOT NULL,
    chaves_forma TEXT[] DEFAULT '{}'::text[],
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

INSERT INTO public.postes_duplo_t (codigo, descricao, setor, codigo_produto, chaves_forma) VALUES
    ('C', 'Padrao Completo 2 cx VR', 'Setor 2', '943', ARRAY['C']),
    ('D', 'Padrao Completo 2 cx VL', 'Setor 1', '941', ARRAY['D']),
    ('B', 'Padrao Completo 1 cx VL', 'Setor 2', '935', ARRAY['B']),
    ('A', 'Padrao Completo 1 cx VR', 'Setor 2', '938', ARRAY['A']),
    ('BD', 'Padrao Completo 1 cx VL (EDP)', 'Setor 1', '957', ARRAY['BD']),
    ('CE', 'Padrao Completo 2 cx VR Elektro', 'Setor 1', '4032', ARRAY['CE']),
    ('DE', 'Padrao Completo 2 cx VL Elektro', 'Setor 1', '4765', ARRAY['DE']),
    ('AE', 'Padrao Completo 1 cx VR Elektro', 'Setor 1', '4031', ARRAY['AE']),
    ('BE', 'Padrao Completo 1 cx VL Elektro', 'Setor 1', '4764', ARRAY['BE']),
    ('IE', 'Padrao Completo 3cxs VL Elektro', 'Setor 1', '4929', ARRAY['IE']),
    ('L', 'Padrao Completo 4 cx VR', 'Setor 1', '948', ARRAY['L']),
    ('J', 'Padrao Completo 4 cx VL', 'Setor 1', '947', ARRAY['J']),
    ('H', 'Padrao Completo 3 cx VR', 'Setor 1', '946', ARRAY['H']),
    ('I', 'Padrao Completo 3 cx VL', 'Setor 1', '945', ARRAY['I']),
    ('300-VR', 'Poste 2 cx VR (7,5 x 300)', 'Setor 1', '944', ARRAY['300-VR']),
    ('300-VL', 'Poste 2 cx VL (7,5 x 300)', 'Setor 1', '942', ARRAY['300-VL']),
    ('CM', 'Padrao Cemig 1 cx VL - 7,0 x150', 'Setor 1', '953', ARRAY['CM']),
    ('N', 'Poste 7,5 X 600 VL', 'Setor 1', '936', ARRAY['N']),
    ('M', 'Poste 7,5 X 600 VR', 'Setor 1', '939', ARRAY['M']),
    ('TCL', 'Poste 7,5 X 600 VL c/', 'Setor 2', '937', ARRAY['TCL']),
    ('TCR', 'Poste 7,5 X 600 VR c/', 'Setor 2', '940', ARRAY['TCR']),
    ('100', 'Poste Subterraneo 100 A', 'Setor 1', '949', ARRAY['100']),
    ('SB-E1', 'Poste Subterraneo 100 A - Elektro', 'Setor 1', '4848', ARRAY['SB-E1']),
    ('200', 'Poste Subterraneo 200 A - TC', 'Setor 1', '5017', ARRAY['200']),
    ('TOTEM', 'Totem de medicao indireta Elektro', 'Setor 4', '13570', ARRAY['TOTEM','A-TOTEM']),
    ('PL', 'Poste Visor Aereo 1 cx VL (7,5x300)', 'Setor 2', '934', ARRAY['PL']),
    ('CEMIG-5X150', 'Padrao Cemig 1CX - 5,0 x 150', 'Setor 4', '952', ARRAY['C-F1']),
    ('CEMIG-1VL', 'Padrao Cemig 1 cx VL - 7,0 x150', 'Setor 4', '953', ARRAY['R-G']),
    ('CEMIG-2VL', 'Padrao Cemig 2 cx VL - 7,0 x150', 'Setor 4', '954', ARRAY[]::text[]),
    ('E', 'Poste Economico 1CX VR', 'Setor 1', '931', ARRAY['E']),
    ('F', 'Poste Economico 1CX VL', 'Setor 1', '930', ARRAY['F']),
    ('G', 'Poste Economico 2CX VR', 'Setor 1', '932', ARRAY['G']),
    ('P', 'Poste Economico 3 CXS VR', 'Setor 1', '933', ARRAY['P']),
    ('DTB', 'Poste Duplo T Barreiras', 'Setor 4', '13580', ARRAY['DTB']),
    ('DTBM', 'Poste Duplo T Barreiras Médio', 'Setor 4', '13581', ARRAY['DTBM']),
    ('DTD', 'Poste Duplo T Especial D', 'Setor 4', '13582', ARRAY['DTD'])
ON CONFLICT (codigo) DO UPDATE SET
    descricao = EXCLUDED.descricao,
    setor = EXCLUDED.setor,
    codigo_produto = EXCLUDED.codigo_produto,
    chaves_forma = EXCLUDED.chaves_forma,
    ativo = true,
    updated_at = timezone('utc'::text, now());

-- RLS aberto inicialmente para manter compatibilidade com a chave anonima atual do PWA.
ALTER TABLE public.producao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.montagem_poste ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.postes_duplo_t ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir acesso total a producao" ON public.producao;
DROP POLICY IF EXISTS "Permitir acesso total aos usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Permitir acesso total a montagem_poste" ON public.montagem_poste;
DROP POLICY IF EXISTS "Permitir acesso total a postes_duplo_t" ON public.postes_duplo_t;

CREATE POLICY "Permitir acesso total a producao" ON public.producao FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso total aos usuarios" ON public.usuarios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso total a montagem_poste" ON public.montagem_poste FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso total a postes_duplo_t" ON public.postes_duplo_t FOR ALL USING (true) WITH CHECK (true);

-- Tabela 5: Programacao de Formas (para destacar no mapa de concretagem)
CREATE TABLE IF NOT EXISTS public.programacao (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    data_fabricacao DATE NOT NULL,
    setor TEXT NOT NULL,
    forma TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.programacao ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir acesso total a programacao" ON public.programacao;
CREATE POLICY "Permitir acesso total a programacao" ON public.programacao FOR ALL USING (true) WITH CHECK (true);

