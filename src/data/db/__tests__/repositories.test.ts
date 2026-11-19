import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../schema';
import { inicializarBancoLocal } from '../migrator';
import { AlunosRepository } from '../repositories/alunosRepository';
import { SimuladosRepository } from '../repositories/simuladosRepository';
import { EventosRepository } from '../repositories/eventosRepository';
import { CatalogoRepository } from '../repositories/catalogoRepository';
import { SyncQueueService } from '../../sync/queue';

describe('Fase 2 — Banco Local Offline (SQLite + Drizzle) e Repositórios', () => {
  let sqliteDb: InstanceType<typeof Database>;
  let db: ReturnType<typeof drizzle<typeof schema>>;

  let alunosRepo: AlunosRepository;
  let simuladosRepo: SimuladosRepository;
  let eventosRepo: EventosRepository;
  let catalogoRepo: CatalogoRepository;
  let syncQueue: SyncQueueService;

  beforeEach(() => {
    // Cria banco SQLite limpo em memória para cada teste
    sqliteDb = new Database(':memory:');
    
    // Executa migrações DDL e carga idempotente de seeds
    const dbExecutor = {
      execSync: (sql: string) => {
        sqliteDb.exec(sql);
      },
    };
    inicializarBancoLocal(dbExecutor);

    db = drizzle(sqliteDb, { schema });

    const getTestDb = () => db;
    alunosRepo = new AlunosRepository(getTestDb);
    simuladosRepo = new SimuladosRepository(getTestDb);
    eventosRepo = new EventosRepository(getTestDb);
    catalogoRepo = new CatalogoRepository(getTestDb);
    syncQueue = new SyncQueueService(getTestDb);
  });

  afterEach(() => {
    sqliteDb.close();
  });

  describe('1. Carga Idempotente de Seeds e Fundação', () => {
    test('deve inicializar catálogo com as 45 infrações no SQLite', async () => {
      const infracoes = await catalogoRepo.listarInfracoes();
      expect(infracoes.length).toBeGreaterThanOrEqual(40);

      const art169 = await catalogoRepo.buscarInfracaoPorId('ctb_169');
      expect(art169).toBeDefined();
      expect(art169?.artigo_ctb).toBe('Art. 169');
      expect(art169?.natureza).toBe('leve');
    });

    test('deve carregar os perfis estaduais com MA padrão', async () => {
      const perfis = await catalogoRepo.listarPerfis();
      expect(perfis.length).toBeGreaterThanOrEqual(2);

      const perfilMA = await catalogoRepo.buscarPerfilPorUf('MA');
      expect(perfilMA).toBeDefined();
      expect(perfilMA?.uf).toBe('MA');
      expect(perfilMA?.limite_aprovacao).toBe(10);
    });

    test('deve ser idempotente em múltiplas inicializações sucessivas', () => {
      const dbExecutor = {
        execSync: (sql: string) => {
          sqliteDb.exec(sql);
        },
      };
      // Executa novamente
      expect(() => inicializarBancoLocal(dbExecutor)).not.toThrow();
    });
  });

  describe('2. Repositório de Alunos e Conformidade LGPD', () => {
    test('deve cadastrar aluno e listar por busca', async () => {
      const novoAluno = await alunosRepo.criar({
        id: 'aluno_1',
        organizacao_id: 'org_default',
        instrutor_id: 'inst_default',
        nome: 'Carlos Silva',
        telefone: '98991234567',
        categoria_pretendida: 'B',
        tipo_cambio: 'manual',
        consentimento_lgpd: 1,
        consentimento_em: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      expect(novoAluno.id).toBe('aluno_1');
      expect(novoAluno.nome).toBe('Carlos Silva');

      const lista = await alunosRepo.listar({ busca: 'Carlos' });
      expect(lista.length).toBe(1);
      expect(lista[0].nome).toBe('Carlos Silva');
    });

    test('soft delete deve ocultar aluno da listagem geral', async () => {
      await alunosRepo.criar({
        id: 'aluno_2',
        organizacao_id: 'org_default',
        instrutor_id: 'inst_default',
        nome: 'Mariana Souza',
        categoria_pretendida: 'B',
        tipo_cambio: 'automatico',
        consentimento_lgpd: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      await alunosRepo.softDelete('aluno_2');

      const lista = await alunosRepo.listar();
      expect(lista.find((a) => a.id === 'aluno_2')).toBeUndefined();
    });

    test('exclusão definitiva LGPD deve apagar aluno e seus simulados/eventos em cascata', async () => {
      await alunosRepo.criar({
        id: 'aluno_lgpd',
        organizacao_id: 'org_default',
        instrutor_id: 'inst_default',
        nome: 'João Santos',
        categoria_pretendida: 'B',
        tipo_cambio: 'manual',
        consentimento_lgpd: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      await simuladosRepo.criar({
        id: 'sim_lgpd',
        organizacao_id: 'org_default',
        instrutor_id: 'inst_default',
        aluno_id: 'aluno_lgpd',
        perfil_regra_id: 'perfil_ma_2026',
        categoria: 'B',
        tipo_cambio: 'manual',
        status: 'APROVADO',
        pontos_totais: 4,
        nota_final: 4,
        contador_incapacidade_tecnica: 0,
        iniciado_em: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      await eventosRepo.inserir({
        id: 'evt_lgpd',
        simulado_id: 'sim_lgpd',
        tipo_evento: 'INFRACAO',
        infracao_id: 'ctb_196',
        pontos_snapshot: 4,
        descricao_snapshot: 'Não deu seta',
        timestamp_evento: new Date().toISOString(),
        desfeito: 0,
        origem_incapacidade_tecnica: 0,
      });

      // Executa exclusão definitiva
      await alunosRepo.excluirDefinitivoLGPD('aluno_lgpd');

      expect(await alunosRepo.buscarPorId('aluno_lgpd')).toBeUndefined();
      expect(await simuladosRepo.buscarPorId('sim_lgpd')).toBeUndefined();
      const eventosRestantes = await eventosRepo.listarPorSimulado('sim_lgpd');
      expect(eventosRestantes.length).toBe(0);
    });
  });

  describe('3. Repositório de Simulados e Eventos (Offline-First)', () => {
    test('deve criar simulado, registrar eventos e desfazê-los', async () => {
      await alunosRepo.criar({
        id: 'aluno_sim',
        organizacao_id: 'org_default',
        instrutor_id: 'inst_default',
        nome: 'Beatriz Lima',
        categoria_pretendida: 'B',
        tipo_cambio: 'manual',
        consentimento_lgpd: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const sim = await simuladosRepo.criar({
        id: 'sim_1',
        organizacao_id: 'org_default',
        instrutor_id: 'inst_default',
        aluno_id: 'aluno_sim',
        perfil_regra_id: 'perfil_ma_2026',
        categoria: 'B',
        tipo_cambio: 'manual',
        status: 'EM_ANDAMENTO',
        pontos_totais: 0,
        contador_incapacidade_tecnica: 0,
        iniciado_em: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      expect(sim.id).toBe('sim_1');

      // Insere infração
      await eventosRepo.inserir({
        id: 'evt_1',
        simulado_id: 'sim_1',
        tipo_evento: 'INFRACAO',
        infracao_id: 'ctb_196',
        natureza_snapshot: 'grave',
        pontos_snapshot: 4,
        descricao_snapshot: 'Deixar de indicar com antecedência mediante seta',
        timestamp_evento: new Date().toISOString(),
        desfeito: 0,
        origem_incapacidade_tecnica: 0,
      });

      const eventosAtivos = await eventosRepo.listarPorSimulado('sim_1', true);
      expect(eventosAtivos.length).toBe(1);
      expect(eventosAtivos[0].pontos_snapshot).toBe(4);

      // Marca como desfeito
      await eventosRepo.marcarComoDesfeito('evt_1');
      const ativosAposUndo = await eventosRepo.listarPorSimulado('sim_1', true);
      expect(ativosAposUndo.length).toBe(0);
    });

    test('deve desfazer grupo atômico de incapacidade técnica', async () => {
      await alunosRepo.criar({
        id: 'aluno_grupo',
        organizacao_id: 'org_default',
        instrutor_id: 'inst_default',
        nome: 'Marcos Vinicius',
        categoria_pretendida: 'B',
        tipo_cambio: 'manual',
        consentimento_lgpd: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      await simuladosRepo.criar({
        id: 'sim_grupo',
        organizacao_id: 'org_default',
        instrutor_id: 'inst_default',
        aluno_id: 'aluno_grupo',
        perfil_regra_id: 'perfil_ma_2026',
        categoria: 'B',
        tipo_cambio: 'manual',
        status: 'EM_ANDAMENTO',
        pontos_totais: 1,
        contador_incapacidade_tecnica: 1,
        iniciado_em: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const grupoId = 'grupo_incap_123';

      await eventosRepo.inserir({
        id: 'evt_incap',
        simulado_id: 'sim_grupo',
        tipo_evento: 'INCAPACIDADE_TECNICA',
        pontos_snapshot: 0,
        descricao_snapshot: '1ª ocorrência de incapacidade técnica',
        timestamp_evento: '2026-11-18T20:00:00.000Z',
        desfeito: 0,
        grupo_evento_id: grupoId,
        origem_incapacidade_tecnica: 0,
      });

      await eventosRepo.inserir({
        id: 'evt_art169',
        simulado_id: 'sim_grupo',
        tipo_evento: 'INFRACAO',
        infracao_id: 'ctb_169',
        natureza_snapshot: 'leve',
        pontos_snapshot: 1,
        descricao_snapshot: 'Art. 169 gerado por incapacidade',
        timestamp_evento: '2026-11-18T20:00:00.001Z',
        desfeito: 0,
        grupo_evento_id: grupoId,
        origem_incapacidade_tecnica: 1,
      });

      // Desfaz o grupo todo
      await eventosRepo.marcarGrupoComoDesfeito(grupoId);

      const ativos = await eventosRepo.listarPorSimulado('sim_grupo', true);
      expect(ativos.length).toBe(0);
    });
  });

  describe('4. Fila Offline (Sync Queue)', () => {
    test('deve enfileirar mutações e remover após processamento', async () => {
      await syncQueue.enfileirar('alunos', 'aluno_sync_1', 'UPSERT', {
        nome: 'Aluno Teste',
      });

      const pendentes = await syncQueue.listarPendentes();
      expect(pendentes.length).toBe(1);
      expect(pendentes[0].entidade).toBe('alunos');
      expect(pendentes[0].entidade_id).toBe('aluno_sync_1');

      await syncQueue.remover(pendentes[0].id);
      const aposRemocao = await syncQueue.listarPendentes();
      expect(aposRemocao.length).toBe(0);
    });
  });
});

