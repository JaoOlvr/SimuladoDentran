import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const organizacoes = sqliteTable('organizacoes', {
  id: text('id').primaryKey(),
  nome: text('nome').notNull(),
  tipo: text('tipo', { enum: ['autonomo', 'autoescola'] }).notNull(),
  uf_padrao: text('uf_padrao').notNull().default('MA'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

export const instrutores = sqliteTable('instrutores', {
  id: text('id').primaryKey(),
  organizacao_id: text('organizacao_id')
    .notNull()
    .references(() => organizacoes.id),
  nome: text('nome').notNull(),
  email: text('email').unique().notNull(),
  telefone: text('telefone'),
  registro_detran: text('registro_detran'),
  uf: text('uf').notNull().default('MA'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

export const perfis_regras = sqliteTable('perfis_regras', {
  id: text('id').primaryKey(),
  uf: text('uf').notNull(),
  nome: text('nome').notNull(),
  versao_norma: text('versao_norma').notNull(),
  limite_aprovacao: integer('limite_aprovacao').notNull().default(10),
  peso_leve: integer('peso_leve').notNull().default(1),
  peso_media: integer('peso_media').notNull().default(2),
  peso_grave: integer('peso_grave').notNull().default(4),
  peso_gravissima: integer('peso_gravissima').notNull().default(6),
  limite_incapacidade_tecnica: integer('limite_incapacidade_tecnica')
    .notNull()
    .default(2),
  primeira_incapacidade_gera_leve: integer('primeira_incapacidade_gera_leve')
    .notNull()
    .default(1),
  tempo_minimo_segundos: integer('tempo_minimo_segundos'),
  ativo: integer('ativo').notNull().default(1),
});

export const catalogo_infracoes = sqliteTable('catalogo_infracoes', {
  id: text('id').primaryKey(),
  artigo_ctb: text('artigo_ctb').notNull(),
  descricao: text('descricao').notNull(),
  natureza: text('natureza', {
    enum: ['leve', 'media', 'grave', 'gravissima'],
  }).notNull(),
  pontos: integer('pontos').notNull(),
  categorias_aplicaveis: text('categorias_aplicaveis').notNull(), // JSON array ex: '["A","B"]'
  agrupamento_ux: text('agrupamento_ux').notNull(),
  fonte: text('fonte').notNull(),
  ativo: integer('ativo').notNull().default(1),
});

export const alunos = sqliteTable('alunos', {
  id: text('id').primaryKey(),
  organizacao_id: text('organizacao_id')
    .notNull()
    .references(() => organizacoes.id),
  instrutor_id: text('instrutor_id')
    .notNull()
    .references(() => instrutores.id),
  nome: text('nome').notNull(),
  telefone: text('telefone'),
  categoria_pretendida: text('categoria_pretendida', {
    enum: ['A', 'B', 'AB'],
  }).notNull(),
  tipo_cambio: text('tipo_cambio', {
    enum: ['manual', 'automatico'],
  })
    .notNull()
    .default('manual'),
  consentimento_lgpd: integer('consentimento_lgpd').notNull().default(0),
  consentimento_em: text('consentimento_em'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
  deleted_at: text('deleted_at'),
});

export const simulados = sqliteTable('simulados', {
  id: text('id').primaryKey(),
  organizacao_id: text('organizacao_id')
    .notNull()
    .references(() => organizacoes.id),
  instrutor_id: text('instrutor_id')
    .notNull()
    .references(() => instrutores.id),
  aluno_id: text('aluno_id')
    .notNull()
    .references(() => alunos.id),
  perfil_regra_id: text('perfil_regra_id')
    .notNull()
    .references(() => perfis_regras.id),
  categoria: text('categoria', { enum: ['A', 'B'] }).notNull(),
  tipo_cambio: text('tipo_cambio', { enum: ['manual', 'automatico'] }).notNull(),
  status: text('status', {
    enum: ['EM_ANDAMENTO', 'APROVADO', 'REPROVADO', 'NAO_CONCLUIDO', 'ELIMINADO'],
  }).notNull(),
  pontos_totais: integer('pontos_totais').notNull().default(0),
  nota_final: integer('nota_final'), // NULL se NAO_CONCLUIDO ou ELIMINADO
  contador_incapacidade_tecnica: integer('contador_incapacidade_tecnica')
    .notNull()
    .default(0),
  motivo_encerramento: text('motivo_encerramento'),
  observacoes_instrutor: text('observacoes_instrutor'),
  iniciado_em: text('iniciado_em').notNull(),
  finalizado_em: text('finalizado_em'),
  updated_at: text('updated_at').notNull(),
  synced_at: text('synced_at'),
});

export const simulado_eventos = sqliteTable('simulado_eventos', {
  id: text('id').primaryKey(),
  simulado_id: text('simulado_id')
    .notNull()
    .references(() => simulados.id, { onDelete: 'cascade' }),
  infracao_id: text('infracao_id').references(() => catalogo_infracoes.id),
  tipo_evento: text('tipo_evento', {
    enum: ['INFRACAO', 'INCAPACIDADE_TECNICA', 'ELIMINACAO', 'NAO_CONCLUIDO'],
  }).notNull(),
  natureza_snapshot: text('natureza_snapshot'),
  pontos_snapshot: integer('pontos_snapshot').notNull().default(0),
  descricao_snapshot: text('descricao_snapshot').notNull(),
  submotivo: text('submotivo'),
  timestamp_evento: text('timestamp_evento').notNull(),
  desfeito: integer('desfeito').notNull().default(0),
  grupo_evento_id: text('grupo_evento_id'),
  origem_incapacidade_tecnica: integer('origem_incapacidade_tecnica')
    .notNull()
    .default(0),
});

export const sync_queue = sqliteTable('sync_queue', {
  id: text('id').primaryKey(),
  entidade: text('entidade').notNull(),
  entidade_id: text('entidade_id').notNull(),
  operacao: text('operacao', { enum: ['UPSERT', 'DELETE'] }).notNull(),
  payload_json: text('payload_json').notNull(),
  tentativas: integer('tentativas').notNull().default(0),
  created_at: text('created_at').notNull(),
});

export type Organizacao = typeof organizacoes.$inferSelect;
export type NovoOrganizacao = typeof organizacoes.$inferInsert;

export type Instrutor = typeof instrutores.$inferSelect;
export type NovoInstrutor = typeof instrutores.$inferInsert;

export type PerfilRegra = typeof perfis_regras.$inferSelect;
export type NovoPerfilRegra = typeof perfis_regras.$inferInsert;

export type InfracaoDb = typeof catalogo_infracoes.$inferSelect;
export type NovoInfracaoDb = typeof catalogo_infracoes.$inferInsert;

export type Aluno = typeof alunos.$inferSelect;
export type NovoAluno = typeof alunos.$inferInsert;

export type SimuladoDb = typeof simulados.$inferSelect;
export type NovoSimuladoDb = typeof simulados.$inferInsert;

export type SimuladoEventoDb = typeof simulado_eventos.$inferSelect;
export type NovoSimuladoEventoDb = typeof simulado_eventos.$inferInsert;

export type SyncQueueDb = typeof sync_queue.$inferSelect;
export type NovoSyncQueueDb = typeof sync_queue.$inferInsert;
