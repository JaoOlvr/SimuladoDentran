import { eq, and } from 'drizzle-orm';
import {
  catalogo_infracoes,
  InfracaoDb,
  perfis_regras,
  PerfilRegra,
} from '../schema';
import { getDb } from '../client';

export class CatalogoRepository {
  constructor(private dbGetter: () => any = getDb) {}

  private get db() {
    return this.dbGetter();
  }

  async listarInfracoes(filtros?: {
    agrupamento?: string;
    natureza?: 'leve' | 'media' | 'grave' | 'gravissima';
  }): Promise<InfracaoDb[]> {
    const conditions = [eq(catalogo_infracoes.ativo, 1)];

    if (filtros?.agrupamento) {
      conditions.push(eq(catalogo_infracoes.agrupamento_ux, filtros.agrupamento));
    }

    if (filtros?.natureza) {
      conditions.push(eq(catalogo_infracoes.natureza, filtros.natureza));
    }

    return this.db
      .select()
      .from(catalogo_infracoes)
      .where(and(...conditions));
  }

  async buscarInfracaoPorId(id: string): Promise<InfracaoDb | undefined> {
    const result = await this.db
      .select()
      .from(catalogo_infracoes)
      .where(eq(catalogo_infracoes.id, id));
    return result[0];
  }

  async listarPerfis(): Promise<PerfilRegra[]> {
    return this.db
      .select()
      .from(perfis_regras)
      .where(eq(perfis_regras.ativo, 1));
  }

  async buscarPerfilPorUf(uf: string = 'MA'): Promise<PerfilRegra | undefined> {
    const result = await this.db
      .select()
      .from(perfis_regras)
      .where(and(eq(perfis_regras.uf, uf.toUpperCase()), eq(perfis_regras.ativo, 1)));
    return result[0];
  }
}

export const catalogoRepository = new CatalogoRepository();
