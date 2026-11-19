import { eq, and, isNull, like, desc, asc } from 'drizzle-orm';
import { alunos, Aluno, NovoAluno, simulados, simulado_eventos } from '../schema';
import { getDb } from '../client';

export type DrizzleDb = ReturnType<typeof getDb>;

export class AlunosRepository {
  constructor(private dbGetter: () => any = getDb) {}

  private get db() {
    return this.dbGetter();
  }

  async listar(filtros?: { busca?: string; categoria?: 'A' | 'B' | 'AB' }): Promise<Aluno[]> {
    const conditions = [isNull(alunos.deleted_at)];

    if (filtros?.categoria) {
      conditions.push(eq(alunos.categoria_pretendida, filtros.categoria));
    }

    if (filtros?.busca && filtros.busca.trim().length > 0) {
      conditions.push(like(alunos.nome, `%${filtros.busca.trim()}%`));
    }

    return this.db
      .select()
      .from(alunos)
      .where(and(...conditions))
      .orderBy(asc(alunos.nome));
  }

  async buscarPorId(id: string): Promise<Aluno | undefined> {
    const result = await this.db
      .select()
      .from(alunos)
      .where(and(eq(alunos.id, id), isNull(alunos.deleted_at)));
    return result[0];
  }

  async criar(dados: NovoAluno): Promise<Aluno> {
    const now = new Date().toISOString();
    const novo: NovoAluno = {
      ...dados,
      created_at: dados.created_at || now,
      updated_at: dados.updated_at || now,
    };
    await this.db.insert(alunos).values(novo);
    const criado = await this.buscarPorId(novo.id);
    return criado!;
  }

  async atualizar(id: string, dados: Partial<NovoAluno>): Promise<Aluno | undefined> {
    const now = new Date().toISOString();
    await this.db
      .update(alunos)
      .set({ ...dados, updated_at: now })
      .where(eq(alunos.id, id));
    return this.buscarPorId(id);
  }

  async softDelete(id: string): Promise<void> {
    const now = new Date().toISOString();
    await this.db
      .update(alunos)
      .set({ deleted_at: now, updated_at: now })
      .where(eq(alunos.id, id));
  }

  /**
   * Exclusão definitiva em cascata sob demanda do titular (Conformidade LGPD).
   */
  async excluirDefinitivoLGPD(id: string): Promise<void> {
    // 1. Busca todos os simulados do aluno
    const sims = await this.db
      .select({ id: simulados.id })
      .from(simulados)
      .where(eq(simulados.aluno_id, id));

    // 2. Remove todos os eventos desses simulados
    for (const s of sims) {
      await this.db
        .delete(simulado_eventos)
        .where(eq(simulado_eventos.simulado_id, s.id));
    }

    // 3. Remove os simulados
    await this.db.delete(simulados).where(eq(simulados.aluno_id, id));

    // 4. Remove o aluno definitivamente
    await this.db.delete(alunos).where(eq(alunos.id, id));
  }
}

export const alunosRepository = new AlunosRepository();

