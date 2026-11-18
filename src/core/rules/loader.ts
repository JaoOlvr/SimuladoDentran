import { InfracaoCatalogo, InfracoesSeedFile, RegraPerfil } from './types';
import infracoesSeedData from '../../data/seeds/infracoes_ctb.json';
import perfisSeedData from '../../data/seeds/perfis_estaduais.json';

const infracoesSeed = infracoesSeedData as unknown as InfracoesSeedFile;
const perfisSeed = perfisSeedData as unknown as RegraPerfil[];

export function getCatalogoInfracoes(): InfracaoCatalogo[] {
  return infracoesSeed.infracoes;
}

export function getInfracaoPorId(id: string): InfracaoCatalogo | undefined {
  return infracoesSeed.infracoes.find((inf) => inf.id === id);
}

export function getPerfisEstaduais(): RegraPerfil[] {
  return perfisSeed;
}

export function getPerfilPorUf(uf: string = 'MA'): RegraPerfil {
  const ufNormalizada = uf.toUpperCase();
  const perfil = perfisSeed.find((p) => p.uf.toUpperCase() === ufNormalizada && Boolean(p.ativo));
  if (!perfil) {
    const padraoMA = perfisSeed.find((p) => p.uf === 'MA');
    if (!padraoMA) {
      throw new Error(`Perfil padrão 'MA' não encontrado nas configurações.`);
    }
    return padraoMA;
  }
  return perfil;
}

