import { eq, and, desc, asc } from 'drizzle-orm';
import { simulado_eventos, SimuladoEventoDb, NovoSimuladoEventoDb } from '../schema';
import { getDb } from '../client';

export class EventosRepository {
  constructor(private dbGetter: () => any = getDb) {}

  private get db() {
    return this.dbGetter();
  }

  async inserir(evento: NovoSimuladoEventoDb): Promise<SimuladoEventoDb> {
    await this.db.insert(simulado_eventos).values(evento);
    const result = await this.db
      .select()
      .from(simulado_eventos)
      .where(eq(simulado_eventos.id, evento.id));
    return result[0];
  }

  async listarPorSimulado(
    simuladoId: string,
    apenasAtivos: boolean = false
  ): Promise<SimuladoEventoDb[]> {
    const conditions = [eq(simulado_eventos.simulado_id, simuladoId)];
    if (apenasAtivos) {
      conditions.push(eq(simulado_eventos.desfeito, 0));
    }

    return this.db
      .select()
      .from(simulado_eventos)
      .where(and(...conditions))
      .orderBy(asc(simulado_eventos.timestamp_evento));
  }

  async buscarUltimoAtivo(simuladoId: string): Promise<SimuladoEventoDb | undefined> {
    const result = await this.db
      .select()
      .from(simulado_eventos)
      .where(
        and(
          eq(simulado_eventos.simulado_id, simuladoId),
          eq(simulado_eventos.desfeito, 0)
        )
      )
      .orderBy(desc(simulado_eventos.timestamp_evento))
      .limit(1);

    return result[0];
  }

  async marcarComoDesfeito(id: string): Promise<void> {
    await this.db
      .update(simulado_eventos)
      .set({ desfeito: 1 })
      .where(eq(simulado_eventos.id, id));
  }

  async marcarGrupoComoDesfeito(grupoEventoId: string): Promise<void> {
    await this.db
      .update(simulado_eventos)
      .set({ desfeito: 1 })
      .where(eq(simulado_eventos.grupo_evento_id, grupoEventoId));
  }
}

export const eventosRepository = new EventosRepository();

