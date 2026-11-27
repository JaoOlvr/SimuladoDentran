import { compararVersoes } from '../updateService';
import { relatorioService } from '../../relatorios/relatorioService';

describe('UpdateService - Comparação de Versões', () => {
  it('identifica corretamente quando a versão remota é maior', () => {
    expect(compararVersoes('1.0.6', '1.0.5')).toBe(1);
    expect(compararVersoes('v1.0.6', '1.0.5')).toBe(1);
    expect(compararVersoes('1.1.0', '1.0.9')).toBe(1);
    expect(compararVersoes('2.0.0', '1.9.9')).toBe(1);
  });

  it('identifica versões iguais', () => {
    expect(compararVersoes('1.0.6', '1.0.6')).toBe(0);
    expect(compararVersoes('v1.0.6', '1.0.6')).toBe(0);
  });

  it('identifica quando a versão remota é menor', () => {
    expect(compararVersoes('1.0.5', '1.0.6')).toBe(-1);
    expect(compararVersoes('1.0.4', '1.0.5')).toBe(-1);
  });
});

describe('RelatorioService - WhatsApp Formatter', () => {
  it('formata o número de telefone com DDI 55', () => {
    expect(relatorioService.formatarTelefoneWhatsApp('98988776655')).toBe('5598988776655');
    expect(relatorioService.formatarTelefoneWhatsApp('(98) 98877-6655')).toBe('5598988776655');
    expect(relatorioService.formatarTelefoneWhatsApp('5598988776655')).toBe('5598988776655');
  });

  it('gera mensagem completa com emojis e formatação', () => {
    const msg = relatorioService.gerarMensagemWhatsApp({
      alunoNome: 'Carlos Eduardo',
      categoria: 'B',
      tipoCambio: 'manual',
      status: 'APROVADO',
      pontosTotais: 4,
      limiteAprovacao: 10,
      dataHora: '27/11/2026 10:00',
      infracoes: [
        { descricao: 'Deixar de indicar com antecedência', pontos: 4 },
      ],
      observacoes: 'Excelente controle de embreagem.',
    });

    expect(msg).toContain('SIMULADETRAN');
    expect(msg).toContain('Carlos Eduardo');
    expect(msg).toContain('✅ *APROVADO*');
    expect(msg).toContain('4 de até 10 pontos');
    expect(msg).toContain('Excelente controle de embreagem.');
  });
});
