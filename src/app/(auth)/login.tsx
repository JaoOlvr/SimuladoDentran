import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../features/auth/authStore';
import { BigActionButton } from '../../components/BigActionButton';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const { loginOnline, iniciarModoOffline, carregando, erro } = useAuthStore();

  const handleLoginOnline = async () => {
    if (!email.trim() || !senha.trim()) {
      Alert.alert('Campos Obrigatórios', 'Informe e-mail e senha.');
      return;
    }

    const ok = await loginOnline(email.trim(), senha.trim());
    if (ok) {
      router.replace('/(tabs)');
    }
  };

  const handleModoOffline = () => {
    iniciarModoOffline();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.brandBox}>
          <Text style={styles.brandTitle}>SimulaDetran</Text>
          <Text style={styles.brandSub}>
            Aplicativo de Simulados Práticos de Direção
          </Text>
          <Text style={styles.normaTag}>Resolução Contran nº 1.020/2025</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Acesso do Instrutor</Text>

          {erro && <Text style={styles.errorText}>{erro}</Text>}

          <View style={styles.field}>
            <Text style={styles.label}>E-mail</Text>
            <TextInput
              style={styles.input}
              placeholder="instrutor@autoescola.com.br"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Senha</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#94A3B8"
              secureTextEntry
              value={senha}
              onChangeText={setSenha}
            />
          </View>

          <BigActionButton
            title="ENTRAR ONLINE"
            variant="primary"
            minHeight={56}
            loading={carregando}
            onPress={handleLoginOnline}
            style={{ marginTop: 12, marginBottom: 12 }}
          />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OU</Text>
            <View style={styles.dividerLine} />
          </View>

          <BigActionButton
            title="⚡ Começar Offline (Sem Internet)"
            variant="secondary"
            minHeight={56}
            onPress={handleModoOffline}
          />
        </View>

        <Text style={styles.offlineNotice}>
          O modo offline permite realizar simulados e gerar relatórios no veículo
          sem sinal de internet. A sincronização com a nuvem ocorre quando houver conexão.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  brandBox: {
    alignItems: 'center',
    marginBottom: 28,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1E40AF',
    letterSpacing: -0.5,
  },
  brandSub: {
    fontSize: 14,
    color: '#475569',
    marginTop: 4,
    fontWeight: '600',
  },
  normaTag: {
    fontSize: 12,
    color: '#1E40AF',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
  },
  field: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
  },
  errorText: {
    color: '#BE123C',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  offlineNotice: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
});

