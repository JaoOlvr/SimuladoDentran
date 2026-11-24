import { syncQueueService, SyncQueueService } from './queue';
import { getSupabaseClient, isMockSupabase } from './supabaseClient';
import { SupabaseClient } from '@supabase/supabase-js';

export interface SyncResultado {
  processados: number;
  erros: number;
  pendentesRestantes: number;
}

export class SyncService {
  constructor(
    private queueService: SyncQueueService = syncQueueService,
    private getClient: () => SupabaseClient = getSupabaseClient
  ) {}

  /**
   * Processa a fila offline sync_queue enviando as mutações acumuladas para o Supabase.
   */
  async sincronizarFila(): Promise<SyncResultado> {
    const pendentes = await this.queueService.listarPendentes();

    if (pendentes.length === 0) {
      return { processados: 0, erros: 0, pendentesRestantes: 0 };
    }

    let processados = 0;
    let erros = 0;

    // Se estiver em modo mock (sem credenciais reais do Supabase fornecidas)
    if (isMockSupabase()) {
      for (const item of pendentes) {
        await this.queueService.remover(item.id);
        processados++;
      }
      return { processados, erros: 0, pendentesRestantes: 0 };
    }

    const supabase = this.getClient();

    for (const item of pendentes) {
      try {
        const payload = JSON.parse(item.payload_json);

        if (item.operacao === 'UPSERT') {
          const { error } = await supabase.from(item.entidade).upsert(payload);
          if (error) throw error;
        } else if (item.operacao === 'DELETE') {
          const { error } = await supabase
            .from(item.entidade)
            .delete()
            .eq('id', item.entidade_id);
          if (error) throw error;
        }

        // Sucesso: remove o item processado da fila local
        await this.queueService.remover(item.id);
        processados++;
      } catch (err) {
        console.warn(`[SyncService] Erro ao sincronizar item ${item.id}:`, err);
        erros++;
      }
    }

    const restantes = await this.queueService.listarPendentes();

    return {
      processados,
      erros,
      pendentesRestantes: restantes.length,
    };
  }

  /**
   * Retorna a quantidade de operações aguardando envio na fila offline.
   */
  async obterTotalPendentes(): Promise<number> {
    const pendentes = await this.queueService.listarPendentes();
    return pendentes.length;
  }
}

export const syncService = new SyncService();

