import { calcularEvolucaoAluno } from '../evolucaoService';
import { SimuladoDb, SimuladoEventoDb } from '../../../data/db/schema';

describe('Fase 4 — Serviço de Evolução do Aluno e Top Erros', () => {
  const simuladosMock: SimuladoDb[] = [
    {
      id: 'sim_1',
      organizacao_id: 'org_1',
      instrutor_id: 'inst_1',
      aluno_id: 'aluno_1',
      perfil_regra_id: 'perfil_ma',
      categoria: 'B',
      tipo_cambio: 'manual',
      status: 'REPROVADO',
      pontos_totais: 12,
      nota_final: 12,
      contador_incapacidade_tecnica: 0,
      iniciado_em: '2026-11-01T10:00:00.000Z',
      updated_at: '2026-11-01T10:00:00.000Z',
      motivo_encerramento: null,
      observacoes_instrutor: null,
      finalizado_em: null,
      synced_at: null,
    },
    {
      id: 'sim_2',
      organizacao_id: 'org_1',
      instrutor_id: 'inst_1',
      aluno_id: 'aluno_1',
      perfil_regra_id: 'perfil_ma',
      categoria: 'B',
      tipo_cambio: 'manual',
      status: 'APROVADO',
      pontos_totais: 6,
      nota_final: 6,
      contador_incapacidade_tecnica: 0,
      iniciado_em: '2026-11-08T10:00:00.000Z',
      updated_at: '2026-11-08T10:00:00.000Z',
      motivo_encerramento: null,
      observacoes_instrutor: null,
      finalizado_em: null,
      synced_at: null,
    },
    {
      id: 'sim_3',
      organizacao_id: 'org_1',
      instrutor_id: 'inst_1',
      aluno_id: 'aluno_1',
      perfil_regra_id: 'perfil_ma',
      categoria: 'B',
      tipo_cambio: 'manual',
      status: 'APROVADO',
      pontos_totais: 2,
      nota_final: 2,
      contador_incapacidade_tecnica: 0,
      iniciado_em: '2026-11-15T10:00:00.000Z',
      updated_at: '2026-11-15T10:00:00.000Z',
      motivo_encerramento: null,
      observacoes_instrutor: null,
      finalizado_em: null,
      synced_at: null,
    },
  ];

  const eventosMock: SimuladoEventoDb[] = [
    // Seta cometida 3 vezes
    {
      id: 'e1',
      simulado_id: 'sim_1',
      tipo_evento: 'INFRACAO',
      infracao_id: 'ctb_196',
      descricao_snapshot: 'Não deu seta',
      submotivo: 'Art. 196',
      pontos_snapshot: 4,
      natureza_snapshot: 'grave',
      timestamp_evento: '2026-11-01T10:05:00.000Z',
      desfeito: 0,
      grupo_evento_id: null,
      origem_incapacidade_tecnica: 0,
    },
    {
      id: 'e2',
      simulado_id: 'sim_1',
      tipo_evento: 'INFRACAO',
      infracao_id: 'ctb_196',
      descricao_snapshot: 'Não deu seta',
      submotivo: 'Art. 196',
      pontos_snapshot: 4,
      natureza_snapshot: 'grave',
      timestamp_evento: '2026-11-01T10:10:00.000Z',
      desfeito: 0,
      grupo_evento_id: null,
      origem_incapacidade_tecnica: 0,
    },
    {
      id: 'e3',
      simulado_id: 'sim_2',
      tipo_evento: 'INFRACAO',
      infracao_id: 'ctb_196',
      descricao_snapshot: 'Não deu seta',
      submotivo: 'Art. 196',
      pontos_snapshot: 4,
      natureza_snapshot: 'grave',
      timestamp_evento: '2026-11-08T10:05:00.000Z',
      desfeito: 0,
      grupo_evento_id: null,
      origem_incapacidade_tecnica: 0,
    },
    // Apagar motor cometido 2 vezes
    {
      id: 'e4',
      simulado_id: 'sim_1',
      tipo_evento: 'INFRACAO',
      infracao_id: 'ctb_169',
      descricao_snapshot: 'Apagou o motor',
      submotivo: 'Art. 169',
      pontos_snapshot: 1,
      natureza_snapshot: 'leve',
      timestamp_evento: '2026-11-01T10:12:00.000Z',
      desfeito: 0,
      grupo_evento_id: null,
      origem_incapacidade_tecnica: 0,
    },
    {
      id: 'e5',
      simulado_id: 'sim_2',
      tipo_evento: 'INFRACAO',
      infracao_id: 'ctb_169',
      descricao_snapshot: 'Apagou o motor',
      submotivo: 'Art. 169',
      pontos_snapshot: 1,
      natureza_snapshot: 'leve',
      timestamp_evento: '2026-11-08T10:12:00.000Z',
      desfeito: 0,
      grupo_evento_id: null,
      origem_incapacidade_tecnica: 0,
    },
    // Baliza afastada cometida 1 vez
    {
      id: 'e6',
      simulado_id: 'sim_3',
      tipo_evento: 'INFRACAO',
      infracao_id: 'ctb_181_xvii',
      descricao_snapshot: 'Estacionar afastado da guia',
      submotivo: 'Art. 181, XVII',
      pontos_snapshot: 2,
      natureza_snapshot: 'media',
      timestamp_evento: '2026-11-15T10:12:00.000Z',
      desfeito: 0,
      grupo_evento_id: null,
      origem_incapacidade_tecnica: 0,
    },
    // Evento desfeito (não deve contar)
    {
      id: 'e7',
      simulado_id: 'sim_3',
      tipo_evento: 'INFRACAO',
      infracao_id: 'ctb_208',
      descricao_snapshot: 'Avançar sinal',
      submotivo: 'Art. 208',
      pontos_snapshot: 6,
      natureza_snapshot: 'gravissima',
      timestamp_evento: '2026-11-15T10:15:00.000Z',
      desfeito: 1,
      grupo_evento_id: null,
      origem_incapacidade_tecnica: 0,
    },
  ];

  test('deve calcular taxa de aprovação e média geral de pontos', () => {
    const evolucao = calcularEvolucaoAluno(simuladosMock, eventosMock);

    expect(evolucao.totalSimulados).toBe(3);
    expect(evolucao.totalAprovados).toBe(2);
    expect(evolucao.totalReprovados).toBe(1);
    expect(evolucao.taxaAprovacao).toBe(67); // 2/3 = 67%
    expect(evolucao.mediaPontos).toBe(6.7); // (12 + 6 + 2) / 3 = 6.666... -> 6.7
  });

  test('deve ordenar histórico cronologicamente para gráfico de tendência', () => {
    const evolucao = calcularEvolucaoAluno(simuladosMock, eventosMock);

    expect(evolucao.historicoPontos.length).toBe(3);
    expect(evolucao.historicoPontos[0].pontos).toBe(12); // Mais antigo
    expect(evolucao.historicoPontos[1].pontos).toBe(6);
    expect(evolucao.historicoPontos[2].pontos).toBe(2); // Mais recente
  });

  test('deve identificar com precisão o Top 3 erros mais recorrentes', () => {
    const evolucao = calcularEvolucaoAluno(simuladosMock, eventosMock);

    expect(evolucao.topErros.length).toBe(3);

    // 1º lugar: Não deu seta (3x)
    expect(evolucao.topErros[0].infracao_id).toBe('ctb_196');
    expect(evolucao.topErros[0].total_ocorrencias).toBe(3);

    // 2º lugar: Apagou motor (2x)
    expect(evolucao.topErros[1].infracao_id).toBe('ctb_169');
    expect(evolucao.topErros[1].total_ocorrencias).toBe(2);

    // 3º lugar: Baliza afastada (1x)
    expect(evolucao.topErros[2].infracao_id).toBe('ctb_181_xvii');
    expect(evolucao.topErros[2].total_ocorrencias).toBe(1);
  });
});

