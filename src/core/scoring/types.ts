import { NaturezaInfracao, RegraPerfil } from '../rules/types';

export type StatusSimulado =
  | 'EM_ANDAMENTO'
  | 'APROVADO'
  | 'REPROVADO'
  | 'NAO_CONCLUIDO'
  | 'ELIMINADO';

export type TipoEventoSimulado =
  | 'INFRACAO'
  | 'INCAPACIDADE_TECNICA'
  | 'ELIMINACAO'
  | 'NAO_CONCLUIDO';

export type MotivoEliminacao =
  | 'fraude'
  | 'desrespeito_ou_desacato'
  | 'desobediencia_grave';

export type MotivoNaoConcluido =
  | 'sinistro_transito'
  | 'instabilidade_emocional'
  | 'retencao_veiculo'
  | 'incapacidade_tecnica_reiterada';

export interface SimuladoEvento {
  id: string;
  simulado_id: string;
  tipo_evento: TipoEventoSimulado;
  infracao_id?: string;
  natureza_snapshot?: NaturezaInfracao;
  pontos_snapshot: number;
  descricao_snapshot: string;
  submotivo?: string;
  timestamp_evento: string;
  desfeito: number; // 0 = ativo, 1 = desfeito
  grupo_evento_id?: string; // Usado para agrupar eventos interdependentes (ex: incapacidade técnica + infração leve Art. 169)
  origem_incapacidade_tecnica?: boolean;
}

export interface EstadoSimuladoCalculado {
  status: StatusSimulado;
  pontos_totais: number;
  nota_final: number | null;
  contador_incapacidade_tecnica: number;
  motivo_encerramento: string | null;
  limite_aprovacao: number;
  atingiu_limite_incapacidade: boolean;
  eventos_ativos: SimuladoEvento[];
}

