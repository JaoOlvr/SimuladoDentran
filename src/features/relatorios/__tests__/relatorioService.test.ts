import { gerarHtmlRelatorio } from '../pdfTemplate';
import { relatorioService } from '../relatorioService';
import { SimuladoDb, Aluno } from '../../../data/db/schema';
import { RegraPerfil } from '../../../core/rules/types';
import { SimuladoEvento } from '../../../core/scoring/types';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const mockPerfil: RegraPerfil = {
  id: 'perfil_ma_2026',
  uf: 'MA',
  nome: 'Maranhão — Res. 1.020/2025',
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

const mockAluno: Aluno = {
  id: 'aluno_teste',
  organizacao_id: 'org_default',
  instrutor_id: 'inst_default',
  nome: 'Rodrigo Lima',
  telefone: '98991234567',
  categoria_pretendida: 'B',
  tipo_cambio: 'manual',
  consentimento_lgpd: 1,
  consentimento_em: '2026-11-18T20:00:00.000Z',
  created_at: '2026-11-18T20:00:00.000Z',
  updated_at: '2026-11-18T20:00:00.000Z',
  deleted_at: null,
};

const mockSimulado: SimuladoDb = {
  id: 'sim_pdf_1',
  organizacao_id: 'org_default',
  instrutor_id: 'inst_default',
  aluno_id: 'aluno_teste',
  perfil_regra_id: 'perfil_ma_2026',
  categoria: 'B',
  tipo_cambio: 'manual',
  status: 'APROVADO',
  pontos_totais: 5,
  nota_final: 5,
  contador_incapacidade_tecnica: 0,
  motivo_encerramento: null,
  observacoes_instrutor: 'Aluno manteve calma e boa distância lateral.',
  iniciado_em: '2026-11-18T20:00:00.000Z',
  finalizado_em: '2026-11-18T20:25:00.000Z',
  updated_at: '2026-11-18T20:25:00.000Z',
  synced_at: null,
};

const mockEventos: SimuladoEvento[] = [
  {
    id: 'evt_1',
    simulado_id: 'sim_pdf_1',
    tipo_evento: 'INFRACAO',
    infracao_id: 'ctb_196',
    natureza_snapshot: 'grave',
    pontos_snapshot: 4,
    descricao_snapshot: 'Deixar de indicar com antecedência mediante seta',
    submotivo: 'Art. 196',
    timestamp_evento: '2026-11-18T20:05:00.000Z',
    desfeito: 0,
  },
  {
    id: 'evt_2',
    simulado_id: 'sim_pdf_1',
    tipo_evento: 'INFRACAO',
    infracao_id: 'ctb_169',
    natureza_snapshot: 'leve',
    pontos_snapshot: 1,
    descricao_snapshot: 'Falta leve de atenção',
    submotivo: 'Art. 169',
    timestamp_evento: '2026-11-18T20:10:00.000Z',
    desfeito: 0,
  },
  {
    id: 'evt_desfeito',
    simulado_id: 'sim_pdf_1',
    tipo_evento: 'INFRACAO',
    infracao_id: 'ctb_208',
    natureza_snapshot: 'gravissima',
    pontos_snapshot: 6,
    descricao_snapshot: 'Avançar sinal',
    timestamp_evento: '2026-11-18T20:15:00.000Z',
    desfeito: 1, // Não deve aparecer na tabela
  },
];

describe('Fase 4 — Geração de Relatório PDF e Compartilhamento', () => {
  test('deve gerar template HTML completo em A4 com selo de APROVADO e dados regulamentares', () => {
    const html = gerarHtmlRelatorio({
      simulado: mockSimulado,
      aluno: mockAluno,
      perfil: mockPerfil,
      eventos: mockEventos,
      nomeInstrutor: 'Prof. Carlos Alberto',
    });

    expect(html).toContain('SimulaDetran');
    expect(html).toContain('Rodrigo Lima');
    expect(html).toContain('Prof. Carlos Alberto');
    expect(html).toContain('APROVADO');
    expect(html).toContain('5 / 10 pts');
    expect(html).toContain('Art. 196');
    expect(html).toContain('Art. 169');
    expect(html).not.toContain('Avançar sinal'); // Evento desfeito não deve aparecer
    expect(html).toContain('Aluno manteve calma e boa distância lateral.');
  });

  test('deve renderizar selo REPROVADO quando ultrapassar 10 pontos', () => {
    const simReprovado: SimuladoDb = {
      ...mockSimulado,
      status: 'REPROVADO',
      pontos_totais: 11,
      nota_final: 11,
    };

    const html = gerarHtmlRelatorio({
      simulado: simReprovado,
      aluno: mockAluno,
      perfil: mockPerfil,
      eventos: mockEventos,
    });

    expect(html).toContain('REPROVADO');
    expect(html).toContain('11 / 10 pts');
    expect(html).toContain('#B91C1C'); // Cor vermelha de reprovado
  });

  test('deve invocar expo-print para gerar o arquivo PDF offline e retornar o URI', async () => {
    const uri = await relatorioService.gerarPdf({
      simulado: mockSimulado,
      aluno: mockAluno,
      perfil: mockPerfil,
      eventos: mockEventos,
    });

    expect(Print.printToFileAsync).toHaveBeenCalled();
    expect(uri).toContain('.pdf');
  });

  test('deve invocar expo-sharing para disparar compartilhamento nativo / WhatsApp', async () => {
    const fakeUri = 'file:///cache/simulado.pdf';
    await relatorioService.compartilhar(fakeUri, 'Rodrigo Lima');

    expect(Sharing.isAvailableAsync).toHaveBeenCalled();
    expect(Sharing.shareAsync).toHaveBeenCalledWith(
      fakeUri,
      expect.objectContaining({
        mimeType: 'application/pdf',
      })
    );
  });
});
