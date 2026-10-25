ALTER TABLE cq_parametros
  ADD COLUMN IF NOT EXISTS resp_laboratorio_padrao text NOT NULL DEFAULT 'Ricardo Do Amaral';
