import { SimuladoDb, SimuladoEventoDb } from '../../data/db/schema';

export interface TopErroItem {
  infracao_id: string;
  artigo_ctb: string;
  descricao: string;
  total_ocorrencias: number;
  pontos_unitarios: number;
}

export interface HistoricoPontoItem {
  simuladoId: string;
  data: string;
  pontos: number;
  status: string;
}

export interface EvolucaoAlunoResultado {
  totalSimulados: number;
  totalAprovados: number;
  totalReprovados: number;
  taxaAprovacao: number; // Porcentagem de 0 a 100
  mediaPontos: number;
  historicoPontos: HistoricoPontoItem[];
  topErros: TopErroItem[];
}

export function calcularEvolucaoAluno(
  simulados: SimuladoDb[],
  todosEventos: SimuladoEventoDb[]
): EvolucaoAlunoResultado {
  if (simulados.length === 0) {
    return {
      totalSimulados: 0,
      totalAprovados: 0,
      totalReprovados: 0,
      taxaAprovacao: 0,
      mediaPontos: 0,
      historicoPontos: [],
      topErros: [],
    };
  }

  const totalSimulados = simulados.length;
  const totalAprovados = simulados.filter((s) => s.status === 'APROVADO').length;
  const totalReprovados = simulados.filter((s) => s.status === 'REPROVADO').length;
  const taxaAprovacao = Math.round((totalAprovados / totalSimulados) * 100);

  const somaPontos = simulados.reduce((acc, s) => acc + (s.pontos_totais || 0), 0);
  const mediaPontos = Number((somaPontos / totalSimulados).toFixed(1));

  // Ordena simulados do mais antigo para o mais recente para ver a tendência
  const simuladosCronologicos = [...simulados].sort(
    (a, b) => new Date(a.iniciado_em).getTime() - new Date(b.iniciado_em).getTime()
  );

  const historicoPontos: HistoricoPontoItem[] = simuladosCronologicos.map((s) => ({
    simuladoId: s.id,
    data: new Date(s.iniciado_em).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    }),
    pontos: s.pontos_totais,
    status: s.status,
  }));

  // Agrupamento de infrações ativas para encontrar o Top 3
  const eventosAtivos = todosEventos.filter((e) => !e.desfeito && e.tipo_evento === 'INFRACAO');
  const contadorErros = new Map<string, { desc: string; count: number; sub: string; pontos: number }>();

  eventosAtivos.forEach((e) => {
    const chave = e.infracao_id || e.descricao_snapshot;
    const atual = contadorErros.get(chave);
    if (atual) {
      atual.count++;
    } else {
      contadorErros.set(chave, {
        desc: e.descricao_snapshot,
        count: 1,
        sub: e.submotivo || 'CTB',
        pontos: e.pontos_snapshot,
      });
    }
  });

  const topErros: TopErroItem[] = Array.from(contadorErros.entries())
    .map(([id, info]) => ({
      infracao_id: id,
      artigo_ctb: info.sub,
      descricao: info.desc,
      total_ocorrencias: info.count,
      pontos_unitarios: info.pontos,
    }))
    .sort((a, b) => b.total_ocorrencias - a.total_ocorrencias)
    .slice(0, 3);

  return {
    totalSimulados,
    totalAprovados,
    totalReprovados,
    taxaAprovacao,
    mediaPontos,
    historicoPontos,
    topErros,
  };
}

