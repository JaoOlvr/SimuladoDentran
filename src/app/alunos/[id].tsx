import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { alunosRepository } from '../../data/db/repositories/alunosRepository';
import { simuladosRepository } from '../../data/db/repositories/simuladosRepository';
import { Aluno, SimuladoDb } from '../../data/db/schema';
import { BigActionButton } from '../../components/BigActionButton';
import { useSimuladoStore } from '../../features/simulado/simuladoStore';

export default function AlunoDetalhesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [simulados, setSimulados] = useState<SimuladoDb[]>([]);
  const [carregando, setCarregando] = useState(true);

  const iniciarNovoSimulado = useSimuladoStore((s) => s.iniciarNovoSimulado);

  const carregarDados = useCallback(async () => {
    if (!id) return;
    setCarregando(true);
    try {
      const a = await alunosRepository.buscarPorId(id);
      if (a) {
        setAluno(a);
        const sims = await simuladosRepository.listarPorAluno(id);
        setSimulados(sims);
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

  const handleIniciarSimulado = async () => {
    if (!aluno) return;
    try {
      const simId = await iniciarNovoSimulado({
        alunoId: aluno.id,
        categoria: aluno.categoria_pretendida as 'A' | 'B',
        tipoCambio: aluno.tipo_cambio as 'manual' | 'automatico',
        uf: 'MA',
      });
      router.push(`/simulado/${simId}`);
    } catch (e) {
      console.error(e);
      Alert.alert('Erro', 'Não foi possível iniciar o simulado.');
    }
  };

  const handleExcluirLGPD = () => {
    Alert.alert(
      'Exclusão Definitiva (LGPD)',
      'Esta ação apagará permanentemente o cadastro do aluno e todo o seu histórico de simulados e infrações. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sim, Excluir Definitivamente',
          style: 'destructive',
          onPress: async () => {
            if (!id) return;
            try {
              await alunosRepository.excluirDefinitivoLGPD(id);
              Alert.alert('Sucesso', 'Todos os dados foram eliminados definitivamente.', [
                { text: 'OK', onPress: () => router.replace('/alunos') },
              ]);
            } catch (e) {
              console.error(e);
              Alert.alert('Erro', 'Falha ao excluir os dados.');
            }
          },
        },
      ]
    );
  };

  if (carregando) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1E40AF" />
      </View>
    );
  }

  if (!aluno) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.notFoundText}>Aluno não encontrado.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Card do Aluno */}
        <View style={styles.profileCard}>
          <Text style={styles.nome}>{aluno.nome}</Text>
          <Text style={styles.subtitle}>
            Categoria {aluno.categoria_pretendida} • Câmbio {aluno.tipo_cambio}
          </Text>
          {aluno.telefone && (
            <Text style={styles.telefoneText}>WhatsApp: {aluno.telefone}</Text>
          )}
          <View style={styles.lgpdBadge}>
            <Text style={styles.lgpdBadgeText}>✓ Consentimento LGPD Registrado</Text>
          </View>
        </View>

        {/* Botão de Ação Imediata */}
        <BigActionButton
          title="INICIAR SIMULADO COM ESTE ALUNO"
          variant="primary"
          minHeight={60}
          onPress={handleIniciarSimulado}
          style={{ marginBottom: 12 }}
        />

        <BigActionButton
          title="📊 Ver Evolução e Top 3 Erros"
          variant="secondary"
          minHeight={52}
          onPress={() => router.push(`/alunos/${aluno.id}/evolucao`)}
          style={{ marginBottom: 24 }}
        />

        {/* Histórico de Simulados */}
        <Text style={styles.sectionTitle}>Histórico de Simulados</Text>
        {simulados.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              Nenhum simulado realizado ainda para este aluno.
            </Text>
          </View>
        ) : (
          simulados.map((sim) => (
            <TouchableOpacity
              key={sim.id}
              style={styles.simCard}
              onPress={() => router.push(`/simulado/${sim.id}/resultado`)}
              activeOpacity={0.7}
            >
              <View style={styles.simHeader}>
                <Text style={styles.simData}>
                  {new Date(sim.iniciado_em).toLocaleDateString('pt-BR')} às{' '}
                  {new Date(sim.iniciado_em).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    sim.status === 'APROVADO'
                      ? styles.badgeAprovado
                      : sim.status === 'REPROVADO'
                      ? styles.badgeReprovado
                      : styles.badgeAlerta,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      sim.status === 'APROVADO'
                        ? { color: '#15803D' }
                        : sim.status === 'REPROVADO'
                        ? { color: '#B91C1C' }
                        : { color: '#B45309' },
                    ]}
                  >
                    {sim.status}
                  </Text>
                </View>
              </View>

              <Text style={styles.simScore}>
                Pontuação: <Text style={{ fontWeight: '800' }}>{sim.pontos_totais} pts</Text>
                {sim.nota_final !== null && ` • Nota Final: ${sim.nota_final}`}
              </Text>
            </TouchableOpacity>
          ))
        )}

        {/* Botão LGPD de Exclusão Definitiva */}
        <View style={styles.lgpdSection}>
          <BigActionButton
            title="Excluir Todos os Dados do Aluno (LGPD)"
            variant="danger"
            minHeight={50}
            onPress={handleExcluirLGPD}
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    fontSize: 16,
    color: '#64748B',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  nome: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
    marginBottom: 6,
  },
  telefoneText: {
    fontSize: 14,
    color: '#0284C7',
    fontWeight: '700',
    marginBottom: 8,
  },
  lgpdBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  lgpdBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyText: {
    fontSize: 13,
    color: '#64748B',
  },
  simCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  simHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  simData: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeAprovado: {
    backgroundColor: '#DCFCE7',
  },
  badgeReprovado: {
    backgroundColor: '#FEE2E2',
  },
  badgeAlerta: {
    backgroundColor: '#FEF3C7',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  simScore: {
    fontSize: 14,
    color: '#1E293B',
  },
  lgpdSection: {
    marginTop: 32,
    marginBottom: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
});

