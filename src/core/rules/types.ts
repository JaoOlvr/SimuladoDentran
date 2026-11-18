export type NaturezaInfracao = 'leve' | 'media' | 'grave' | 'gravissima';

export type CategoriaVeiculo = 'A' | 'B' | 'C' | 'D' | 'E';

export interface InfracaoCatalogo {
  id: string;
  artigo_ctb: string;
  descricao: string;
  natureza: NaturezaInfracao;
  pontos: number;
  categorias_aplicaveis: CategoriaVeiculo[];
  agrupamento_ux: string;
  fonte: string;
  ativo?: number | boolean;
}

export interface InfracoesSeedFile {
  versao_schema: string;
  data_referencia: string;
  norma_base: string;
  infracoes: InfracaoCatalogo[];
}

export interface RegraPerfil {
  id: string;
  uf: string;
  nome: string;
  versao_norma: string;
  limite_aprovacao: number;
  peso_leve: number;
  peso_media: number;
  peso_grave: number;
  peso_gravissima: number;
  limite_incapacidade_tecnica: number;
  primeira_incapacidade_gera_leve: number | boolean;
  tempo_minimo_segundos: number | null;
  ativo: number | boolean;
}

