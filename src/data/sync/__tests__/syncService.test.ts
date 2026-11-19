import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../../db/schema';
import { inicializarBancoLocal } from '../../db/migrator';
import { SyncQueueService } from '../queue';
import { SyncService } from '../syncService';
import { useAuthStore } from '../../../features/auth/authStore';

let sqliteDb: InstanceType<typeof Database>;
let db: ReturnType<typeof drizzle<typeof schema>>;
let syncQueue: SyncQueueService;
let syncServiceInstance: SyncService;

describe('Fase 5 — Auth, LGPD e Sincronizador Offline Supabase', () => {
  beforeEach(() => {
    sqliteDb = new Database(':memory:');
    inicializarBancoLocal({
      execSync: (sql: string) => sqliteDb.exec(sql),
    });
    db = drizzle(sqliteDb, { schema });
    syncQueue = new SyncQueueService(() => db);
    syncServiceInstance = new SyncService(syncQueue);
  });

  afterEach(() => {
    sqliteDb.close();
  });

  describe('1. Sincronizador da Fila (sync_queue)', () => {
    test('deve retornar contagem correta de pendentes', async () => {
      expect(await syncServiceInstance.obterTotalPendentes()).toBe(0);

      await syncQueue.enfileirar('alunos', 'aluno_1', 'UPSERT', { nome: 'João' });
      await syncQueue.enfileirar('simulados', 'sim_1', 'UPSERT', { pontos: 4 });

      expect(await syncServiceInstance.obterTotalPendentes()).toBe(2);
    });

    test('deve processar e esvaziar a fila com sucesso', async () => {
      await syncQueue.enfileirar('alunos', 'aluno_1', 'UPSERT', { nome: 'Maria' });
      await syncQueue.enfileirar('alunos', 'aluno_2', 'DELETE', { id: 'aluno_2' });

      const resultado = await syncServiceInstance.sincronizarFila();

      expect(resultado.processados).toBe(2);
      expect(resultado.erros).toBe(0);
      expect(resultado.pendentesRestantes).toBe(0);

      expect(await syncServiceInstance.obterTotalPendentes()).toBe(0);
    });

    test('fila vazia deve retornar 0 processados sem erros', async () => {
      const resultado = await syncServiceInstance.sincronizarFila();
      expect(resultado.processados).toBe(0);
      expect(resultado.erros).toBe(0);
    });
  });

  describe('2. Autenticação e Configuração de UF', () => {
    test('deve inicializar com modo offline e UF MA por padrão', () => {
      const auth = useAuthStore.getState();
      expect(auth.modoOffline).toBe(true);
      expect(auth.ufPadrao).toBe('MA');
      expect(auth.usuario?.organizacaoId).toBe('org_default');
    });

    test('deve permitir alterar a UF padrão', () => {
      useAuthStore.getState().setUfPadrao('MS');
      expect(useAuthStore.getState().ufPadrao).toBe('MS');

      useAuthStore.getState().setUfPadrao('MA');
      expect(useAuthStore.getState().ufPadrao).toBe('MA');
    });

    test('deve realizar login online em ambiente mock', async () => {
      const ok = await useAuthStore
        .getState()
        .loginOnline('instrutor@autoescola.com.br', 'senha123');

      expect(ok).toBe(true);
      expect(useAuthStore.getState().autenticado).toBe(true);
      expect(useAuthStore.getState().modoOffline).toBe(false);
      expect(useAuthStore.getState().usuario?.email).toBe('instrutor@autoescola.com.br');
    });
  });
});
