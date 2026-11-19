import infracoesSeedData from '../seeds/infracoes_ctb.json';
import perfisSeedData from '../seeds/perfis_estaduais.json';
import { InfracoesSeedFile, RegraPerfil } from '../../core/rules/types';

export const DDL_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS organizacoes (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('autonomo', 'autoescola')),
    uf_padrao TEXT NOT NULL DEFAULT 'MA',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS instrutores (
    id TEXT PRIMARY KEY,
    organizacao_id TEXT NOT NULL REFERENCES organizacoes(id),
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    telefone TEXT,
    registro_detran TEXT,
    uf TEXT NOT NULL DEFAULT 'MA',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS perfis_regras (
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
    primeira_incapacidade_gera_leve INTEGER NOT NULL DEFAULT 1,
    tempo_minimo_segundos INTEGER,
    ativo INTEGER NOT NULL DEFAULT 1
  );`,

  `CREATE TABLE IF NOT EXISTS catalogo_infracoes (
    id TEXT PRIMARY KEY,
    artigo_ctb TEXT NOT NULL,
    descricao TEXT NOT NULL,
    natureza TEXT NOT NULL CHECK (natureza IN ('leve', 'media', 'grave', 'gravissima')),
    pontos INTEGER NOT NULL,
    categorias_aplicaveis TEXT NOT NULL,
    agrupamento_ux TEXT NOT NULL,
    fonte TEXT NOT NULL,
    ativo INTEGER NOT NULL DEFAULT 1
  );`,

  `CREATE TABLE IF NOT EXISTS alunos (
    id TEXT PRIMARY KEY,
    organizacao_id TEXT NOT NULL REFERENCES organizacoes(id),
    instrutor_id TEXT NOT NULL REFERENCES instrutores(id),
    nome TEXT NOT NULL,
    telefone TEXT,
    categoria_pretendida TEXT NOT NULL CHECK (categoria_pretendida IN ('A', 'B', 'AB')),
    tipo_cambio TEXT NOT NULL DEFAULT 'manual' CHECK (tipo_cambio IN ('manual', 'automatico')),
    consentimento_lgpd INTEGER NOT NULL DEFAULT 0,
    consentimento_em TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  );`,

  `CREATE TABLE IF NOT EXISTS simulados (
    id TEXT PRIMARY KEY,
    organizacao_id TEXT NOT NULL REFERENCES organizacoes(id),
    instrutor_id TEXT NOT NULL REFERENCES instrutores(id),
    aluno_id TEXT NOT NULL REFERENCES alunos(id),
    perfil_regra_id TEXT NOT NULL REFERENCES perfis_regras(id),
    categoria TEXT NOT NULL CHECK (categoria IN ('A', 'B')),
    tipo_cambio TEXT NOT NULL CHECK (tipo_cambio IN ('manual', 'automatico')),
    status TEXT NOT NULL CHECK (status IN ('EM_ANDAMENTO', 'APROVADO', 'REPROVADO', 'NAO_CONCLUIDO', 'ELIMINADO')),
    pontos_totais INTEGER NOT NULL DEFAULT 0,
    nota_final INTEGER,
    contador_incapacidade_tecnica INTEGER NOT NULL DEFAULT 0,
    motivo_encerramento TEXT,
    observacoes_instrutor TEXT,
    iniciado_em TEXT NOT NULL,
    finalizado_em TEXT,
    updated_at TEXT NOT NULL,
    synced_at TEXT
  );`,

  `CREATE TABLE IF NOT EXISTS simulado_eventos (
    id TEXT PRIMARY KEY,
    simulado_id TEXT NOT NULL REFERENCES simulados(id) ON DELETE CASCADE,
    infracao_id TEXT REFERENCES catalogo_infracoes(id),
    tipo_evento TEXT NOT NULL CHECK (tipo_evento IN ('INFRACAO', 'INCAPACIDADE_TECNICA', 'ELIMINACAO', 'NAO_CONCLUIDO')),
    natureza_snapshot TEXT,
    pontos_snapshot INTEGER NOT NULL DEFAULT 0,
    descricao_snapshot TEXT NOT NULL,
    submotivo TEXT,
    timestamp_evento TEXT NOT NULL,
    desfeito INTEGER NOT NULL DEFAULT 0,
    grupo_evento_id TEXT,
    origem_incapacidade_tecnica INTEGER NOT NULL DEFAULT 0
  );`,

  `CREATE TABLE IF NOT EXISTS sync_queue (
    id TEXT PRIMARY KEY,
    entidade TEXT NOT NULL,
    entidade_id TEXT NOT NULL,
    operacao TEXT NOT NULL CHECK (operacao IN ('UPSERT', 'DELETE')),
    payload_json TEXT NOT NULL,
    tentativas INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );`,
];

export interface SqlDatabaseExecutor {
  execSync(sql: string): unknown;
}

/**
 * Executa as migrações DDL e o seed inicial idempotente no banco local.
 */
export function inicializarBancoLocal(db: SqlDatabaseExecutor): void {
  // 1. Criação das tabelas
  for (const ddl of DDL_STATEMENTS) {
    db.execSync(ddl);
  }

  const now = new Date().toISOString();

  // 2. Criação de Organização Padrão (se não existir)
  db.execSync(`
    INSERT OR IGNORE INTO organizacoes (id, nome, tipo, uf_padrao, created_at, updated_at)
    VALUES ('org_default', 'Instrutor Autônomo', 'autonomo', 'MA', '${now}', '${now}');
  `);

  // 3. Criação de Instrutor Padrão (se não existir)
  db.execSync(`
    INSERT OR IGNORE INTO instrutores (id, organizacao_id, nome, email, telefone, registro_detran, uf, created_at, updated_at)
    VALUES ('inst_default', 'org_default', 'Instrutor Principal', 'instrutor@simuladetran.local', '', 'DETRAN-MA', 'MA', '${now}', '${now}');
  `);

  // 4. Carga Idempotente de Perfis Estaduais
  const perfis = perfisSeedData as RegraPerfil[];
  for (const p of perfis) {
    db.execSync(`
      INSERT OR IGNORE INTO perfis_regras (
        id, uf, nome, versao_norma, limite_aprovacao, peso_leve, peso_media,
        peso_grave, peso_gravissima, limite_incapacidade_tecnica,
        primeira_incapacidade_gera_leve, tempo_minimo_segundos, ativo
      ) VALUES (
        '${p.id}', '${p.uf}', '${p.nome.replace(/'/g, "''")}', '${p.versao_norma}',
        ${p.limite_aprovacao}, ${p.peso_leve}, ${p.peso_media}, ${p.peso_grave}, ${p.peso_gravissima},
        ${p.limite_incapacidade_tecnica}, ${p.primeira_incapacidade_gera_leve ? 1 : 0},
        ${p.tempo_minimo_segundos !== null ? p.tempo_minimo_segundos : 'NULL'}, ${p.ativo ? 1 : 0}
      );
    `);
  }

  // 5. Carga Idempotente de Infrações CTB
  const seedInfracoes = infracoesSeedData as unknown as InfracoesSeedFile;
  for (const inf of seedInfracoes.infracoes) {
    const catsJson = JSON.stringify(inf.categorias_aplicaveis);
    db.execSync(`
      INSERT OR IGNORE INTO catalogo_infracoes (
        id, artigo_ctb, descricao, natureza, pontos, categorias_aplicaveis, agrupamento_ux, fonte, ativo
      ) VALUES (
        '${inf.id}', '${inf.artigo_ctb}', '${inf.descricao.replace(/'/g, "''")}',
        '${inf.natureza}', ${inf.pontos}, '${catsJson}', '${inf.agrupamento_ux}',
        '${inf.fonte.replace(/'/g, "''")}', 1
      );
    `);
  }
}
