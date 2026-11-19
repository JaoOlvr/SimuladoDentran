import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../../../data/db/schema';
import { inicializarBancoLocal } from '../../../data/db/migrator';
import { useSimuladoStore } from '../simuladoStore';
import { InfracaoCatalogo } from '../../../core/rules/types';

// Mock dos repositórios para apontar para o banco em memória nos testes
let sqliteDb: InstanceType<typeof Database>;
let db: ReturnType<typeof drizzle<typeof schema>>;

jest.mock('../../../data/db/client', () => ({
  getDb: () => db,
  getExpoSqliteDb: () => ({
    execSync: (sql: string) => sqliteDb.exec(sql),
  }),
}));

describe('Fase 3 — Store do Simulado e Fluxo Core de Avaliação', () => {
  beforeEach(() => {
    sqliteDb = new Database(':memory:');
    inicializarBancoLocal({
      execSync: (sql: string) => sqliteDb.exec(sql),
    });
    db = drizzle(sqliteDb, { schema });
  });

  afterEach(() => {
    sqliteDb.close();
  });

  const mockInfracaoGrave: InfracaoCatalogo = {
    id: 'ctb_196',
    artigo_ctb: 'Art. 196',
    descricao: 'Não deu seta com antecedência',
    natureza: 'grave',
    pontos: 4,
    categorias_aplicaveis: ['B'],
    agrupamento_ux: 'sinalizacao',
    fonte: 'CTB',
  };

  test('deve iniciar novo simulado rápido com status EM_ANDAMENTO e 0 pontos', async () => {
    const store = useSimuladoStore.getState();

    const simId = await store.iniciarNovoSimulado({
      categoria: 'B',
      tipoCambio: 'manual',
      uf: 'MA',
    });

    expect(simId).toBeDefined();

    const state = useSimuladoStore.getState();
    expect(state.simuladoAtual?.id).toBe(simId);
    expect(state.estadoCalculado.status).toBe('EM_ANDAMENTO');
    expect(state.estadoCalculado.pontos_totais).toBe(0);
    expect(state.eventos.length).toBe(0);
  });

  test('deve lançar infração grave, recalcular placar para 4 pontos e exibir toast', async () => {
    const store = useSimuladoStore.getState();
    await store.iniciarNovoSimulado({
      categoria: 'B',
      tipoCambio: 'manual',
    });

    await store.lancarInfracao(mockInfracaoGrave);

    const state = useSimuladoStore.getState();
    expect(state.estadoCalculado.pontos_totais).toBe(4);
    expect(state.estadoCalculado.status).toBe('EM_ANDAMENTO');
    expect(state.eventos.length).toBe(1);
    expect(state.toastMensagem).toContain('Art. 196 (+4 pts)');
  });

  test('deve registrar incapacidade técnica e gerar Art. 169 automaticamente', async () => {
    const store = useSimuladoStore.getState();
    await store.iniciarNovoSimulado({
      categoria: 'B',
      tipoCambio: 'manual',
    });

    await store.lancarIncapacidade('Apagar o motor na saída');

    const state = useSimuladoStore.getState();
    expect(state.estadoCalculado.contador_incapacidade_tecnica).toBe(1);
    expect(state.estadoCalculado.pontos_totais).toBe(1); // Art. 169 adicionou 1 ponto
    expect(state.eventos.length).toBe(2); // 1 evento de incapacidade + 1 evento do Art. 169
  });

  test('deve desfazer lançamento e recalcular deterministamente o placar', async () => {
    const store = useSimuladoStore.getState();
    await store.iniciarNovoSimulado({
      categoria: 'B',
      tipoCambio: 'manual',
    });

    await store.lancarInfracao(mockInfracaoGrave); // +4 pts
    expect(useSimuladoStore.getState().estadoCalculado.pontos_totais).toBe(4);

    await store.desfazer(); // Desfaz os 4 pontos
    expect(useSimuladoStore.getState().estadoCalculado.pontos_totais).toBe(0);
    expect(useSimuladoStore.getState().toastMensagem).toBe('Último lançamento desfeito');
  });

  test('deve finalizar simulado gravando observações pedagógicas e nota final', async () => {
    const store = useSimuladoStore.getState();
    await store.iniciarNovoSimulado({
      categoria: 'B',
      tipoCambio: 'manual',
    });

    await store.lancarInfracao(mockInfracaoGrave); // 4 pts

    const estadoFinal = await store.finalizarSimulado(
      'Aluno executou bem a baliza, mas faltou atenção na seta.'
    );

    expect(estadoFinal.status).toBe('APROVADO');
    expect(estadoFinal.nota_final).toBe(4);
    expect(estadoFinal.pontos_totais).toBe(4);
  });
});

