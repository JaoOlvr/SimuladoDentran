import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { EstadoSimuladoCalculado } from '../core/scoring/types';

interface ScoreBadgeProps {
  estado: EstadoSimuladoCalculado;
}

export function ScoreBadge({ estado }: ScoreBadgeProps) {
  const {
    pontos_totais,
    limite_aprovacao,
    contador_incapacidade_tecnica,
    status,
    motivo_encerramento,
  } = estado;

  // Lógica de Cores de Alto Contraste (WCAG AAA)
  const getTheme = () => {
    if (status === 'ELIMINADO' || status === 'NAO_CONCLUIDO') {
      return {
        bg: '#881337', // Rose 900
        border: '#F43F5E',
        text: '#FFFFFF',
        alerta:
          status === 'ELIMINADO'
            ? `ELIMINADO: ${motivo_encerramento || 'Conduta vedada'}`
            : `NÃO CONCLUÍDO: ${motivo_encerramento || 'Exame interrompido'}`,
        badgeColor: '#FDA4AF',
        badgeText: '#881337',
      };
    }

    if (pontos_totais >= 11) {
      return {
        bg: '#991B1B', // Red 800
        border: '#EF4444',
        text: '#FFFFFF',
        alerta: 'Reprovado por pontos (pode continuar para fins didáticos)',
        badgeColor: '#FCA5A5',
        badgeText: '#7F1D1D',
      };
    }

    if (pontos_totais >= 7) {
      return {
        bg: '#B45309', // Amber 700
        border: '#FBBF24',
        text: '#FFFFFF',
        alerta: 'No limite! 10 pontos ainda aprova',
        badgeColor: '#FDE68A',
        badgeText: '#78350F',
      };
    }

    return {
      bg: '#065F46', // Emerald 800
      border: '#34D399',
      text: '#FFFFFF',
      alerta: 'Situação segura para aprovação',
      badgeColor: '#A7F3D0',
      badgeText: '#064E3B',
    };
  };

  const theme = getTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.bg, borderColor: theme.border }]}>
      <View style={styles.topRow}>
        <View>
          <Text style={[styles.scoreText, { color: theme.text }]}>
            {pontos_totais} <Text style={styles.limitText}>/ {limite_aprovacao} pts</Text>
          </Text>
        </View>

        {contador_incapacidade_tecnica > 0 && (
          <View style={[styles.incapBadge, { backgroundColor: theme.badgeColor }]}>
            <Text style={[styles.incapText, { color: theme.badgeText }]}>
              Incapacidade: {contador_incapacidade_tecnica}/2
            </Text>
          </View>
        )}
      </View>

      <Text style={[styles.alertaText, { color: theme.text }]}>{theme.alerta}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  limitText: {
    fontSize: 18,
    fontWeight: '600',
    opacity: 0.85,
  },
  incapBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  incapText: {
    fontSize: 12,
    fontWeight: '800',
  },
  alertaText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.2,
  },
});
