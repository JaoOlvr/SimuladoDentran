import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { DadosRelatorioPdf, gerarHtmlRelatorio } from './pdfTemplate';

export class RelatorioService {
  /**
   * Gera o arquivo PDF offline a partir do template HTML profissional A4.
   */
  async gerarPdf(dados: DadosRelatorioPdf): Promise<string> {
    const html = gerarHtmlRelatorio(dados);
    const { uri } = await Print.printToFileAsync({ html });
    return uri;
  }

  /**
   * Abre a bandeja nativa de compartilhamento (WhatsApp, e-mail, etc.).
   */
  async compartilhar(pdfUri: string, tituloAluno: string = 'Aluno'): Promise<void> {
    const disponivel = await Sharing.isAvailableAsync();
    if (!disponivel) {
      throw new Error('O compartilhamento de arquivos não está disponível neste dispositivo.');
    }

    await Sharing.shareAsync(pdfUri, {
      UTI: '.pdf',
      mimeType: 'application/pdf',
      dialogTitle: `Relatório de Simulado — ${tituloAluno}`,
    });
  }
}

export const relatorioService = new RelatorioService();

