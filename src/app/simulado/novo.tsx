import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { alunosRepository } from '../../data/db/repositories/alunosRepository';
import { Aluno } from '../../data/db/schema';
import { BigActionButton } from '../../components/BigActionButton';
import { useSimuladoStore } from '../../features/simulado/simuladoStore';

export default function NovoSimuladoSetupScreen() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [alunoSelecionadoId, setAlunoSelecionadoId] = useState<string | null>(null);
  const [categoria, setCategoria] = useState<'A' | 'B'>('B');
  const [cambio, setCambio] = useState<'manual' | 'automatico'>('manual');
  const [carregandoAlunos, setCarregandoAlunos] = useState(true);
  const [iniciando, setIniciando] = useState(false);

  const iniciarNovoSimulado = useSimuladoStore((s) => s.iniciarNovoSimulado);

  useEffect(() => {
    async function load() {
      try {
        const lista = await alunosRepository.listar();
        setAlunos(lista);
        if (lista.length > 0) {
          setAlunoSelecionadoId(lista[0].id);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setCarregandoAlunos(false);
      }
    }
    load();
  }, []);

  const handleIniciar = async () => {
    setIniciando(true);
    try {
      const simId = await iniciarNovoSimulado({
        alunoId: alunoSelecionadoId || undefined,
        categoria,
        tipoCambio: cambio,
        uf: 'MA',
      });
      router.replace(`/simulado/${simId}`);
    } catch (e) {
      console.error(e);
      Alert.alert('Erro', 'Não foi possível iniciar o simulado.');
      setIniciando(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Preparar Simulado</Text>
        <Text style={styles.subtitle}>
          Configure os dados antes de iniciar o trajeto veicular
        </Text>

        {/* Perfil Estadual */}
        <View style={styles.ruleBanner}>
          <Text style={styles.ruleLabel}>NORMA ATIVA</Text>
          <Text style={styles.ruleName}>Maranhão (MA) — Resolução Contran nº 1.020/2025</Text>
          <Text style={styles.ruleDesc}>Limite de aprovação: 10 pontos • Incapacidade: 2</Text>
        </View>

        {/* Seleção de Aluno */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Aluno Avaliado</Text>
          {carregandoAlunos ? (
            <ActivityIndicator color="#1E40AF" style={{ marginVertical: 12 }} />
          ) : alunos.length === 0 ? (
            <View style={styles.noAlunoCard}>
              <Text style={styles.noAlunoText}>
                Nenhum aluno cadastrado. O simulado será criado como Simulado Rápido.
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/alunos/novo')}
                style={styles.linkButton}
              >
                <Text style={styles.linkText}>+ Cadastrar Aluno Agora</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.alunosList}>
              {alunos.map((a) => (
                <TouchableOpacity
                  key={a.id}
                  style={[
                    styles.alunoChip,
                    alunoSelecionadoId === a.id && styles.alunoChipActive,
                  ]}
                  onPress={() => {
                    setAlunoSelecionadoId(a.id);
                    setCategoria(a.categoria_pretendida as 'A' | 'B');
                    setCambio(a.tipo_cambio as 'manual' | 'automatico');
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.alunoChipText,
                      alunoSelecionadoId === a.id && styles.alunoChipTextActive,
                    ]}
                  >
                    {a.nome}
                  </Text>
                  <Text
                    style={[
                      styles.alunoChipSub,
                      alunoSelecionadoId === a.id && styles.alunoChipSubActive,
                    ]}
                  >
                    Cat. {a.categoria_pretendida} • {a.tipo_cambio}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Categoria */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Categoria do Exame</Text>
          <View style={styles.toggleRow}>
            {(['B', 'A'] as const).map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.toggleButton,
                  categoria === cat && styles.toggleButtonActive,
                ]}
                onPress={() => setCategoria(cat)}
              >
                <Text
                  style={[
                    styles.toggleText,
                    categoria === cat && styles.toggleTextActive,
                  ]}
                >
                  Categoria {cat} {cat === 'B' ? '(Carro)' : '(Moto)'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Câmbio */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Câmbio do Veículo</Text>
          <View style={styles.toggleRow}>
            {(['manual', 'automatico'] as const).map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.toggleButton,
                  cambio === c && styles.toggleButtonActive,
                ]}
                onPress={() => setCambio(c)}
              >
                <Text
                  style={[
                    styles.toggleText,
                    cambio === c && styles.toggleTextActive,
                  ]}
                >
                  {c === 'manual' ? 'Manual' : 'Automático'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Botão de Iniciar */}
        <BigActionButton
          title="INICIAR SIMULADO AGORA"
          variant="primary"
          minHeight={64}
          loading={iniciando}
          onPress={handleIniciar}
          style={{ marginTop: 24, marginBottom: 32 }}
        />
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
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  ruleBanner: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#93C5FD',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  ruleLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1D4ED8',
    letterSpacing: 1,
  },
  ruleName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E3A8A',
    marginTop: 2,
  },
  ruleDesc: {
    fontSize: 12,
    color: '#3B82F6',
    marginTop: 2,
    fontWeight: '600',
  },
  section: {
    marginBottom: 18,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  alunosList: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  alunoChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 10,
    minWidth: 140,
  },
  alunoChipActive: {
    borderColor: '#1E40AF',
    backgroundColor: '#DBEAFE',
  },
  alunoChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  alunoChipTextActive: {
    color: '#1E40AF',
  },
  alunoChipSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  alunoChipSubActive: {
    color: '#1D4ED8',
    fontWeight: '600',
  },
  noAlunoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  noAlunoText: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 8,
  },
  linkButton: {
    alignSelf: 'flex-start',
  },
  linkText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E40AF',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#1E40AF',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
});

