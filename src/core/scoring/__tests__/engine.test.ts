import {
  calcularEstadoSimulado,
  obterPesoPorNatureza,
  contarIncapacidadesAtivas,
  adicionarInfracao,
  adicionarIncapacidadeTecnica,
  eliminarCandidato,
  interromperSimulado,
  desfazerUltimoEvento,
} from '../engine';
import { RegraPerfil, InfracaoCatalogo } from '../../rules/types';
import { SimuladoEvento } from '../types';

const perfilMAPadrao: RegraPerfil = {
  id: 'perfil_ma_2026',
  uf: 'MA',
  nome: 'Maranhão — Padrão Res. 1.020/2025',
  versao_norma: '1.0.0',
  limite_aprovacao: 10,
  peso_leve: 1,
  peso_media: 2,
  peso_grave: 4,
  peso_gravissima: 6,
  limite_incapacidade_tecnica: 2,
  primeira_incapacidade_gera_leve: 1,
  tempo_minimo_segundos: null,
  ativo: 1,
};

const mockInfracaoLeve: InfracaoCatalogo = {
  id: 'inf_leve',
  artigo_ctb: 'Art. 169',
  descricao: 'Falta leve',
  natureza: 'leve',
  pontos: 1,
  categorias_aplicaveis: ['B'],
  agrupamento_ux: 'conducao_e_controle',
  fonte: 'CTB',
};

const mockInfracaoMedia: InfracaoCatalogo = {
  id: 'inf_media',
  artigo_ctb: 'Art. 227',
  descricao: 'Falta média',
  natureza: 'media',
  pontos: 2,
  categorias_aplicaveis: ['B'],
  agrupamento_ux: 'equipamentos',
  fonte: 'CTB',
};

const mockInfracaoGrave: InfracaoCatalogo = {
  id: 'inf_grave',
  artigo_ctb: 'Art. 196',
  descricao: 'Falta grave (não dar seta)',
  natureza: 'grave',
  pontos: 4,
  categorias_aplicaveis: ['B'],
  agrupamento_ux: 'sinalizacao',
  fonte: 'CTB',
};

const mockInfracaoGravissima: InfracaoCatalogo = {
  id: 'inf_gravissima',
  artigo_ctb: 'Art. 208',
  descricao: 'Falta gravíssima (avançar sinal/PARE)',
  natureza: 'gravissima',
  pontos: 6,
  categorias_aplicaveis: ['B'],
  agrupamento_ux: 'sinalizacao',
  fonte: 'CTB',
};

describe('Fase 1 — Motor de Pontuação Puro (Scoring Engine)', () => {
  const simuladoId = 'sim_test_123';

  describe('1. Pesos por Natureza (Art. 45 Res. 1.020/2025)', () => {
    test('deve retornar os pesos oficiais: leve=1, media=2, grave=4, gravissima=6', () => {
      expect(obterPesoPorNatureza('leve', perfilMAPadrao)).toBe(1);
      expect(obterPesoPorNatureza('media', perfilMAPadrao)).toBe(2);
      expect(obterPesoPorNatureza('grave', perfilMAPadrao)).toBe(4);
      expect(obterPesoPorNatureza('gravissima', perfilMAPadrao)).toBe(6);
    });

    test('deve somar corretamente uma combinação de infrações', () => {
      let eventos: SimuladoEvento[] = [];
      eventos = adicionarInfracao(eventos, mockInfracaoLeve, perfilMAPadrao, simuladoId); // +1
      eventos = adicionarInfracao(eventos, mockInfracaoMedia, perfilMAPadrao, simuladoId); // +2
      eventos = adicionarInfracao(eventos, mockInfracaoGrave, perfilMAPadrao, simuladoId); // +4

      const estado = calcularEstadoSimulado(eventos, perfilMAPadrao);
      expect(estado.pontos_totais).toBe(7);
      expect(estado.status).toBe('APROVADO');
      expect(estado.nota_final).toBe(7);
    });

    test('não deve reprovar automaticamente por falta gravíssima isolada (6 pontos)', () => {
      let eventos: SimuladoEvento[] = [];
      eventos = adicionarInfracao(eventos, mockInfracaoGravissima, perfilMAPadrao, simuladoId);

      const estado = calcularEstadoSimulado(eventos, perfilMAPadrao);
      expect(estado.pontos_totais).toBe(6);
      expect(estado.status).toBe('APROVADO'); // 6 <= 10 -> Aprovado
      expect(estado.nota_final).toBe(6);
    });
  });

  describe('2. Critério de Aprovação e Casos de Borda (Art. 47 Res. 1.020/2025)', () => {
    test('candidato com 0 pontos deve ser APROVADO com nota 0', () => {
      const estado = calcularEstadoSimulado([], perfilMAPadrao);
      expect(estado.pontos_totais).toBe(0);
      expect(estado.status).toBe('APROVADO');
      expect(estado.nota_final).toBe(0);
    });

    test('candidato com 9 pontos deve ser APROVADO', () => {
      let eventos: SimuladoEvento[] = [];
      // 1 gravíssima (6) + 1 média (2) + 1 leve (1) = 9
      eventos = adicionarInfracao(eventos, mockInfracaoGravissima, perfilMAPadrao, simuladoId);
      eventos = adicionarInfracao(eventos, mockInfracaoMedia, perfilMAPadrao, simuladoId);
      eventos = adicionarInfracao(eventos, mockInfracaoLeve, perfilMAPadrao, simuladoId);

      const estado = calcularEstadoSimulado(eventos, perfilMAPadrao);
      expect(estado.pontos_totais).toBe(9);
      expect(estado.status).toBe('APROVADO');
      expect(estado.nota_final).toBe(9);
    });

    test('candidato com exatamente 10 pontos deve ser APROVADO (10 aprova)', () => {
      let eventos: SimuladoEvento[] = [];
      // 1 gravíssima (6) + 1 grave (4) = 10
      eventos = adicionarInfracao(eventos, mockInfracaoGravissima, perfilMAPadrao, simuladoId);
      eventos = adicionarInfracao(eventos, mockInfracaoGrave, perfilMAPadrao, simuladoId);

      const estado = calcularEstadoSimulado(eventos, perfilMAPadrao);
      expect(estado.pontos_totais).toBe(10);
      expect(estado.status).toBe('APROVADO');
      expect(estado.nota_final).toBe(10);
    });

    test('candidato com 11 pontos deve ser REPROVADO', () => {
      let eventos: SimuladoEvento[] = [];
      // 1 gravíssima (6) + 1 grave (4) + 1 leve (1) = 11
      eventos = adicionarInfracao(eventos, mockInfracaoGravissima, perfilMAPadrao, simuladoId);
      eventos = adicionarInfracao(eventos, mockInfracaoGrave, perfilMAPadrao, simuladoId);
      eventos = adicionarInfracao(eventos, mockInfracaoLeve, perfilMAPadrao, simuladoId);

      const estado = calcularEstadoSimulado(eventos, perfilMAPadrao);
      expect(estado.pontos_totais).toBe(11);
      expect(estado.status).toBe('REPROVADO');
      expect(estado.nota_final).toBe(11);
    });

    test('duas faltas gravíssimas totalizam 12 pontos e resultam em REPROVADO', () => {
      let eventos: SimuladoEvento[] = [];
      eventos = adicionarInfracao(eventos, mockInfracaoGravissima, perfilMAPadrao, simuladoId);
      eventos = adicionarInfracao(eventos, mockInfracaoGravissima, perfilMAPadrao, simuladoId);

      const estado = calcularEstadoSimulado(eventos, perfilMAPadrao);
      expect(estado.pontos_totais).toBe(12);
      expect(estado.status).toBe('REPROVADO');
    });

    test('em andamento com <= 10 pontos deve retornar status EM_ANDAMENTO e nota_final null', () => {
      let eventos: SimuladoEvento[] = [];
      eventos = adicionarInfracao(eventos, mockInfracaoMedia, perfilMAPadrao, simuladoId);

      const estado = calcularEstadoSimulado(eventos, perfilMAPadrao, true);
      expect(estado.status).toBe('EM_ANDAMENTO');
      expect(estado.nota_final).toBeNull();
      expect(estado.pontos_totais).toBe(2);
    });
  });

  describe('3. Desfazer Lançamento (Undo)', () => {
    test('deve desfazer a última infração com recálculo determinístico', () => {
      let eventos: SimuladoEvento[] = [];
      eventos = adicionarInfracao(eventos, mockInfracaoMedia, perfilMAPadrao, simuladoId); // +2
      eventos = adicionarInfracao(eventos, mockInfracaoGrave, perfilMAPadrao, simuladoId); // +4
      expect(calcularEstadoSimulado(eventos, perfilMAPadrao).pontos_totais).toBe(6);

      // Desfaz o último (a grave de 4 pontos)
      eventos = desfazerUltimoEvento(eventos);
      const estadoAposUndo = calcularEstadoSimulado(eventos, perfilMAPadrao);
      expect(estadoAposUndo.pontos_totais).toBe(2);
      expect(estadoAposUndo.eventos_ativos.length).toBe(1);
    });

    test('deve desfazer em sequência até lista de eventos ativos ficar vazia', () => {
      let eventos: SimuladoEvento[] = [];
      eventos = adicionarInfracao(eventos, mockInfracaoLeve, perfilMAPadrao, simuladoId);
      eventos = adicionarInfracao(eventos, mockInfracaoMedia, perfilMAPadrao, simuladoId);

      eventos = desfazerUltimoEvento(eventos); // Remove média
      expect(calcularEstadoSimulado(eventos, perfilMAPadrao).pontos_totais).toBe(1);

      eventos = desfazerUltimoEvento(eventos); // Remove leve
      expect(calcularEstadoSimulado(eventos, perfilMAPadrao).pontos_totais).toBe(0);

      // Desfazer quando já não há ativos não deve quebrar
      eventos = desfazerUltimoEvento(eventos);
      expect(calcularEstadoSimulado(eventos, perfilMAPadrao).pontos_totais).toBe(0);
    });
  });

  describe('4. Incapacidade Técnica e Desfazimento Atômico', () => {
    test('1ª ocorrência deve incrementar contador para 1 e lançar Art. 169 (+1 pt leve)', () => {
      let eventos: SimuladoEvento[] = [];
      eventos = adicionarIncapacidadeTecnica(eventos, perfilMAPadrao, simuladoId, 'Apagou o motor');

      const estado = calcularEstadoSimulado(eventos, perfilMAPadrao);
      expect(estado.contador_incapacidade_tecnica).toBe(1);
      expect(estado.pontos_totais).toBe(1); // 1 ponto pelo Art. 169 automático
      expect(estado.status).toBe('APROVADO');

      // Verifica se o evento de infração foi marcado com origem_incapacidade_tecnica
      const eventoInfracao = eventos.find((e) => e.tipo_evento === 'INFRACAO');
      expect(eventoInfracao?.origem_incapacidade_tecnica).toBe(true);
      expect(eventoInfracao?.infracao_id).toBe('ctb_169');
    });

    test('desfazer a 1ª ocorrência de incapacidade técnica deve zerar contador E remover o ponto do Art. 169 atomicamente', () => {
      let eventos: SimuladoEvento[] = [];
      eventos = adicionarIncapacidadeTecnica(eventos, perfilMAPadrao, simuladoId, 'Errou marcha');
      expect(calcularEstadoSimulado(eventos, perfilMAPadrao).pontos_totais).toBe(1);
      expect(contarIncapacidadesAtivas(eventos)).toBe(1);

      // Desfaz em 1 toque
      eventos = desfazerUltimoEvento(eventos);
      const estadoAposUndo = calcularEstadoSimulado(eventos, perfilMAPadrao);

      expect(estadoAposUndo.contador_incapacidade_tecnica).toBe(0);
      expect(estadoAposUndo.pontos_totais).toBe(0);
      expect(estadoAposUndo.eventos_ativos.length).toBe(0);
    });

    test('2ª ocorrência de incapacidade técnica atinge o limite e encerra como NAO_CONCLUIDO sem nota final', () => {
      let eventos: SimuladoEvento[] = [];
      // 1ª ocorrência (+1 pt Art. 169)
      eventos = adicionarIncapacidadeTecnica(eventos, perfilMAPadrao, simuladoId, '1ª falta');
      expect(calcularEstadoSimulado(eventos, perfilMAPadrao).contador_incapacidade_tecnica).toBe(1);

      // 2ª ocorrência
      eventos = adicionarIncapacidadeTecnica(eventos, perfilMAPadrao, simuladoId, '2ª falta');
      const estado = calcularEstadoSimulado(eventos, perfilMAPadrao);

      expect(estado.contador_incapacidade_tecnica).toBe(2);
      expect(estado.atingiu_limite_incapacidade).toBe(true);
      expect(estado.status).toBe('NAO_CONCLUIDO');
      expect(estado.nota_final).toBeNull();
      expect(estado.motivo_encerramento).toBe('incapacidade_tecnica_reiterada');
    });
  });

  describe('5. Encerramento Excepcional — ELIMINADO', () => {
    test('eliminação imediata por desacato encerra com status ELIMINADO e nota_final = null', () => {
      let eventos: SimuladoEvento[] = [];
      eventos = adicionarInfracao(eventos, mockInfracaoMedia, perfilMAPadrao, simuladoId); // 2 pontos prévios
      eventos = eliminarCandidato(
        eventos,
        simuladoId,
        'desrespeito_ou_desacato',
        'Ofensa verbal ao examinador'
      );

      const estado = calcularEstadoSimulado(eventos, perfilMAPadrao);
      expect(estado.status).toBe('ELIMINADO');
      expect(estado.nota_final).toBeNull();
      expect(estado.pontos_totais).toBe(2); // Pontos registrados são mantidos para fins de histórico
      expect(estado.motivo_encerramento).toContain('desrespeito_ou_desacato');
    });

    test('eliminação por fraude sobrepõe mesmo se pontuação for baixa', () => {
      let eventos: SimuladoEvento[] = [];
      eventos = eliminarCandidato(eventos, simuladoId, 'fraude', 'Uso de fone de ouvido transmissor');

      const estado = calcularEstadoSimulado(eventos, perfilMAPadrao);
      expect(estado.status).toBe('ELIMINADO');
      expect(estado.nota_final).toBeNull();
      expect(estado.motivo_encerramento).toContain('fraude');
    });
  });

  describe('6. Encerramento Excepcional — NAO_CONCLUIDO (Art. 46 Res. 1.020/2025)', () => {
    test('interrupção por sinistro de trânsito define NAO_CONCLUIDO e nota_final = null', () => {
      let eventos: SimuladoEvento[] = [];
      eventos = adicionarInfracao(eventos, mockInfracaoGrave, perfilMAPadrao, simuladoId);
      eventos = interromperSimulado(
        eventos,
        simuladoId,
        'sinistro_transito',
        'Colisão leve traseira de terceiro'
      );

      const estado = calcularEstadoSimulado(eventos, perfilMAPadrao);
      expect(estado.status).toBe('NAO_CONCLUIDO');
      expect(estado.nota_final).toBeNull();
      expect(estado.motivo_encerramento).toContain('sinistro_transito');
    });

    test('interrupção por instabilidade emocional define NAO_CONCLUIDO e nota_final = null', () => {
      let eventos: SimuladoEvento[] = [];
      eventos = interromperSimulado(
        eventos,
        simuladoId,
        'instabilidade_emocional',
        'Candidato em crise de ansiedade'
      );

      const estado = calcularEstadoSimulado(eventos, perfilMAPadrao);
      expect(estado.status).toBe('NAO_CONCLUIDO');
      expect(estado.nota_final).toBeNull();
    });
  });

  describe('7. Parametrização por Perfis Estaduais (RegraPerfil)', () => {
    test('alteração de limite estadual muda o resultado sem alterar código', () => {
      const perfilRigoroso: RegraPerfil = {
        ...perfilMAPadrao,
        id: 'perfil_custom',
        limite_aprovacao: 7, // Limite mais rigoroso
      };

      let eventos: SimuladoEvento[] = [];
      // 2 faltas graves = 8 pontos
      eventos = adicionarInfracao(eventos, mockInfracaoGrave, perfilMAPadrao, simuladoId);
      eventos = adicionarInfracao(eventos, mockInfracaoGrave, perfilMAPadrao, simuladoId);

      // No perfil padrão MA (limite 10): 8 pts APROVA
      const estadoMA = calcularEstadoSimulado(eventos, perfilMAPadrao);
      expect(estadoMA.pontos_totais).toBe(8);
      expect(estadoMA.status).toBe('APROVADO');

      // No perfil rigoroso (limite 7): 8 pts REPROVA
      const estadoRigoroso = calcularEstadoSimulado(eventos, perfilRigoroso);
      expect(estadoRigoroso.pontos_totais).toBe(8);
      expect(estadoRigoroso.status).toBe('REPROVADO');
    });

    test('perfil onde primeira incapacidade NÃO gera falta leve', () => {
      const perfilSemLeve: RegraPerfil = {
        ...perfilMAPadrao,
        primeira_incapacidade_gera_leve: 0,
      };

      let eventos: SimuladoEvento[] = [];
      eventos = adicionarIncapacidadeTecnica(eventos, perfilSemLeve, simuladoId, 'Primeira falha');

      const estado = calcularEstadoSimulado(eventos, perfilSemLeve);
      expect(estado.contador_incapacidade_tecnica).toBe(1);
      expect(estado.pontos_totais).toBe(0); // Não somou o Art. 169
    });

    test('deve retornar 0 para natureza de infração inválida ou desconhecida', () => {
      // @ts-expect-error teste com valor arbitrário
      expect(obterPesoPorNatureza('invalida', perfilMAPadrao)).toBe(0);
    });

    test('deve somar pontos_snapshot quando natureza_snapshot estiver ausente', () => {
      const eventosLegados: SimuladoEvento[] = [
        {
          id: 'evt_legado',
          simulado_id: simuladoId,
          tipo_evento: 'INFRACAO',
          pontos_snapshot: 5,
          descricao_snapshot: 'Evento legado com pontuação direta',
          timestamp_evento: new Date().toISOString(),
          desfeito: 0,
        },
      ];

      const estado = calcularEstadoSimulado(eventosLegados, perfilMAPadrao);
      expect(estado.pontos_totais).toBe(5);
    });
  });
});

