-- ==============================================================================
-- SCHEMA SUPABASE POSTGRESQL + POLÍTICAS RLS (ROW LEVEL SECURITY)
-- App Simulado Prático Detran (Brasil) — Resolução Contran nº 1.020/2025
-- ==============================================================================

-- 1. Criação das Tabelas Principais
CREATE TABLE IF NOT EXISTS public.organizacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('autonomo', 'autoescola')),
  uf_padrao TEXT NOT NULL DEFAULT 'MA',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.instrutores (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE RESTRICT,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  telefone TEXT,
  registro_detran TEXT,
  uf TEXT NOT NULL DEFAULT 'MA',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.perfis_regras (
  id TEXT PRIMARY KEY,
  uf TEXT NOT NULL,
  nome TEXT NOT NULL,
  versao_norma TEXT NOT NULL,
  limite_aprovacao INTEGER NOT NULL DEFAULT 10,
  peso_leve INTEGER NOT NULL DEFAULT 1,
  peso_media INTEGER NOT NULL DEFAULT 2,
  peso_grave INTEGER NOT NULL DEFAULT 4,
  peso_gravissima INTEGER NOT NULL DEFAULT 6,
  limite_incapacidade_tecnica INTEGER NOT NULL DEFAULT 2,
  primeira_incapacidade_gera_leve BOOLEAN NOT NULL DEFAULT TRUE,
  tempo_minimo_segundos INTEGER,
  ativo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS public.catalogo_infracoes (
  id TEXT PRIMARY KEY,
  artigo_ctb TEXT NOT NULL,
  descricao TEXT NOT NULL,
  natureza TEXT NOT NULL CHECK (natureza IN ('leve', 'media', 'grave', 'gravissima')),
  pontos INTEGER NOT NULL,
  categorias_aplicaveis JSONB NOT NULL,
  agrupamento_ux TEXT NOT NULL,
  fonte TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS public.alunos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE RESTRICT,
  instrutor_id UUID NOT NULL REFERENCES public.instrutores(id) ON DELETE RESTRICT,
  nome TEXT NOT NULL,
  telefone TEXT,
  categoria_pretendida TEXT NOT NULL CHECK (categoria_pretendida IN ('A', 'B', 'AB')),
  tipo_cambio TEXT NOT NULL DEFAULT 'manual' CHECK (tipo_cambio IN ('manual', 'automatico')),
  consentimento_lgpd BOOLEAN NOT NULL DEFAULT FALSE,
  consentimento_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.simulados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE RESTRICT,
  instrutor_id UUID NOT NULL REFERENCES public.instrutores(id) ON DELETE RESTRICT,
  aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  perfil_regra_id TEXT NOT NULL REFERENCES public.perfis_regras(id),
  categoria TEXT NOT NULL CHECK (categoria IN ('A', 'B')),
  tipo_cambio TEXT NOT NULL CHECK (tipo_cambio IN ('manual', 'automatico')),
  status TEXT NOT NULL CHECK (status IN ('EM_ANDAMENTO', 'APROVADO', 'REPROVADO', 'NAO_CONCLUIDO', 'ELIMINADO')),
  pontos_totais INTEGER NOT NULL DEFAULT 0,
  nota_final INTEGER,
  contador_incapacidade_tecnica INTEGER NOT NULL DEFAULT 0,
  motivo_encerramento TEXT,
  observacoes_instrutor TEXT,
  iniciado_em TIMESTAMPTZ NOT NULL,
  finalizado_em TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.simulado_eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulado_id UUID NOT NULL REFERENCES public.simulados(id) ON DELETE CASCADE,
  infracao_id TEXT REFERENCES public.catalogo_infracoes(id),
  tipo_evento TEXT NOT NULL CHECK (tipo_evento IN ('INFRACAO', 'INCAPACIDADE_TECNICA', 'ELIMINACAO', 'NAO_CONCLUIDO')),
  natureza_snapshot TEXT,
  pontos_snapshot INTEGER NOT NULL DEFAULT 0,
  descricao_snapshot TEXT NOT NULL,
  submotivo TEXT,
  timestamp_evento TIMESTAMPTZ NOT NULL,
  desfeito BOOLEAN NOT NULL DEFAULT FALSE,
  grupo_evento_id TEXT,
  origem_incapacidade_tecnica BOOLEAN NOT NULL DEFAULT FALSE
);

-- ==============================================================================
-- 2. Habilitação de RLS (Row Level Security)
-- ==============================================================================
ALTER TABLE public.organizacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instrutores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfis_regras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalogo_infracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulado_eventos ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 3. Políticas RLS (Multi-Tenant Isolado por Organização)
-- ==============================================================================

-- Catálogo e Perfis de Regras: Leitura pública para autenticados
CREATE POLICY "Leitura de regras para usuarios autenticados"
  ON public.perfis_regras FOR SELECT
  TO authenticated
  USING (ativo = TRUE);

CREATE POLICY "Leitura de infracoes para usuarios autenticados"
  ON public.catalogo_infracoes FOR SELECT
  TO authenticated
  USING (ativo = TRUE);

-- Instrutores: Acesso ao próprio registro
CREATE POLICY "Instrutor acessa seu proprio perfil"
  ON public.instrutores FOR ALL
  TO authenticated
  USING (id = auth.uid());

-- Alunos: Instrutor acessa apenas alunos da mesma organização
CREATE POLICY "Acesso a alunos da organizacao"
  ON public.alunos FOR ALL
  TO authenticated
  USING (
    organizacao_id IN (
      SELECT organizacao_id FROM public.instrutores WHERE id = auth.uid()
    )
  );

-- Simulados: Instrutor acessa apenas simulados da mesma organização
CREATE POLICY "Acesso a simulados da organizacao"
  ON public.simulados FOR ALL
  TO authenticated
  USING (
    organizacao_id IN (
      SELECT organizacao_id FROM public.instrutores WHERE id = auth.uid()
    )
  );

-- Eventos de Simulado: Acesso apenas se o simulado pertencer à organização do instrutor
CREATE POLICY "Acesso aos eventos do simulado da organizacao"
  ON public.simulado_eventos FOR ALL
  TO authenticated
  USING (
    simulado_id IN (
      SELECT s.id FROM public.simulados s
      JOIN public.instrutores i ON i.organizacao_id = s.organizacao_id
      WHERE i.id = auth.uid()
    )
  );
