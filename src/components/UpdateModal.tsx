import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { ReleaseInfo, updateService } from '../features/updater/updateService';

interface UpdateModalProps {
  visible: boolean;
  release: ReleaseInfo | null;
  onClose: () => void;
}

type FaseUpdate = 'inicial' | 'baixando' | 'concluido';

export function UpdateModal({ visible, release, onClose }: UpdateModalProps) {
  const [fase, setFase] = useState<FaseUpdate>('inicial');
  const [progresso, setProgresso] = useState(0);
  const [localApkUri, setLocalApkUri] = useState<string | null>(null);

  if (!visible || !release) return null;

  const handleIniciarDownload = async () => {
    if (!release.apkUrl) return;

    setFase('baixando');
    setProgresso(0);

    try {
      const uri = await updateService.baixarApk(release.apkUrl, (p) => {
        setProgresso(p);
      });
      setLocalApkUri(uri);
      setFase('concluido');

      // Tenta abrir o instalador imediatamente após o término do download
      await updateService.instalarApk(uri, release.apkUrl);
    } catch (e: any) {
      console.error(e);
      Alert.alert(
        'Falha no Download',
        'Não foi possível concluir o download da atualização. Verifique sua conexão com a internet.'
      );
      setFase('inicial');
    }
  };

  const handleTentarInstalarNovamente = async () => {
    if (localApkUri) {
      await updateService.instalarApk(localApkUri, release.apkUrl || undefined);
    } else if (release.apkUrl) {
      await updateService.baixarEInstalarApk(release.apkUrl);
    }
  };

  const handleAbrirNavegador = async () => {
    if (release.apkUrl) {
      await Linking.openURL(release.apkUrl);
      onClose();
    }
  };

  const handleFechar = () => {
    if (fase === 'baixando') return;
    setFase('inicial');
    onClose();
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={handleFechar}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Cabeçalho */}
          <View style={styles.header}>
            <Text style={styles.badge}>ATUALIZAÇÃO DISPONÍVEL</Text>
            <Text style={styles.title}>Nova Versão {release.tagName}</Text>
            <Text style={styles.subtitle}>
              Versão instalada: v{release.versaoAtual} • Tamanho: {release.tamanhoMb ? `${release.tamanhoMb} MB` : 'APK'}
            </Text>
          </View>

          {/* Estado Inicial ou Concluído */}
          {fase === 'inicial' && (
            <View style={styles.body}>
              <Text style={styles.sectionTitle}>Novidades desta versão:</Text>
              <ScrollView style={styles.notesScroll} nestedScrollEnabled>
                <Text style={styles.notesText}>
                  {release.notas
                    ? release.notas.slice(0, 450) + (release.notas.length > 450 ? '...' : '')
                    : 'Melhorias de desempenho, correções de interface e atualização das diretrizes do DETRAN.'}
                </Text>
              </ScrollView>
            </View>
          )}

          {/* Estado Baixando */}
          {fase === 'baixando' && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: `${progresso}%` }]} />
              </View>
              <Text style={styles.progressText}>
                Baixando atualização... {progresso}%
              </Text>
              <Text style={styles.progressSubText}>
                O arquivo está sendo transferido diretamente para o celular.
              </Text>
            </View>
          )}

          {/* Estado Concluído */}
          {fase === 'concluido' && (
            <View style={styles.concluidoContainer}>
              <View style={styles.concluidoBadge}>
                <Text style={styles.concluidoBadgeText}>✅ DOWNLOAD COMPLETO</Text>
              </View>
              <Text style={styles.concluidoTitle}>
                Pronto para instalar a versão {release.tagName}
              </Text>
              <Text style={styles.concluidoText}>
                Toque em "Instalar Agora". Se o Android solicitar, ative a opção "Permitir desta fonte" para o SimulaDetran concluir a instalação.
              </Text>
            </View>
          )}

          {/* Botões de Ação */}
          <View style={styles.actions}>
            {fase === 'inicial' && (
              <>
                <TouchableOpacity
                  style={styles.btnPrimary}
                  onPress={handleIniciarDownload}
                  activeOpacity={0.8}
                >
                  <Text style={styles.btnPrimaryText}>🚀 Baixar e Atualizar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.btnSecondary}
                  onPress={handleFechar}
                  activeOpacity={0.7}
                >
                  <Text style={styles.btnSecondaryText}>Lembrar Mais Tarde</Text>
                </TouchableOpacity>
              </>
            )}

            {fase === 'baixando' && (
              <View style={styles.btnLoadingRow}>
                <ActivityIndicator size="small" color="#1E40AF" />
                <Text style={styles.btnLoadingText}> Baixando ({progresso}%)...</Text>
              </View>
            )}

            {fase === 'concluido' && (
              <>
                <TouchableOpacity
                  style={styles.btnSuccess}
                  onPress={handleTentarInstalarNovamente}
                  activeOpacity={0.8}
                >
                  <Text style={styles.btnPrimaryText}>📲 Instalar Agora</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.btnOutline}
                  onPress={handleAbrirNavegador}
                  activeOpacity={0.7}
                >
                  <Text style={styles.btnOutlineText}>🌐 Instalar via Navegador</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.btnSecondary}
                  onPress={handleFechar}
                  activeOpacity={0.7}
                >
                  <Text style={styles.btnSecondaryText}>Fechar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 380,
    padding: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  badge: {
    backgroundColor: '#EFF6FF',
    color: '#1E40AF',
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  body: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  notesScroll: {
    maxHeight: 120,
  },
  notesText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  progressContainer: {
    marginBottom: 20,
    paddingVertical: 10,
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: '#E2E8F0',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 5,
  },
  progressText: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '800',
    textAlign: 'center',
  },
  progressSubText: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  concluidoContainer: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    alignItems: 'center',
  },
  concluidoBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  concluidoBadgeText: {
    color: '#15803D',
    fontSize: 11,
    fontWeight: '800',
  },
  concluidoTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#166534',
    textAlign: 'center',
    marginBottom: 6,
  },
  concluidoText: {
    fontSize: 12,
    color: '#14532D',
    textAlign: 'center',
    lineHeight: 18,
  },
  actions: {
    gap: 8,
  },
  btnPrimary: {
    backgroundColor: '#1E40AF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnSuccess: {
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnOutline: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#1E40AF',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnOutlineText: {
    color: '#1E40AF',
    fontSize: 14,
    fontWeight: '700',
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  btnLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  btnLoadingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E40AF',
  },
  btnSecondary: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  btnSecondaryText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
});
