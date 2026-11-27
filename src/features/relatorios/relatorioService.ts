import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Linking } from 'react-native';
import { DadosRelatorioPdf, gerarHtmlRelatorio } from './pdfTemplate';

export interface DadosMensagemWhatsApp {
  alunoNome: string;
  categoria: string;
  tipoCambio: string;
  status: string;
  pontosTotais: number;
  limiteAprovacao: number;
  motivoEncerramento?: string | null;
  dataHora?: string;
  infracoes?: Array<{
    descricao: string;
    pontos: number;
    submotivo?: string;
  }>;
  observacoes?: string;
}

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
   * Formata número de telefone para o padrão internacional do WhatsApp.
   * Adiciona código do país 55 se o número tiver 10 ou 11 dígitos.
   */
  formatarTelefoneWhatsApp(telefone?: string | null): string {
    if (!telefone) return '';
    const limpo = telefone.replace(/\D/g, '');
    if (!limpo) return '';
    if (limpo.length === 10 || limpo.length === 11) {
      return `55${limpo}`;
    }
    return limpo;
  }

  /**
   * Gera texto formatado com formatação nativa do WhatsApp (*negrito*, emojis e tópicos).
   */
  gerarMensagemWhatsApp(dados: DadosMensagemWhatsApp): string {
    const emojiStatus =
      dados.status === 'APROVADO'
        ? '✅'
        : dados.status === 'REPROVADO'
        ? '❌'
        : dados.status === 'ELIMINADO'
        ? '🚫'
        : '⚠️';

    let txt = `🚗 *SIMULADETRAN — RELATÓRIO DO SIMULADO*\n\n`;
    txt += `👤 *Aluno(a):* ${dados.alunoNome}\n`;
    txt += `🎯 *Categoria:* ${dados.categoria} (${dados.tipoCambio})\n`;
    if (dados.dataHora) {
      txt += `📅 *Data/Hora:* ${dados.dataHora}\n`;
    }
    txt += `\n📊 *RESULTADO:* ${emojiStatus} *${dados.status}*\n`;
    txt += `📈 *Pontuação:* ${dados.pontosTotais} de até ${dados.limiteAprovacao} pontos\n`;

    if (dados.motivoEncerramento) {
      txt += `ℹ️ *Motivo:* ${dados.motivoEncerramento}\n`;
    }

    if (dados.infracoes && dados.infracoes.length > 0) {
      txt += `\n⚠️ *Faltas Registradas (${dados.infracoes.length}):*\n`;
      dados.infracoes.forEach((inf, idx) => {
        const pts = inf.pontos > 0 ? `+${inf.pontos} pts` : 'Especial';
        txt += `${idx + 1}. ${inf.descricao} (${pts})\n`;
        if (inf.submotivo) {
          txt += `   └ _${inf.submotivo}_\n`;
        }
      });
    } else {
      txt += `\n✨ *Percurso perfeito sem infrações registradas!*\n`;
    }

    if (dados.observacoes && dados.observacoes.trim().length > 0) {
      txt += `\n📝 *Orientações do Instrutor:*\n"${dados.observacoes.trim()}"\n`;
    }

    txt += `\n📄 _Relatório técnico oficial emitido pelo aplicativo SimulaDetran._`;
    return txt;
  }

  /**
   * Abre o WhatsApp com a mensagem pré-carregada para o contato do aluno.
   */
  async abrirWhatsAppComTexto(
    telefone: string | null | undefined,
    texto: string
  ): Promise<boolean> {
    const foneFormatado = this.formatarTelefoneWhatsApp(telefone);
    const textoCodificado = encodeURIComponent(texto);

    // Tenta URL scheme direto
    const urlApp = foneFormatado
      ? `whatsapp://send?phone=${foneFormatado}&text=${textoCodificado}`
      : `whatsapp://send?text=${textoCodificado}`;

    const urlWeb = foneFormatado
      ? `https://wa.me/${foneFormatado}?text=${textoCodificado}`
      : `https://wa.me/?text=${textoCodificado}`;

    try {
      const podeAbrirApp = await Linking.canOpenURL(urlApp);
      if (podeAbrirApp) {
        await Linking.openURL(urlApp);
        return true;
      }
    } catch {
      // Ignora erro e tenta web
    }

    try {
      await Linking.openURL(urlWeb);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Abre a bandeja nativa de compartilhamento de arquivo PDF (WhatsApp, e-mail, etc.).
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
