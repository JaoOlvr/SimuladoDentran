import { InfracaoCatalogo, NaturezaInfracao, RegraPerfil } from '../rules/types';
import {
  EstadoSimuladoCalculado,
  MotivoEliminacao,
  MotivoNaoConcluido,
  SimuladoEvento,
  StatusSimulado,
} from './types';

/**
 * Retorna o peso em pontos correspondente à natureza da infração de acordo com o perfil estadual.
 */
export function obterPesoPorNatureza(
  natureza: NaturezaInfracao,
  perfil: RegraPerfil
): number {
  switch (natureza) {
    case 'leve':
      return perfil.peso_leve;
    case 'media':
      return perfil.peso_media;
    case 'grave':
      return perfil.peso_grave;
    case 'gravissima':
      return perfil.peso_gravissima;
    default:
      return 0;
  }
}

/**
 * Conta quantas ocorrências ativas de incapacidade técnica existem no log de eventos.
 */
export function contarIncapacidadesAtivas(eventos: SimuladoEvento[]): number {
  return eventos.filter(
    (e) => !e.desfeito && e.tipo_evento === 'INCAPACIDADE_TECNICA'
  ).length;
}

/**
 * Calcula deterministicamente os pontos totais das infrações ativas.
 */
export function calcularPontosTotais(
  eventos: SimuladoEvento[],
  perfil: RegraPerfil
): number {
  return eventos
    .filter((e) => !e.desfeito && e.tipo_evento === 'INFRACAO')
    .reduce((total, e) => {
      // Se tiver natureza_snapshot, calcula pelo perfil para permitir troca dinâmica de regras
      if (e.natureza_snapshot) {
        return total + obterPesoPorNatureza(e.natureza_snapshot, perfil);
      }
      return total + (e.pontos_snapshot || 0);
    }, 0);
}

/**
 * Calcula o estado completo do simulado a partir dos eventos ativos (Event Sourcing).
 * Função 100% pura, determinística e livre de efeitos colaterais.
 */
export function calcularEstadoSimulado(
  eventos: SimuladoEvento[],
  perfil: RegraPerfil,
  emAndamento: boolean = false
): EstadoSimuladoCalculado {
  const eventosAtivos = eventos.filter((e) => !e.desfeito);
  const contadorIncapacidade = contarIncapacidadesAtivas(eventosAtivos);
  const pontosTotais = calcularPontosTotais(eventosAtivos, perfil);
  const atingiuLimiteIncapacidade =
    contadorIncapacidade >= perfil.limite_incapacidade_tecnica;

  // 1. Verificação de Eliminação Imediata
  const eventoEliminacao = eventosAtivos.find((e) => e.tipo_evento === 'ELIMINACAO');
  if (eventoEliminacao) {
    return {
      status: 'ELIMINADO',
      pontos_totais: pontosTotais,
      nota_final: null,
      contador_incapacidade_tecnica: contadorIncapacidade,
      motivo_encerramento:
        eventoEliminacao.submotivo || 'Eliminação disciplinar ou conduta vedada',
      limite_aprovacao: perfil.limite_aprovacao,
      atingiu_limite_incapacidade: atingiuLimiteIncapacidade,
      eventos_ativos: eventosAtivos,
    };
  }

  // 2. Verificação de Interrupção / Não Concluído Manual
  const eventoNaoConcluido = eventosAtivos.find((e) => e.tipo_evento === 'NAO_CONCLUIDO');
  if (eventoNaoConcluido) {
    return {
      status: 'NAO_CONCLUIDO',
      pontos_totais: pontosTotais,
      nota_final: null,
      contador_incapacidade_tecnica: contadorIncapacidade,
      motivo_encerramento: eventoNaoConcluido.submotivo || 'Simulado não concluído',
      limite_aprovacao: perfil.limite_aprovacao,
      atingiu_limite_incapacidade: atingiuLimiteIncapacidade,
      eventos_ativos: eventosAtivos,
    };
  }

  // 3. Verificação de Incapacidade Técnica Reiterada (atingiu o limite)
  if (atingiuLimiteIncapacidade) {
    return {
      status: 'NAO_CONCLUIDO',
      pontos_totais: pontosTotais,
      nota_final: null,
      contador_incapacidade_tecnica: contadorIncapacidade,
      motivo_encerramento: 'incapacidade_tecnica_reiterada',
      limite_aprovacao: perfil.limite_aprovacao,
      atingiu_limite_incapacidade: true,
      eventos_ativos: eventosAtivos,
    };
  }

  // 4. Determinação de Status Regular (Aprovado vs Reprovado vs Em Andamento)
  let status: StatusSimulado;
  if (pontosTotais > perfil.limite_aprovacao) {
    status = 'REPROVADO';
  } else if (emAndamento) {
    status = 'EM_ANDAMENTO';
  } else {
    status = 'APROVADO';
  }

  return {
    status,
    pontos_totais: pontosTotais,
    nota_final: emAndamento ? null : pontosTotais,
    contador_incapacidade_tecnica: contadorIncapacidade,
    motivo_encerramento: null,
    limite_aprovacao: perfil.limite_aprovacao,
    atingiu_limite_incapacidade: false,
    eventos_ativos: eventosAtivos,
  };
}

/**
 * Gera um ID único simples para eventos locais.
 */
function gerarIdEvento(): string {
  return 'evt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
}

/**
 * Adiciona um evento de infração à lista de eventos.
 */
export function adicionarInfracao(
  eventos: SimuladoEvento[],
  infracao: InfracaoCatalogo,
  perfil: RegraPerfil,
  simuladoId: string,
  submotivo?: string
): SimuladoEvento[] {
  const pontos = obterPesoPorNatureza(infracao.natureza, perfil);
  const novoEvento: SimuladoEvento = {
    id: gerarIdEvento(),
    simulado_id: simuladoId,
    tipo_evento: 'INFRACAO',
    infracao_id: infracao.id,
    natureza_snapshot: infracao.natureza,
    pontos_snapshot: pontos,
    descricao_snapshot: infracao.descricao,
    submotivo: submotivo || infracao.artigo_ctb,
    timestamp_evento: new Date().toISOString(),
    desfeito: 0,
  };
  return [...eventos, novoEvento];
}

/**
 * Registra uma ocorrência de incapacidade técnica.
 * - 1ª ocorrência: incrementa contador e, se primeira_incapacidade_gera_leve for true,
 *   adiciona atomicamente uma infração leve vinculada ao Art. 169 com mesmo grupo_evento_id.
 * - 2ª ocorrência (ou limite atingido): adiciona o evento de incapacidade técnica.
 */
export function adicionarIncapacidadeTecnica(
  eventos: SimuladoEvento[],
  perfil: RegraPerfil,
  simuladoId: string,
  submotivo: string = 'Incapacidade técnica na manobra'
): SimuladoEvento[] {
  const contagemAtual = contarIncapacidadesAtivas(eventos);
  const proximaContagem = contagemAtual + 1;
  const timestamp = new Date().toISOString();
  const grupoId = 'grupo_incap_' + Date.now();

  const eventoIncapacidade: SimuladoEvento = {
    id: gerarIdEvento(),
    simulado_id: simuladoId,
    tipo_evento: 'INCAPACIDADE_TECNICA',
    pontos_snapshot: 0,
    descricao_snapshot: `Ocorrência ${proximaContagem} de incapacidade técnica`,
    submotivo,
    timestamp_evento: timestamp,
    desfeito: 0,
    grupo_evento_id: grupoId,
  };

  const novosEventos = [...eventos, eventoIncapacidade];

  // Se for a 1ª ocorrência e a regra estadual prever infração leve automática (Art. 169)
  if (proximaContagem === 1 && Boolean(perfil.primeira_incapacidade_gera_leve)) {
    const pontosLeve = perfil.peso_leve;
    const eventoInfracaoArt169: SimuladoEvento = {
      id: gerarIdEvento(),
      simulado_id: simuladoId,
      tipo_evento: 'INFRACAO',
      infracao_id: 'ctb_169',
      natureza_snapshot: 'leve',
      pontos_snapshot: pontosLeve,
      descricao_snapshot:
        'Dirigir sem atenção ou cuidados indispensáveis (Origem: 1ª Incapacidade Técnica)',
      submotivo: 'Art. 169 — Falta técnica operacional',
      timestamp_evento: timestamp,
      desfeito: 0,
      grupo_evento_id: grupoId,
      origem_incapacidade_tecnica: true,
    };
    novosEventos.push(eventoInfracaoArt169);
  }

  return novosEventos;
}

/**
 * Encerra o simulado imediatamente por eliminação com motivo tipificado.
 */
export function eliminarCandidato(
  eventos: SimuladoEvento[],
  simuladoId: string,
  motivo: MotivoEliminacao,
  observacao?: string
): SimuladoEvento[] {
  const novoEvento: SimuladoEvento = {
    id: gerarIdEvento(),
    simulado_id: simuladoId,
    tipo_evento: 'ELIMINACAO',
    pontos_snapshot: 0,
    descricao_snapshot: `Eliminação: ${motivo}`,
    submotivo: observacao ? `${motivo} — ${observacao}` : motivo,
    timestamp_evento: new Date().toISOString(),
    desfeito: 0,
  };
  return [...eventos, novoEvento];
}

/**
 * Interrompe o simulado por motivo justificado (não concluído).
 */
export function interromperSimulado(
  eventos: SimuladoEvento[],
  simuladoId: string,
  motivo: MotivoNaoConcluido,
  observacao?: string
): SimuladoEvento[] {
  const novoEvento: SimuladoEvento = {
    id: gerarIdEvento(),
    simulado_id: simuladoId,
    tipo_evento: 'NAO_CONCLUIDO',
    pontos_snapshot: 0,
    descricao_snapshot: `Interrupção: ${motivo}`,
    submotivo: observacao ? `${motivo} — ${observacao}` : motivo,
    timestamp_evento: new Date().toISOString(),
    desfeito: 0,
  };
  return [...eventos, novoEvento];
}

/**
 * Desfaz a última ação ativa em 1 toque.
 * Se a última ação pertencer a um grupo compartilhado (como a 1ª incapacidade técnica
 * + a infração leve do Art. 169 associada), reverte atomicamente todos os eventos do grupo.
 */
export function desfazerUltimoEvento(eventos: SimuladoEvento[]): SimuladoEvento[] {
  // Procura o último evento não desfeito (de trás para frente)
  let indiceUltimoAtivo = -1;
  for (let i = eventos.length - 1; i >= 0; i--) {
    if (!eventos[i].desfeito) {
      indiceUltimoAtivo = i;
      break;
    }
  }

  if (indiceUltimoAtivo === -1) {
    return eventos; // Nenhum evento ativo para desfazer
  }

  const eventoParaDesfazer = eventos[indiceUltimoAtivo];
  const grupoId = eventoParaDesfazer.grupo_evento_id;

  return eventos.map((ev) => {
    // Se o evento faz parte de um grupo compartilhado, desfaz todos do grupo
    if (grupoId && ev.grupo_evento_id === grupoId && !ev.desfeito) {
      return { ...ev, desfeito: 1 };
    }
    // Senão, desfaz apenas o último evento identificado
    if (!grupoId && ev.id === eventoParaDesfazer.id) {
      return { ...ev, desfeito: 1 };
    }
    return ev;
  });
}

