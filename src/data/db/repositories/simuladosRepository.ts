import { eq, desc } from 'drizzle-orm';
import { simulados, SimuladoDb, NovoSimuladoDb } from '../schema';
import { getDb } from '../client';

export class SimuladosRepository {
  constructor(private dbGetter: () => any = getDb) {}

  private get db() {
    return this.dbGetter();
  }

  async criar(dados: NovoSimuladoDb): Promise<SimuladoDb> {
    const now = new Date().toISOString();
    const novo: NovoSimuladoDb = {
      ...dados,
      iniciado_em: dados.iniciado_em || now,
      updated_at: dados.updated_at || now,
    };
    await this.db.insert(simulados).values(novo);
    const result = await this.buscarPorId(novo.id);
    return result!;
  }

  async buscarPorId(id: string): Promise<SimuladoDb | undefined> {
    const result = await this.db
      .select()
      .from(simulados)
      .where(eq(simulados.id, id));
    return result[0];
  }

  async listarPorAluno(alunoId: string): Promise<SimuladoDb[]> {
    return this.db
      .select()
      .from(simulados)
      .where(eq(simulados.aluno_id, alunoId))
      .orderBy(desc(simulados.iniciado_em));
  }

  async buscarUltimoDoAluno(alunoId: string): Promise<SimuladoDb | undefined> {
    const result = await this.db
      .select()
      .from(simulados)
      .where(eq(simulados.aluno_id, alunoId))
      .orderBy(desc(simulados.iniciado_em))
      .limit(1);
    return result[0];
  }

  async atualizar(id: string, dados: Partial<NovoSimuladoDb>): Promise<SimuladoDb | undefined> {
    const now = new Date().toISOString();
    await this.db
      .update(simulados)
      .set({ ...dados, updated_at: now })
      .where(eq(simulados.id, id));
    return this.buscarPorId(id);
  }
}

export const simuladosRepository = new SimuladosRepository();

