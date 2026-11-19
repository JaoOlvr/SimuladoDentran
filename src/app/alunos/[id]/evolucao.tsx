import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { alunosRepository } from '../../../data/db/repositories/alunosRepository';
import { simuladosRepository } from '../../../data/db/repositories/simuladosRepository';
import { eventosRepository } from '../../../data/db/repositories/eventosRepository';
import { Aluno, SimuladoDb, SimuladoEventoDb } from '../../../data/db/schema';
import {
  calcularEvolucaoAluno,
  EvolucaoAlunoResultado,
} from '../../../features/alunos/evolucaoService';
import { BigActionButton } from '../../../components/BigActionButton';
import { relatorioService } from '../../../features/relatorios/relatorioService';
import { getPerfilPorUf } from '../../../core/rules/loader';

export default function AlunoEvolucaoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [evolucao, setEvolucao] = useState<EvolucaoAlunoResultado | null>(null);
  const [simulados, setSimulados] = useState<SimuladoDb[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [gerandoPdfId, setGerandoPdfId] = useState<string | null>(null);

  const carregarDados = useCallback(async () => {
    if (!id) return;
    setCarregando(true);
    try {
      const a = await alunosRepository.buscarPorId(id);
      if (a) {
        setAluno(a);
        const sims = await simuladosRepository.listarPorAluno(id);
        setSimulados(sims);

        // Carrega todos os eventos dos simulados para calcular Top Erros
        const todosEventos: SimuladoEventoDb[] = [];
        for (const s of sims) {
          const evts = await eventosRepository.listarPorSimulado(s.id, true);
          todosEventos.push(...evts);
        }

        const resEvolucao = calcularEvolucaoAluno(sims, todosEventos);
        setEvolucao(resEvolucao);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCarregando(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [carregarDados])
  );

  const handleCompartilharSimulado = async (sim: SimuladoDb) => {
    setGerandoPdfId(sim.id);
    try {
      const eventosDb = await eventosRepository.listarPorSimulado(sim.id);
      const perfil = getPerfilPorUf('MA');

      const uri = await relatorioService.gerarPdf({
        simulado: sim,
        aluno,
        perfil,
        eventos: eventosDb.map((e) => ({
          id: e.id,
          simulado_id: e.simulado_id,
          tipo_evento: e.tipo_evento,
          infracao_id: e.infracao_id || undefined,
          natureza_snapshot: e.natureza_snapshot as any,
          pontos_snapshot: e.pontos_snapshot,
          descricao_snapshot: e.descricao_snapshot,
          submotivo: e.submotivo || undefined,
          timestamp_evento: e.timestamp_evento,
          desfeito: e.desfeito,
        })),
        nomeInstrutor: 'Instrutor Detran-MA',
      });

      await relatorioService.compartilhar(uri, aluno?.nome || 'Aluno');
    } catch (e) {
      console.error(e);
      Alert.alert('Erro', 'Não foi possível gerar ou compartilhar o relatório.');
    } finally {
      setGerandoPdfId(null);
    }
  };

  if (carregando) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1E40AF" />
      </View>
    );
  }

  if (!aluno || !evolucao) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Aluno não encontrado.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Cabeçalho */}
        <View style={styles.headerCard}>
          <Text style={styles.alunoNome}>{aluno.nome}</Text>
          <Text style={styles.alunoSub}>
            Evolução Prática • Categoria {aluno.categoria_pretendida} ({aluno.tipo_cambio})
          </Text>
        </View>

        {/* Métricas Principais */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricBox}>
            <Text style={styles.metricVal}>{evolucao.totalSimulados}</Text>
            <Text style={styles.metricLabel}>Simulados</Text>
          </View>
          <View style={styles.metricBox}>
            <Text
              style={[
                styles.metricVal,
                evolucao.taxaAprovacao >= 70 ? { color: '#047857' } : { color: '#B91C1C' },
              ]}
            >
              {evolucao.taxaAprovacao}%
            </Text>
            <Text style={styles.metricLabel}>Aprovação</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricVal}>{evolucao.mediaPontos}</Text>
            <Text style={styles.metricLabel}>Média Pontos</Text>
          </View>
        </View>

        {/* Gráfico Visual de Tendência de Pontos */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tendência de Pontos ao Longo do Tempo</Text>
          <Text style={styles.cardSubtitle}>
            Linha de corte: até 10 pontos aprova (barras menores são melhores)
          </Text>

          {evolucao.historicoPontos.length === 0 ? (
            <Text style={styles.emptyText}>Sem histórico para exibir gráfico.</Text>
          ) : (
            <View style={styles.chartContainer}>
              {evolucao.historicoPontos.map((item, idx) => {
                const maxBarHeight = 120;
                // Escala de altura baseada no valor (max 20 para visual)
                const alturaBarra = Math.min(
                  maxBarHeight,
                  Math.max(16, (item.pontos / 15) * maxBarHeight)
                );
                const aprovado = item.pontos <= 10 && item.status !== 'ELIMINADO' && item.status !== 'NAO_CONCLUIDO';

                return (
                  <View key={item.simuladoId} style={styles.chartCol}>
                    <Text style={styles.chartPointsText}>{item.pontos}p</Text>
                    <View
                      style={[
                        styles.chartBar,
                        {
                          height: alturaBarra,
                          backgroundColor: aprovado ? '#047857' : '#B91C1C',
                        },
                      ]}
                    />
                    <Text style={styles.chartDateText}>{item.data}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Top 3 Erros Mais Recorrentes */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>⚠️ Top 3 Erros Mais Frequentes</Text>
          <Text style={styles.cardSubtitle}>
            Foco pedagógico prioritário para as próximas aulas:
          </Text>

          {evolucao.topErros.length === 0 ? (
            <Text style={styles.emptySuccessText}>
              Nenhum erro registrado até o momento. Excelente condução!
            </Text>
          ) : (
            evolucao.topErros.map((erro, idx) => (
              <View key={erro.infracao_id} style={styles.erroItem}>
                <View style={styles.erroRank}>
                  <Text style={styles.erroRankText}>{idx + 1}º</Text>
                </View>
                <View style={styles.erroContent}>
                  <View style={styles.erroHeader}>
                    <Text style={styles.erroArtigo}>{erro.artigo_ctb}</Text>
                    <Text style={styles.erroCount}>
                      {erro.total_ocorrencias}x cometido{erro.total_ocorrencias > 1 ? 's' : ''}
                    </Text>
                  </View>
                  <Text style={styles.erroDesc}>{erro.descricao}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Lista de Simulados com Botão Compartilhar */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Relatórios dos Simulados Anteriores</Text>
          {simulados.map((sim, index) => (
            <View key={sim.id} style={styles.simRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.simDate}>
                  Simulado #{simulados.length - index} •{' '}
                  {new Date(sim.iniciado_em).toLocaleDateString('pt-BR')}
                </Text>
                <Text
                  style={[
                    styles.simStatus,
                    sim.status === 'APROVADO'
                      ? { color: '#047857' }
                      : sim.status === 'REPROVADO'
                      ? { color: '#B91C1C' }
                      : { color: '#B45309' },
                  ]}
                >
                  {sim.status} ({sim.pontos_totais} pontos)
                </Text>
              </View>

              <TouchableOpacity
                style={styles.shareButton}
                onPress={() => handleCompartilharSimulado(sim)}
                disabled={gerandoPdfId === sim.id}
              >
                {gerandoPdfId === sim.id ? (
                  <ActivityIndicator size="small" color="#1E40AF" />
                ) : (
                  <Text style={styles.shareButtonText}>📄 PDF / WhatsApp</Text>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCard: {
    backgroundColor: '#1E40AF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  alunoNome: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  alunoSub: {
    fontSize: 13,
    color: '#BFDBFE',
    marginTop: 4,
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricVal: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 160,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    marginBottom: 8,
  },
  chartCol: {
    alignItems: 'center',
    width: 40,
  },
  chartPointsText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 4,
  },
  chartBar: {
    width: 24,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  chartDateText: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 6,
    fontWeight: '600',
  },
  erroItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  erroRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#BE123C',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  erroRankText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
  },
  erroContent: {
    flex: 1,
  },
  erroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  erroArtigo: {
    fontSize: 13,
    fontWeight: '800',
    color: '#9F1239',
  },
  erroCount: {
    fontSize: 12,
    fontWeight: '800',
    color: '#BE123C',
  },
  erroDesc: {
    fontSize: 12,
    color: '#4C0519',
    lineHeight: 16,
  },
  emptyText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    paddingVertical: 12,
  },
  emptySuccessText: {
    fontSize: 13,
    color: '#047857',
    fontWeight: '600',
    paddingVertical: 8,
  },
  simRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  simDate: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  simStatus: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  shareButton: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  shareButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E40AF',
  },
});

