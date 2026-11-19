import { create } from 'zustand';
import { Aluno, SimuladoDb } from '../../data/db/schema';
import { InfracaoCatalogo, NaturezaInfracao, RegraPerfil } from '../../core/rules/types';
import {
  EstadoSimuladoCalculado,
  MotivoEliminacao,
  MotivoNaoConcluido,
  SimuladoEvento,
} from '../../core/scoring/types';
import {
  adicionarIncapacidadeTecnica,
  adicionarInfracao,
  calcularEstadoSimulado,
  desfazerUltimoEvento,
  eliminarCandidato,
  interromperSimulado,
} from '../../core/scoring/engine';
import { getPerfilPorUf, getCatalogoInfracoes } from '../../core/rules/loader';
import { simuladosRepository } from '../../data/db/repositories/simuladosRepository';
import { eventosRepository } from '../../data/db/repositories/eventosRepository';
import { alunosRepository } from '../../data/db/repositories/alunosRepository';
import {
  triggerHapticByNature,
  triggerHapticSuccess,
  triggerHapticWarning,
} from '../../components/HapticsFeedback';

export type AbaSimulado = 'frequentes' | 'grupo' | 'peso';

interface SimuladoStoreState {
  simuladoAtual: SimuladoDb | null;
  alunoAtual: Aluno | null;
  perfilRegra: RegraPerfil;
  eventos: SimuladoEvento[];
  estadoCalculado: EstadoSimuladoCalculado;
  catalogoInfracoes: InfracaoCatalogo[];
  abaAtiva: AbaSimulado;
  grupoFiltro: string;
  pesoFiltro: NaturezaInfracao | 'todos';
  buscaTexto: string;
  toastMensagem: string | null;
  carregando: boolean;

  // Ações
  setAbaAtiva: (aba: AbaSimulado) => void;
  setGrupoFiltro: (grupo: string) => void;
  setPesoFiltro: (peso: NaturezaInfracao | 'todos') => void;
  setBuscaTexto: (texto: string) => void;
  limparToast: () => void;

  iniciarNovoSimulado: (params: {
    alunoId?: string;
    categoria: 'A' | 'B';
    tipoCambio: 'manual' | 'automatico';
    uf?: string;
  }) => Promise<string>;

  carregarSimulado: (simuladoId: string) => Promise<void>;
  lancarInfracao: (infracao: InfracaoCatalogo) => Promise<void>;
  lancarIncapacidade: (submotivo?: string) => Promise<void>;
  desfazer: () => Promise<void>;
  eliminar: (motivo: MotivoEliminacao, observacao?: string) => Promise<void>;
  interromper: (motivo: MotivoNaoConcluido, observacao?: string) => Promise<void>;
  finalizarSimulado: (observacoes?: string) => Promise<EstadoSimuladoCalculado>;
}

const perfilPadrao = getPerfilPorUf('MA');
const catalogoCompleto = getCatalogoInfracoes();

export const useSimuladoStore = create<SimuladoStoreState>((set, get) => ({
  simuladoAtual: null,
  alunoAtual: null,
  perfilRegra: perfilPadrao,
  eventos: [],
  estadoCalculado: calcularEstadoSimulado([], perfilPadrao, true),
  catalogoInfracoes: catalogoCompleto,
  abaAtiva: 'frequentes',
  grupoFiltro: 'todos',
  pesoFiltro: 'todos',
  buscaTexto: '',
  toastMensagem: null,
  carregando: false,

  setAbaAtiva: (aba) => set({ abaAtiva: aba }),
  setGrupoFiltro: (grupo) => set({ grupoFiltro: grupo }),
  setPesoFiltro: (peso) => set({ pesoFiltro: peso }),
  setBuscaTexto: (texto) => set({ buscaTexto: texto }),
  limparToast: () => set({ toastMensagem: null }),

  iniciarNovoSimulado: async ({ alunoId, categoria, tipoCambio, uf = 'MA' }) => {
    set({ carregando: true });
    try {
      const perfil = getPerfilPorUf(uf);
      const now = new Date().toISOString();
      const idSimulado = 'sim_' + Date.now();

      let aluno: Aluno | undefined;
      let targetAlunoId = alunoId;

      if (!targetAlunoId) {
        // Simulado Rápido sem cadastro prévio
        const alunoAnonimo = await alunosRepository.criar({
          id: 'aluno_rapido_' + Date.now(),
          organizacao_id: 'org_default',
          instrutor_id: 'inst_default',
          nome: 'Aluno Simulado Rápido',
          categoria_pretendida: categoria,
          tipo_cambio: tipoCambio,
          consentimento_lgpd: 1,
          consentimento_em: now,
          created_at: now,
          updated_at: now,
        });
        targetAlunoId = alunoAnonimo.id;
        aluno = alunoAnonimo;
      } else {
        aluno = await alunosRepository.buscarPorId(targetAlunoId);
      }

      const novoSimulado = await simuladosRepository.criar({
        id: idSimulado,
        organizacao_id: 'org_default',
        instrutor_id: 'inst_default',
        aluno_id: targetAlunoId,
        perfil_regra_id: perfil.id,
        categoria,
        tipo_cambio: tipoCambio,
        status: 'EM_ANDAMENTO',
        pontos_totais: 0,
        contador_incapacidade_tecnica: 0,
        iniciado_em: now,
        updated_at: now,
      });

      const estadoInicial = calcularEstadoSimulado([], perfil, true);

      set({
        simuladoAtual: novoSimulado,
        alunoAtual: aluno || null,
        perfilRegra: perfil,
        eventos: [],
        estadoCalculado: estadoInicial,
        carregando: false,
        toastMensagem: null,
      });

      return idSimulado;
    } catch (error) {
      set({ carregando: false });
      throw error;
    }
  },

  carregarSimulado: async (simuladoId: string) => {
    set({ carregando: true });
    try {
      const sim = await simuladosRepository.buscarPorId(simuladoId);
      if (!sim) throw new Error('Simulado não encontrado');

      const aluno = await alunosRepository.buscarPorId(sim.aluno_id);
      const perfil = getPerfilPorUf('MA');

      const eventosDb = await eventosRepository.listarPorSimulado(simuladoId);
      const eventosAdaptados: SimuladoEvento[] = eventosDb.map((e) => ({
        id: e.id,
        simulado_id: e.simulado_id,
        tipo_evento: e.tipo_evento,
        infracao_id: e.infracao_id || undefined,
        natureza_snapshot: (e.natureza_snapshot as NaturezaInfracao) || undefined,
        pontos_snapshot: e.pontos_snapshot,
        descricao_snapshot: e.descricao_snapshot,
        submotivo: e.submotivo || undefined,
        timestamp_evento: e.timestamp_evento,
        desfeito: e.desfeito,
        grupo_evento_id: e.grupo_evento_id || undefined,
        origem_incapacidade_tecnica: Boolean(e.origem_incapacidade_tecnica),
      }));

      const emAndamento = sim.status === 'EM_ANDAMENTO';
      const estado = calcularEstadoSimulado(eventosAdaptados, perfil, emAndamento);

      set({
        simuladoAtual: sim,
        alunoAtual: aluno || null,
        perfilRegra: perfil,
        eventos: eventosAdaptados,
        estadoCalculado: estado,
        carregando: false,
      });
    } catch (error) {
      set({ carregando: false });
      throw error;
    }
  },

  lancarInfracao: async (infracao: InfracaoCatalogo) => {
    const { simuladoAtual, perfilRegra, eventos } = get();
    if (!simuladoAtual) return;

    // Dispara feedback háptico imediatamente (< 5ms)
    await triggerHapticByNature(infracao.natureza);

    const novosEventos = adicionarInfracao(
      eventos,
      infracao,
      perfilRegra,
      simuladoAtual.id
    );
    const novoEvento = novosEventos[novosEventos.length - 1];

    const novoEstado = calcularEstadoSimulado(novosEventos, perfilRegra, true);

    set({
      eventos: novosEventos,
      estadoCalculado: novoEstado,
      toastMensagem: `${infracao.artigo_ctb} (+${novoEvento.pontos_snapshot} pts) adicionado`,
    });

    // Gravação assíncrona ACID no SQLite
    await eventosRepository.inserir({
      id: novoEvento.id,
      simulado_id: novoEvento.simulado_id,
      tipo_evento: novoEvento.tipo_evento,
      infracao_id: novoEvento.infracao_id,
      natureza_snapshot: novoEvento.natureza_snapshot,
      pontos_snapshot: novoEvento.pontos_snapshot,
      descricao_snapshot: novoEvento.descricao_snapshot,
      submotivo: novoEvento.submotivo,
      timestamp_evento: novoEvento.timestamp_evento,
      desfeito: 0,
      origem_incapacidade_tecnica: 0,
    });

    await simuladosRepository.atualizar(simuladoAtual.id, {
      pontos_totais: novoEstado.pontos_totais,
      status: novoEstado.status,
    });
  },

  lancarIncapacidade: async (submotivo?: string) => {
    const { simuladoAtual, perfilRegra, eventos } = get();
    if (!simuladoAtual) return;

    await triggerHapticWarning();

    const novosEventos = adicionarIncapacidadeTecnica(
      eventos,
      perfilRegra,
      simuladoAtual.id,
      submotivo
    );
    const novoEstado = calcularEstadoSimulado(novosEventos, perfilRegra, true);

    set({
      eventos: novosEventos,
      estadoCalculado: novoEstado,
      toastMensagem: `Ocorrência ${novoEstado.contador_incapacidade_tecnica}/2 de incapacidade registrada`,
    });

    // Persiste todos os eventos recém-criados que não existiam
    const eventosParaInserir = novosEventos.slice(eventos.length);
    for (const ev of eventosParaInserir) {
      await eventosRepository.inserir({
        id: ev.id,
        simulado_id: ev.simulado_id,
        tipo_evento: ev.tipo_evento,
        infracao_id: ev.infracao_id,
        natureza_snapshot: ev.natureza_snapshot,
        pontos_snapshot: ev.pontos_snapshot,
        descricao_snapshot: ev.descricao_snapshot,
        submotivo: ev.submotivo,
        timestamp_evento: ev.timestamp_evento,
        desfeito: 0,
        grupo_evento_id: ev.grupo_evento_id,
        origem_incapacidade_tecnica: ev.origem_incapacidade_tecnica ? 1 : 0,
      });
    }

    await simuladosRepository.atualizar(simuladoAtual.id, {
      pontos_totais: novoEstado.pontos_totais,
      contador_incapacidade_tecnica: novoEstado.contador_incapacidade_tecnica,
      status: novoEstado.status,
      motivo_encerramento: novoEstado.motivo_encerramento,
    });
  },

  desfazer: async () => {
    const { simuladoAtual, perfilRegra, eventos } = get();
    if (!simuladoAtual || eventos.length === 0) return;

    // Identifica o último ativo
    let ultimoAtivo: SimuladoEvento | undefined;
    for (let i = eventos.length - 1; i >= 0; i--) {
      if (!eventos[i].desfeito) {
        ultimoAtivo = eventos[i];
        break;
      }
    }
    if (!ultimoAtivo) return;

    const eventosAposUndo = desfazerUltimoEvento(eventos);
    const novoEstado = calcularEstadoSimulado(eventosAposUndo, perfilRegra, true);

    set({
      eventos: eventosAposUndo,
      estadoCalculado: novoEstado,
      toastMensagem: 'Último lançamento desfeito',
    });

    await triggerHapticSuccess();

    if (ultimoAtivo.grupo_evento_id) {
      await eventosRepository.marcarGrupoComoDesfeito(ultimoAtivo.grupo_evento_id);
    } else {
      await eventosRepository.marcarComoDesfeito(ultimoAtivo.id);
    }

    await simuladosRepository.atualizar(simuladoAtual.id, {
      pontos_totais: novoEstado.pontos_totais,
      contador_incapacidade_tecnica: novoEstado.contador_incapacidade_tecnica,
      status: novoEstado.status,
      motivo_encerramento: novoEstado.motivo_encerramento,
    });
  },

  eliminar: async (motivo: MotivoEliminacao, observacao?: string) => {
    const { simuladoAtual, perfilRegra, eventos } = get();
    if (!simuladoAtual) return;

    await triggerHapticWarning();

    const novosEventos = eliminarCandidato(eventos, simuladoAtual.id, motivo, observacao);
    const novoEstado = calcularEstadoSimulado(novosEventos, perfilRegra, false);
    const eventoEliminacao = novosEventos[novosEventos.length - 1];

    set({
      eventos: novosEventos,
      estadoCalculado: novoEstado,
      toastMensagem: `Candidato ELIMINADO (${motivo})`,
    });

    await eventosRepository.inserir({
      id: eventoEliminacao.id,
      simulado_id: eventoEliminacao.simulado_id,
      tipo_evento: eventoEliminacao.tipo_evento,
      pontos_snapshot: 0,
      descricao_snapshot: eventoEliminacao.descricao_snapshot,
      submotivo: eventoEliminacao.submotivo,
      timestamp_evento: eventoEliminacao.timestamp_evento,
      desfeito: 0,
      origem_incapacidade_tecnica: 0,
    });

    await simuladosRepository.atualizar(simuladoAtual.id, {
      status: 'ELIMINADO',
      nota_final: null,
      motivo_encerramento: eventoEliminacao.submotivo,
      finalizado_em: new Date().toISOString(),
    });
  },

  interromper: async (motivo: MotivoNaoConcluido, observacao?: string) => {
    const { simuladoAtual, perfilRegra, eventos } = get();
    if (!simuladoAtual) return;

    await triggerHapticWarning();

    const novosEventos = interromperSimulado(
      eventos,
      simuladoAtual.id,
      motivo,
      observacao
    );
    const novoEstado = calcularEstadoSimulado(novosEventos, perfilRegra, false);
    const eventoInterrupcao = novosEventos[novosEventos.length - 1];

    set({
      eventos: novosEventos,
      estadoCalculado: novoEstado,
      toastMensagem: `Exame NÃO CONCLUÍDO (${motivo})`,
    });

    await eventosRepository.inserir({
      id: eventoInterrupcao.id,
      simulado_id: eventoInterrupcao.simulado_id,
      tipo_evento: eventoInterrupcao.tipo_evento,
      pontos_snapshot: 0,
      descricao_snapshot: eventoInterrupcao.descricao_snapshot,
      submotivo: eventoInterrupcao.submotivo,
      timestamp_evento: eventoInterrupcao.timestamp_evento,
      desfeito: 0,
      origem_incapacidade_tecnica: 0,
    });

    await simuladosRepository.atualizar(simuladoAtual.id, {
      status: 'NAO_CONCLUIDO',
      nota_final: null,
      motivo_encerramento: eventoInterrupcao.submotivo,
      finalizado_em: new Date().toISOString(),
    });
  },

  finalizarSimulado: async (observacoes?: string) => {
    const { simuladoAtual, perfilRegra, eventos } = get();
    if (!simuladoAtual) throw new Error('Nenhum simulado em andamento');

    const estadoFinal = calcularEstadoSimulado(eventos, perfilRegra, false);
    const now = new Date().toISOString();

    await simuladosRepository.atualizar(simuladoAtual.id, {
      status: estadoFinal.status,
      pontos_totais: estadoFinal.pontos_totais,
      nota_final: estadoFinal.nota_final,
      contador_incapacidade_tecnica: estadoFinal.contador_incapacidade_tecnica,
      motivo_encerramento: estadoFinal.motivo_encerramento,
      observacoes_instrutor: observacoes || null,
      finalizado_em: now,
    });

    set({ estadoCalculado: estadoFinal });
    return estadoFinal;
  },
}));

