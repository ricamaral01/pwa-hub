-- Tabela 1: Produção / Liberação (Antiga aba Pagina1)
CREATE TABLE IF NOT EXISTS public.producao (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    data_hora TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    setor TEXT NOT NULL,
    forma TEXT NOT NULL,
    modelo TEXT,
    tipo_concreto TEXT DEFAULT 'Padrão'::TEXT,
    colaborador TEXT,
    data_fabricacao DATE,
    status TEXT NOT NULL
);

-- Tabela 2: Usuários (Antiga aba usuarios_mapa)
CREATE TABLE IF NOT EXISTS public.usuarios (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    perfil TEXT NOT NULL,
    senha TEXT NOT NULL,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela 3: Montagem Poste (Antiga aba montagem_poste)
CREATE TABLE IF NOT EXISTS public.montagem_poste (
    id TEXT PRIMARY KEY, -- Equivalente à coluna 'key' (Ex: recordId||data||setor||forma)
    record_id TEXT,
    data_fabricacao DATE,
    setor TEXT,
    forma_numero TEXT,
    modelo TEXT,
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

-- Configuração do RLS (Row Level Security) - Habilitado mas com políticas abertas inicialmente para facilitar a migração.
-- RECOMENDADO: Restringir acesso depois utilizando o Supabase Auth.
ALTER TABLE public.producao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.montagem_poste ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acesso total à producao" ON public.producao FOR ALL USING (true);
CREATE POLICY "Permitir acesso total aos usuarios" ON public.usuarios FOR ALL USING (true);
CREATE POLICY "Permitir acesso total a montagem_poste" ON public.montagem_poste FOR ALL USING (true);
