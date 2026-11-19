import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuthStore } from '../../features/auth/authStore';
import { syncService } from '../../data/sync/syncService';
import { BigActionButton } from '../../components/BigActionButton';
import { getPerfisEstaduais } from '../../core/rules/loader';

export default function ConfiguracoesScreen() {
  const { usuario, modoOffline, ufPadrao, setUfPadrao } = useAuthStore();
  const [totalPendentes, setTotalPendentes] = useState(0);
  const [sincronizando, setSincronizando] = useState(false);

  const perfis = getPerfisEstaduais();

  const atualizarFila = useCallback(async () => {
    try {
      const qtd = await syncService.obterTotalPendentes();
      setTotalPendentes(qtd);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    atualizarFila();
  }, [atualizarFila]);

  const handleSincronizar = async () => {
    setSincronizando(true);
    try {
      const res = await syncService.sincronizarFila();
      Alert.alert(
        'Sincronização Concluída',
        `Itens processados: ${res.processados}\nErros: ${res.erros}\nPendentes restantes: ${res.pendentesRestantes}`
      );
      await atualizarFila();
    } catch (e) {
      console.error(e);
      Alert.alert('Erro', 'Não foi possível sincronizar com o servidor.');
    } finally {
      setSincronizando(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Banner do Usuário e Modo */}
        <View style={styles.userCard}>
          <Text style={styles.userName}>{usuario?.nome || 'Instrutor'}</Text>
          <Text style={styles.userEmail}>{usuario?.email || 'Modo Offline'}</Text>
          <View style={styles.modeTag}>
            <Text style={styles.modeTagText}>
              {modoOffline ? '⚡ MODO VEICULAR OFFLINE ATIVO' : '🌐 CONECTADO ONLINE'}
            </Text>
          </View>
        </View>

        {/* Painel da Fila de Sincronização */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Fila de Sincronização Offline</Text>
          <Text style={styles.cardSubtitle}>
            Mutações de alunos e simulados acumuladas para envio ao Supabase:
          </Text>

          <View style={styles.syncRow}>
            <View>
              <Text style={styles.syncNumber}>{totalPendentes}</Text>
              <Text style={styles.syncLabel}>Registros pendentes</Text>
            </View>

            <BigActionButton
              title="Sincronizar Agora"
              variant="primary"
              minHeight={46}
              loading={sincronizando}
              onPress={handleSincronizar}
              style={{ minWidth: 160 }}
            />
          </View>
        </View>

        {/* Seleção do Perfil Estadual (UF) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Perfil Estadual de Regras</Text>
          <Text style={styles.cardSubtitle}>
            Norma regulamentadora aplicada aos cálculos de pontuação:
          </Text>

          {perfis.map((p) => {
            const isSelected = ufPadrao === p.uf;
            return (
              <TouchableOpacity
                key={p.id}
                style={[styles.ufOption, isSelected && styles.ufOptionSelected]}
                onPress={() => setUfPadrao(p.uf)}
                activeOpacity={0.7}
              >
                <View style={styles.ufRadio}>
                  {isSelected && <View style={styles.ufRadioInner} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.ufName, isSelected && { color: '#1E40AF' }]}
                  >
                    {p.nome}
                  </Text>
                  <Text style={styles.ufDesc}>
                    Limite: {p.limite_aprovacao} pts • Incapacidade: {p.limite_incapacidade_tecnica}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Informações e Direitos LGPD */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Conformidade LGPD & Privacidade</Text>
          <Text style={styles.lgpdBody}>
            O aplicativo opera segundo o princípio da minimização de dados da Lei Geral
            de Proteção de Dados (Lei nº 13.709/2018):
            {'\n'}• Não coletamos CPF, RG ou número de RENACH dos alunos.
            {'\n'}• Nome e WhatsApp são utilizados exclusivamente para emissão do relatório pedagógico.
            {'\n'}• O titular possui direito à exclusão definitiva em cascata de todos os seus dados a qualquer momento pelo perfil do aluno.
          </Text>
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
  userCard: {
    backgroundColor: '#1E40AF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  userEmail: {
    fontSize: 13,
    color: '#BFDBFE',
    marginTop: 2,
    marginBottom: 8,
  },
  modeTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#172554',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  modeTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#93C5FD',
    letterSpacing: 0.5,
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
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
  },
  syncRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  syncNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1E40AF',
  },
  syncLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  ufOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  ufOptionSelected: {
    borderColor: '#1E40AF',
    backgroundColor: '#EFF6FF',
  },
  ufRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#1E40AF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  ufRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1E40AF',
  },
  ufName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  ufDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  lgpdBody: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },
});
