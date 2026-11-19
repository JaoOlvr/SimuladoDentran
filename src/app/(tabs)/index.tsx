import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { BigActionButton } from '../../components/BigActionButton';
import { useSimuladoStore } from '../../features/simulado/simuladoStore';

export default function HomeScreen() {
  const iniciarNovoSimulado = useSimuladoStore((s) => s.iniciarNovoSimulado);

  const handleSimuladoRapido = async () => {
    try {
      const id = await iniciarNovoSimulado({
        categoria: 'B',
        tipoCambio: 'manual',
        uf: 'MA',
      });
      router.push(`/simulado/${id}`);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Banner do Perfil Normativo Ativo */}
        <View style={styles.normaBanner}>
          <Text style={styles.normaTag}>PADRÃO VIGENTE</Text>
          <Text style={styles.normaTitle}>Resolução Contran nº 1.020/2025</Text>
          <Text style={styles.normaSub}>
            Maranhão (MA) • Portaria Detran-MA nº 127/2026
          </Text>
          <Text style={styles.normaRules}>
            Limite de aprovação: até 10 pontos • Incapacidade técnica: limite 2
          </Text>
        </View>

        {/* Ações Primárias Ergonômicas */}
        <View style={styles.actionsSection}>
          <BigActionButton
            title="INICIAR NOVO SIMULADO"
            variant="primary"
            minHeight={64}
            onPress={() => router.push('/simulado/novo')}
            style={styles.actionButton}
          />

          <BigActionButton
            title="Simulado Rápido (Sem Cadastro)"
            variant="secondary"
            minHeight={58}
            onPress={handleSimuladoRapido}
            style={styles.actionButton}
          />
        </View>

        {/* Informações Rápidas e Acessos */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Instruções Rápidas de Uso</Text>
          <Text style={styles.cardBody}>
            • Lançamento em 1 a 2 toques na tela veicular.{'\n'}
            • Feedback com vibração tátil diferenciada por gravidade de falta.{'\n'}
            • Botão Desfazer (Undo) imediato na barra inferior.{'\n'}
            • Funciona 100% offline dentro do carro sem internet.
          </Text>
        </View>

        <BigActionButton
          title="Ver Lista de Alunos"
          variant="outline"
          minHeight={52}
          onPress={() => router.push('/alunos')}
          style={{ marginTop: 8 }}
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
  normaBanner: {
    backgroundColor: '#1E3A8A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  normaTag: {
    fontSize: 11,
    fontWeight: '800',
    color: '#93C5FD',
    letterSpacing: 1,
    marginBottom: 4,
  },
  normaTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  normaSub: {
    fontSize: 13,
    fontWeight: '600',
    color: '#BFDBFE',
    marginBottom: 8,
  },
  normaRules: {
    fontSize: 12,
    color: '#E0F2FE',
    fontWeight: '500',
  },
  actionsSection: {
    marginBottom: 16,
  },
  actionButton: {
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  cardBody: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 22,
  },
});
