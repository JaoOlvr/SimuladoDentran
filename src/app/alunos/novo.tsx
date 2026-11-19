import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { alunosRepository } from '../../data/db/repositories/alunosRepository';
import { BigActionButton } from '../../components/BigActionButton';

export default function NovoAlunoScreen() {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [categoria, setCategoria] = useState<'A' | 'B'>('B');
  const [cambio, setCambio] = useState<'manual' | 'automatico'>('manual');
  const [consentimentoLGPD, setConsentimentoLGPD] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const handleSalvar = async () => {
    if (!nome.trim()) {
      Alert.alert('Campo Obrigatório', 'Por favor, informe o nome do aluno.');
      return;
    }

    if (!consentimentoLGPD) {
      Alert.alert(
        'Consentimento LGPD',
        'É obrigatório registrar o consentimento do titular para fins de avaliação pedagógica e envio de relatórios.'
      );
      return;
    }

    setSalvando(true);
    try {
      const now = new Date().toISOString();
      const novoId = 'aluno_' + Date.now();

      await alunosRepository.criar({
        id: novoId,
        organizacao_id: 'org_default',
        instrutor_id: 'inst_default',
        nome: nome.trim(),
        telefone: telefone.trim() || null,
        categoria_pretendida: categoria,
        tipo_cambio: cambio,
        consentimento_lgpd: 1,
        consentimento_em: now,
        created_at: now,
        updated_at: now,
      });

      Alert.alert('Sucesso', 'Aluno cadastrado com sucesso!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      console.error(e);
      Alert.alert('Erro', 'Não foi possível cadastrar o aluno.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.headerTitle}>Novo Cadastro de Aluno</Text>
        <Text style={styles.headerSubtitle}>
          Dados mínimos para realização de simulados e emissão de relatório
        </Text>

        {/* Nome */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Nome Completo *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex.: Lucas Mendes"
            placeholderTextColor="#94A3B8"
            value={nome}
            onChangeText={setNome}
          />
        </View>

        {/* Telefone / WhatsApp */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>WhatsApp / Telefone (com DDD)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex.: (98) 98123-4567"
            placeholderTextColor="#94A3B8"
            keyboardType="phone-pad"
            value={telefone}
            onChangeText={setTelefone}
          />
        </View>

        {/* Categoria */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Categoria Pretendida</Text>
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
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Tipo de Câmbio</Text>
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

        {/* Checkbox LGPD */}
        <TouchableOpacity
          style={styles.lgpdContainer}
          onPress={() => setConsentimentoLGPD(!consentimentoLGPD)}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.checkbox,
              consentimentoLGPD && styles.checkboxChecked,
            ]}
          >
            {consentimentoLGPD && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.lgpdText}>
            O titular declara consentimento para coleta do nome e WhatsApp
            estritamente para cálculo e envio do relatório pedagógico do simulado
            prático (Lei Geral de Proteção de Dados - LGPD).
          </Text>
        </TouchableOpacity>

        {/* Botão Salvar */}
        <BigActionButton
          title="SALVAR ALUNO"
          variant="primary"
          minHeight={58}
          loading={salvando}
          onPress={handleSalvar}
          style={{ marginTop: 16 }}
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
    padding: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
    lineHeight: 20,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#0F172A',
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
  lgpdContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#1E40AF',
    backgroundColor: '#FFFFFF',
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#1E40AF',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  lgpdText: {
    flex: 1,
    fontSize: 12,
    color: '#1E3A8A',
    lineHeight: 18,
    fontWeight: '500',
  },
});
