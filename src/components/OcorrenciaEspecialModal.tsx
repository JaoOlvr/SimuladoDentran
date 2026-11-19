import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { BigActionButton } from './BigActionButton';
import { MotivoEliminacao, MotivoNaoConcluido } from '../core/scoring/types';

interface OcorrenciaEspecialModalProps {
  visible: boolean;
  contadorIncapacidade: number;
  limiteIncapacidade: number;
  onClose: () => void;
  onRegistrarIncapacidade: (submotivo?: string) => void;
  onEliminar: (motivo: MotivoEliminacao, obs?: string) => void;
  onInterromper: (motivo: MotivoNaoConcluido, obs?: string) => void;
}

export function OcorrenciaEspecialModal({
  visible,
  contadorIncapacidade,
  limiteIncapacidade,
  onClose,
  onRegistrarIncapacidade,
  onEliminar,
  onInterromper,
}: OcorrenciaEspecialModalProps) {
  const [etapa, setEtapa] = useState<'menu' | 'eliminar' | 'interromper'>('menu');

  const handleFechar = () => {
    setEtapa('menu');
    onClose();
  };

  const handleIncapacidadeClick = () => {
    if (contadorIncapacidade + 1 >= limiteIncapacidade) {
      Alert.alert(
        'Confirmar Incapacidade Reiterada',
        `Esta será a 2ª ocorrência de incapacidade técnica. Conforme a norma, o exame será encerrado como NÃO CONCLUÍDO. Deseja prosseguir?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Sim, Encerrar',
            style: 'destructive',
            onPress: () => {
              onRegistrarIncapacidade('Incapacidade técnica reiterada na manobra');
              handleFechar();
            },
          },
        ]
      );
    } else {
      onRegistrarIncapacidade('1ª falha operacional técnica');
      handleFechar();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleFechar}
    >
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          <View style={styles.indicator} />

          {etapa === 'menu' && (
            <View>
              <Text style={styles.title}>Ocorrência Especial</Text>
              <Text style={styles.subtitle}>
                Ações excepcionais tipificadas na Resolução Contran nº 1.020/2025
              </Text>

              {/* Opção 1: Incapacidade Técnica */}
              <TouchableOpacity
                style={styles.optionButton}
                onPress={handleIncapacidadeClick}
                activeOpacity={0.7}
              >
                <View style={styles.optionHeader}>
                  <Text style={styles.optionTitle}>Incapacidade Técnica</Text>
                  <View style={styles.badgeCount}>
                    <Text style={styles.badgeCountText}>
                      {contadorIncapacidade}/{limiteIncapacidade}
                    </Text>
                  </View>
                </View>
                <Text style={styles.optionDescription}>
                  {contadorIncapacidade === 0
                    ? '1ª ocorrência: lança falta leve automática (Art. 169) e soma +1 pt'
                    : '2ª ocorrência: encerra o exame imediatamente como NÃO CONCLUÍDO'}
                </Text>
              </TouchableOpacity>

              {/* Opção 2: Interromper / Não Concluído */}
              <TouchableOpacity
                style={styles.optionButton}
                onPress={() => setEtapa('interromper')}
                activeOpacity={0.7}
              >
                <Text style={styles.optionTitle}>Interromper Exame (Não Concluído)</Text>
                <Text style={styles.optionDescription}>
                  Sinistro de trânsito, instabilidade emocional, pane ou retenção veicular
                </Text>
              </TouchableOpacity>

              {/* Opção 3: Eliminar Candidato */}
              <TouchableOpacity
                style={[styles.optionButton, styles.dangerOption]}
                onPress={() => setEtapa('eliminar')}
                activeOpacity={0.7}
              >
                <Text style={[styles.optionTitle, { color: '#BE123C' }]}>
                  Eliminar Candidato
                </Text>
                <Text style={styles.optionDescription}>
                  Fraude, desacato, agressão ou desobediência grave às ordens
                </Text>
              </TouchableOpacity>

              <BigActionButton
                title="Voltar ao Simulado"
                variant="outline"
                onPress={handleFechar}
                style={{ marginTop: 12 }}
              />
            </View>
          )}

          {etapa === 'eliminar' && (
            <ScrollView>
              <Text style={[styles.title, { color: '#BE123C' }]}>
                Eliminação Imediata
              </Text>
              <Text style={styles.subtitle}>
                Selecione o motivo tipificado para encerramento com status ELIMINADO:
              </Text>

              <BigActionButton
                title="Desrespeito ou Desacato"
                variant="danger"
                onPress={() => {
                  onEliminar('desrespeito_ou_desacato');
                  handleFechar();
                }}
                style={styles.actionItem}
              />

              <BigActionButton
                title="Fraude ou Tentativa de Burlar"
                variant="danger"
                onPress={() => {
                  onEliminar('fraude');
                  handleFechar();
                }}
                style={styles.actionItem}
              />

              <BigActionButton
                title="Desobediência Grave"
                variant="danger"
                onPress={() => {
                  onEliminar('desobediencia_grave');
                  handleFechar();
                }}
                style={styles.actionItem}
              />

              <BigActionButton
                title="Voltar"
                variant="outline"
                onPress={() => setEtapa('menu')}
                style={{ marginTop: 12 }}
              />
            </ScrollView>
          )}

          {etapa === 'interromper' && (
            <ScrollView>
              <Text style={styles.title}>Interrupção de Exame</Text>
              <Text style={styles.subtitle}>
                Conforme Art. 46 (Res. 1.020/2025), o simulado não terá nota final:
              </Text>

              <BigActionButton
                title="Sinistro de Trânsito / Colisão"
                variant="warning"
                onPress={() => {
                  onInterromper('sinistro_transito');
                  handleFechar();
                }}
                style={styles.actionItem}
              />

              <BigActionButton
                title="Instabilidade Emocional do Candidato"
                variant="warning"
                onPress={() => {
                  onInterromper('instabilidade_emocional');
                  handleFechar();
                }}
                style={styles.actionItem}
              />

              <BigActionButton
                title="Retenção ou Pane no Veículo"
                variant="warning"
                onPress={() => {
                  onInterromper('retencao_veiculo');
                  handleFechar();
                }}
                style={styles.actionItem}
              />

              <BigActionButton
                title="Voltar"
                variant="outline"
                onPress={() => setEtapa('menu')}
                style={{ marginTop: 12 }}
              />
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    maxHeight: '85%',
  },
  indicator: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 18,
  },
  optionButton: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  dangerOption: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  badgeCount: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeCountText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#3730A3',
  },
  optionDescription: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  actionItem: {
    marginBottom: 10,
  },
});

