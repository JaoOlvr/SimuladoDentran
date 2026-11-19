import { Aluno, SimuladoDb } from '../../data/db/schema';
import { SimuladoEvento } from '../../core/scoring/types';
import { RegraPerfil } from '../../core/rules/types';

export interface DadosRelatorioPdf {
  simulado: SimuladoDb;
  aluno?: Aluno | null;
  perfil: RegraPerfil;
  eventos: SimuladoEvento[];
  nomeInstrutor?: string;
  contatoInstrutor?: string;
}

export function gerarHtmlRelatorio({
  simulado,
  aluno,
  perfil,
  eventos,
  nomeInstrutor = 'Instrutor Credenciado',
  contatoInstrutor = '',
}: DadosRelatorioPdf): string {
  const eventosAtivos = eventos.filter((e) => !e.desfeito);

  // Contagem por gravidade
  const contagem = {
    leve: 0,
    media: 0,
    grave: 0,
    gravissima: 0,
  };

  eventosAtivos.forEach((e) => {
    if (e.natureza_snapshot && e.natureza_snapshot in contagem) {
      contagem[e.natureza_snapshot as keyof typeof contagem]++;
    }
  });

  const dataFormatada = new Date(simulado.iniciado_em).toLocaleDateString('pt-BR');
  const horaFormatada = new Date(simulado.iniciado_em).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Cores do Selo de Resultado
  let statusBg = '#047857'; // Verde
  let statusTexto = 'APROVADO';
  let statusDesc = `Pontuação obtida dentro do limite regulamentar de até ${perfil.limite_aprovacao} pontos.`;

  if (simulado.status === 'REPROVADO') {
    statusBg = '#B91C1C'; // Vermelho
    statusTexto = 'REPROVADO';
    statusDesc = `Limite regulamentar de ${perfil.limite_aprovacao} pontos ultrapassado.`;
  } else if (simulado.status === 'ELIMINADO') {
    statusBg = '#881337'; // Vinho
    statusTexto = 'ELIMINADO';
    statusDesc = simulado.motivo_encerramento || 'Falta eliminatória tipificada na norma.';
  } else if (simulado.status === 'NAO_CONCLUIDO') {
    statusBg = '#B45309'; // Âmbar
    statusTexto = 'NÃO CONCLUÍDO';
    statusDesc = simulado.motivo_encerramento || 'Simulado interrompido conforme Art. 46.';
  }

  const linhasTabela = eventosAtivos.length === 0
    ? `<tr><td colspan="5" style="text-align: center; padding: 18px; color: #047857; font-weight: bold;">Nenhuma infração cometida. Percurso perfeito com 0 pontos perdidos!</td></tr>`
    : eventosAtivos
        .map(
          (e, idx) => `
        <tr style="border-bottom: 1px solid #E2E8F0;">
          <td style="padding: 10px 8px; font-weight: bold; color: #64748B;">#${idx + 1}</td>
          <td style="padding: 10px 8px; font-weight: bold; color: #1E40AF;">${e.submotivo || 'CTB'}</td>
          <td style="padding: 10px 8px; color: #0F172A;">${e.descricao_snapshot}</td>
          <td style="padding: 10px 8px; text-transform: capitalize; color: #475569;">${e.natureza_snapshot || 'Falta'}</td>
          <td style="padding: 10px 8px; text-align: right; font-weight: bold; color: #B91C1C;">+${e.pontos_snapshot} pts</td>
        </tr>
      `
        )
        .join('');

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <style>
    @page { size: A4; margin: 15mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0F172A;
      margin: 0;
      padding: 0;
      background: #FFFFFF;
      font-size: 13px;
      line-height: 1.4;
    }
    .header {
      border-bottom: 3px solid #1E40AF;
      padding-bottom: 12px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 900;
      color: #1E40AF;
      letter-spacing: -0.5px;
      margin: 0;
    }
    .brand-sub {
      font-size: 12px;
      color: #64748B;
      font-weight: 600;
      margin-top: 2px;
    }
    .instrutor-info {
      text-align: right;
      font-size: 12px;
      color: #334155;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 14px;
      margin-bottom: 16px;
    }
    .info-item {
      margin-bottom: 4px;
    }
    .info-label {
      font-size: 11px;
      font-weight: bold;
      color: #64748B;
      text-transform: uppercase;
    }
    .info-value {
      font-size: 14px;
      font-weight: 700;
      color: #0F172A;
    }
    .status-banner {
      background: ${statusBg};
      color: #FFFFFF;
      border-radius: 10px;
      padding: 16px;
      text-align: center;
      margin-bottom: 16px;
    }
    .status-title {
      font-size: 28px;
      font-weight: 900;
      letter-spacing: 1px;
      margin: 0;
    }
    .status-score {
      font-size: 18px;
      font-weight: 800;
      margin: 4px 0 6px 0;
      background: rgba(255, 255, 255, 0.2);
      display: inline-block;
      padding: 4px 16px;
      border-radius: 6px;
    }
    .status-desc {
      font-size: 12px;
      opacity: 0.95;
      margin: 0;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 16px;
    }
    .summary-box {
      border: 1px solid #CBD5E1;
      border-radius: 6px;
      padding: 8px;
      text-align: center;
      background: #FFFFFF;
    }
    .summary-box-title {
      font-size: 11px;
      font-weight: bold;
      color: #64748B;
      text-transform: uppercase;
    }
    .summary-box-count {
      font-size: 18px;
      font-weight: 900;
      color: #0F172A;
      margin-top: 2px;
    }
    .table-container {
      margin-bottom: 16px;
    }
    .table-title {
      font-size: 14px;
      font-weight: 800;
      color: #0F172A;
      margin-bottom: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    th {
      background: #F1F5F9;
      color: #475569;
      font-weight: 800;
      text-transform: uppercase;
      font-size: 10px;
      padding: 8px;
      text-align: left;
      border-bottom: 2px solid #CBD5E1;
    }
    .obs-box {
      background: #FFFBEB;
      border: 1px solid #FDE68A;
      border-left: 4px solid #F59E0B;
      border-radius: 6px;
      padding: 12px;
      margin-bottom: 16px;
    }
    .obs-title {
      font-size: 12px;
      font-weight: 800;
      color: #92400E;
      margin-bottom: 4px;
    }
    .obs-content {
      font-size: 12px;
      color: #78350F;
      white-space: pre-wrap;
    }
    .footer {
      border-top: 1px solid #E2E8F0;
      padding-top: 10px;
      text-align: center;
      font-size: 10px;
      color: #94A3B8;
    }
  </style>
</head>
<body>

  <div class="header">
    <div>
      <h1 class="brand-title">SimulaDetran</h1>
      <div class="brand-sub">Relatório de Simulado Prático Veicular</div>
    </div>
    <div class="instrutor-info">
      <strong>${nomeInstrutor}</strong><br>
      ${contatoInstrutor ? `${contatoInstrutor}<br>` : ''}
      Data: ${dataFormatada} às ${horaFormatada}
    </div>
  </div>

  <div class="info-grid">
    <div>
      <div class="info-label">Candidato / Aluno</div>
      <div class="info-value">${aluno ? aluno.nome : 'Simulado Rápido Avulso'}</div>
      ${aluno?.telefone ? `<div style="font-size: 12px; color: #0284C7; margin-top: 2px;">WhatsApp: ${aluno.telefone}</div>` : ''}
    </div>
    <div>
      <div class="info-label">Exame / Parâmetros</div>
      <div class="info-value">Categoria ${simulado.categoria} • Câmbio ${simulado.tipo_cambio}</div>
      <div style="font-size: 11px; color: #64748B; margin-top: 2px;">Norma: Res. 1.020/2025 (${perfil.uf})</div>
    </div>
  </div>

  <div class="status-banner">
    <div class="status-title">${statusTexto}</div>
    <div class="status-score">Total de Pontos: ${simulado.pontos_totais} / ${perfil.limite_aprovacao} pts</div>
    <div class="status-desc">${statusDesc}</div>
  </div>

  <div class="summary-grid">
    <div class="summary-box">
      <div class="summary-box-title">Leves (1 pt)</div>
      <div class="summary-box-count">${contagem.leve}</div>
    </div>
    <div class="summary-box">
      <div class="summary-box-title">Médias (2 pts)</div>
      <div class="summary-box-count">${contagem.media}</div>
    </div>
    <div class="summary-box">
      <div class="summary-box-title">Graves (4 pts)</div>
      <div class="summary-box-count">${contagem.grave}</div>
    </div>
    <div class="summary-box">
      <div class="summary-box-title">Gravíssimas (6 pts)</div>
      <div class="summary-box-count">${contagem.gravissima}</div>
    </div>
  </div>

  <div class="table-container">
    <div class="table-title">Detalhamento das Ocorrências e Infrações Registradas</div>
    <table>
      <thead>
        <tr>
          <th style="width: 30px;">#</th>
          <th style="width: 90px;">Artigo CTB</th>
          <th>Descrição da Infração</th>
          <th style="width: 80px;">Natureza</th>
          <th style="width: 60px; text-align: right;">Pontos</th>
        </tr>
      </thead>
      <tbody>
        ${linhasTabela}
      </tbody>
    </table>
  </div>

  ${
    simulado.observacoes_instrutor
      ? `
    <div class="obs-box">
      <div class="obs-title">Observações Pedagógicas do Instrutor</div>
      <div class="obs-content">${simulado.observacoes_instrutor}</div>
    </div>
  `
      : ''
  }

  <div class="footer">
    Simulado pedagógico realizado conforme a Resolução Contran nº 1.020/2025 e o Manual Brasileiro de Exames de Direção Veicular (MBEDV 2026).<br>
    Este relatório possui fins exclusivamente didáticos e preparatórios.
  </div>

</body>
</html>
  `.trim();
}

