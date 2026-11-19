import { eq } from 'drizzle-orm';
import { sync_queue, SyncQueueDb } from '../db/schema';
import { getDb } from '../db/client';

export class SyncQueueService {
  constructor(private dbGetter: () => any = getDb) {}

  private get db() {
    return this.dbGetter();
  }

  async enfileirar(
    entidade: string,
    entidadeId: string,
    operacao: 'UPSERT' | 'DELETE',
    payload: Record<string, unknown>
  ): Promise<void> {
    const id = 'sq_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    await this.db.insert(sync_queue).values({
      id,
      entidade,
      entidade_id: entidadeId,
      operacao,
      payload_json: JSON.stringify(payload),
      tentativas: 0,
      created_at: new Date().toISOString(),
    });
  }

  async listarPendentes(): Promise<SyncQueueDb[]> {
    return this.db.select().from(sync_queue);
  }

  async remover(id: string): Promise<void> {
    await this.db.delete(sync_queue).where(eq(sync_queue.id, id));
  }
}

export const syncQueueService = new SyncQueueService();

