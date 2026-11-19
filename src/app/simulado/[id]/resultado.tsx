import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSimuladoStore } from '../../../features/simulado/simuladoStore';
import { BigActionButton } from '../../../components/BigActionButton';

export default function ResultadoSimuladoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const {
    simuladoAtual,
    alunoAtual,
    estadoCalculado,
    eventos,
    carregando,
    carregarSimulado,
    finalizarSimulado,
  } = useSimuladoStore();

  const [observacoes, setObservacoes] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (id && (!simuladoAtual || simuladoAtual.id !== id)) {
      carregarSimulado(id);
    }
  }, [id, simuladoAtual, carregarSimulado]);

  useEffect(() => {
    if (simuladoAtual?.observacoes_instrutor) {
      setObservacoes(simuladoAtual.observacoes_instrutor);
    }
  }, [simuladoAtual]);

  const handleSalvarObservacoes = async () => {
    setSalvando(true);
    try {
      await finalizarSimulado(observacoes);
      Alert.alert('Salvo', 'Observações registradas com sucesso!');
    } catch (e) {
      console.error(e);
      Alert.alert('Erro', 'Não foi possível salvar as observações.');
    } finally {
      setSalvando(false);
    }
  };

  if (carregando || !simuladoAtual) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1E40AF" />
      </View>
    );
  }

  const { status, pontos_totais, limite_aprovacao, motivo_encerramento } =
    estadoCalculado;

  const getStatusDisplay = () => {
    switch (status) {
      case 'APROVADO':
        return {
          title: 'APROVADO',
          sub: 'Candidato dentro do limite regulamentar de até 10 pontos.',
          bg: '#047857',
          color: '#FFFFFF',
          badgeText: `${pontos_totais} / ${limite_aprovacao} pontos`,
        };
      case 'REPROVADO':
        return {
          title: 'REPROVADO',
          sub: 'Limite regulamentar de 10 pontos ultrapassado.',
          bg: '#B91C1C',
          color: '#FFFFFF',
          badgeText: `${pontos_totais} / ${limite_aprovacao} pontos`,
        };
      case 'ELIMINADO':
        return {
          title: 'ELIMINADO',
          sub: motivo_encerramento || 'Eliminação disciplinar ou conduta vedada.',
          bg: '#881337',
          color: '#FFFFFF',
          badgeText: 'Falta Eliminatória',
        };
      case 'NAO_CONCLUIDO':
        return {
          title: 'NÃO CONCLUÍDO',
          sub: motivo_encerramento || 'Simulado interrompido conforme Art. 46.',
          bg: '#B45309',
          color: '#FFFFFF',
          badgeText: 'Exame Interrompido',
        };
      default:
        return {
          title: status,
          sub: '',
          bg: '#1E40AF',
          color: '#FFFFFF',
          badgeText: `${pontos_totais} pts`,
        };
    }
  };

  const statusDisplay = getStatusDisplay();
  const eventosAtivos = eventos.filter((e) => !e.desfeito);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Banner do Resultado Final */}
        <View style={[styles.resultBanner, { backgroundColor: statusDisplay.bg }]}>
          <Text style={styles.resultTitle}>{statusDisplay.title}</Text>
          <Text style={styles.resultBadge}>{statusDisplay.badgeText}</Text>
          <Text style={styles.resultSub}>{statusDisplay.sub}</Text>
        </View>

        {/* Identificação do Aluno */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dados da Avaliação</Text>
          <Text style={styles.cardRow}>
            <Text style={styles.bold}>Aluno: </Text>
            {alunoAtual ? alunoAtual.nome : 'Simulado Rápido'}
          </Text>
          <Text style={styles.cardRow}>
            <Text style={styles.bold}>Categoria: </Text>
            {simuladoAtual.categoria} ({simuladoAtual.tipo_cambio})
          </Text>
          <Text style={styles.cardRow}>
            <Text style={styles.bold}>Norma: </Text>
            Resolução Contran nº 1.020/2025 (Padrão MA)
          </Text>
        </View>

        {/* Ocorrências e Infrações Registradas */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Infrações Registradas ({eventosAtivos.length})
          </Text>
          {eventosAtivos.length === 0 ? (
            <Text style={styles.emptyText}>
              Nenhuma infração registrada. Percurso sem faltas!
            </Text>
          ) : (
            eventosAtivos.map((ev, index) => (
              <View key={ev.id} style={styles.infracaoItem}>
                <View style={styles.infracaoItemHeader}>
                  <Text style={styles.infracaoNumero}>#{index + 1}</Text>
                  <Text style={styles.infracaoPontos}>
                    {ev.pontos_snapshot > 0 ? `+${ev.pontos_snapshot} pts` : 'Especial'}
                  </Text>
                </View>
                <Text style={styles.infracaoDesc}>{ev.descricao_snapshot}</Text>
                {ev.submotivo && (
                  <Text style={styles.infracaoSub}>{ev.submotivo}</Text>
                )}
              </View>
            ))
          )}
        </View>

        {/* Observações Pedagógicas do Instrutor */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Observações Pedagógicas do Instrutor</Text>
          <Text style={styles.cardDesc}>
            Registre orientações e pontos de atenção com o veículo parado:
          </Text>
          <TextInput
            style={styles.textArea}
            placeholder="Ex.: Aluno demonstrou bom domínio de marcha, mas deve antecipar o uso da seta nas conversões à direita..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={4}
            value={observacoes}
            onChangeText={setObservacoes}
          />
          <BigActionButton
            title="Salvar Observações"
            variant="outline"
            minHeight={46}
            loading={salvando}
            onPress={handleSalvarObservacoes}
            style={{ marginTop: 10 }}
          />
        </View>

        {/* Botões de Ação */}
        <View style={styles.actionButtons}>
          <BigActionButton
            title="Compartilhar Relatório (Fase 4)"
            variant="success"
            minHeight={58}
            onPress={() => {
              Alert.alert(
                'Relatório e PDF (Fase 4)',
                'A geração de PDF e compartilhamento direto no WhatsApp será ativada na Fase 4.'
              );
            }}
            style={{ marginBottom: 12 }}
          />

          <BigActionButton
            title="Voltar ao Início"
            variant="primary"
            minHeight={58}
            onPress={() => router.replace('/')}
          />
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
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultBanner: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  resultBadge: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 6,
    marginBottom: 8,
  },
  resultSub: {
    fontSize: 13,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 18,
    opacity: 0.95,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
  },
  cardRow: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 4,
  },
  bold: {
    fontWeight: '700',
    color: '#0F172A',
  },
  infracaoItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#1E40AF',
  },
  infracaoItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  infracaoNumero: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
  },
  infracaoPontos: {
    fontSize: 13,
    fontWeight: '800',
    color: '#B91C1C',
  },
  infracaoDesc: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    lineHeight: 18,
  },
  infracaoSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  emptyText: {
    fontSize: 13,
    color: '#15803D',
    fontWeight: '600',
    paddingVertical: 8,
  },
  textArea: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#0F172A',
    textAlignVertical: 'top',
    minHeight: 90,
  },
  actionButtons: {
    marginTop: 10,
    marginBottom: 30,
  },
});
