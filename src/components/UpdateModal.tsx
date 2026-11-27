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
} from 'react-native';
import { ReleaseInfo, updateService } from '../features/updater/updateService';

interface UpdateModalProps {
  visible: boolean;
  release: ReleaseInfo | null;
  onClose: () => void;
}

export function UpdateModal({ visible, release, onClose }: UpdateModalProps) {
  const [baixando, setBaixando] = useState(false);
  const [progresso, setProgresso] = useState(0);

  if (!visible || !release) return null;

  const handleAtualizar = async () => {
    if (!release.apkUrl) return;

    setBaixando(true);
    setProgresso(0);

    try {
      await updateService.baixarEInstalarApk(release.apkUrl, (p) => {
        setProgresso(p);
      });
      // Fecha o modal após disparar o instalador
      onClose();
    } catch (e: any) {
      console.error(e);
      Alert.alert(
        'Erro no Download',
        'Não foi possível concluir o download da atualização. Verifique sua conexão com a internet.'
      );
    } finally {
      setBaixando(false);
    }
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={() => {
        if (!baixando) onClose();
      }}
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

          {/* O que há de novo */}
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

          {/* Barra de Progresso quando estiver baixando */}
          {baixando && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: `${progresso}%` }]} />
              </View>
              <Text style={styles.progressText}>
                Baixando atualização... {progresso}%
              </Text>
            </View>
          )}

          {/* Botões de Ação */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btnPrimary, baixando && styles.btnDisabled]}
              onPress={handleAtualizar}
              disabled={baixando}
              activeOpacity={0.8}
            >
              {baixando ? (
                <View style={styles.btnLoadingRow}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.btnPrimaryText}> Baixando ({progresso}%)...</Text>
                </View>
              ) : (
                <Text style={styles.btnPrimaryText}>🚀 Atualizar Agora</Text>
              )}
            </TouchableOpacity>

            {!baixando && (
              <TouchableOpacity
                style={styles.btnSecondary}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={styles.btnSecondaryText}>Lembrar Mais Tarde</Text>
              </TouchableOpacity>
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
    marginBottom: 16,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '700',
    textAlign: 'center',
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
  btnDisabled: {
    backgroundColor: '#94A3B8',
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
  },
  btnSecondary: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnSecondaryText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
});
