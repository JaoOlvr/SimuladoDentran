import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { InfracaoCatalogo, NaturezaInfracao } from '../core/rules/types';

interface InfracaoCardProps {
  infracao: InfracaoCatalogo;
  onPress: (infracao: InfracaoCatalogo) => void;
}

export function InfracaoCard({ infracao, onPress }: InfracaoCardProps) {
  const getBadgeStyle = (natureza: NaturezaInfracao) => {
    switch (natureza) {
      case 'leve':
        return {
          bg: '#E0F2FE', // Sky 100
          text: '#0369A1', // Sky 700
          border: '#7DD3FC',
          label: '+1 pt',
        };
      case 'media':
        return {
          bg: '#FEF3C7', // Amber 100
          text: '#B45309', // Amber 700
          border: '#FCD34D',
          label: '+2 pts',
        };
      case 'grave':
        return {
          bg: '#FFEDD5', // Orange 100
          text: '#C2410C', // Orange 700
          border: '#FDBA74',
          label: '+4 pts',
        };
      case 'gravissima':
        return {
          bg: '#FEE2E2', // Red 100
          text: '#B91C1C', // Red 700
          border: '#FCA5A5',
          label: '+6 pts',
        };
    }
  };

  const badge = getBadgeStyle(infracao.natureza);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(infracao)}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${infracao.artigo_ctb}, ${infracao.descricao}, soma ${badge.label}`}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.artigoText}>{infracao.artigo_ctb}</Text>
          <View style={[styles.badge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
            <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
          </View>
        </View>

        <Text style={styles.descricaoText} numberOfLines={2} ellipsizeMode="tail">
          {infracao.descricao}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 64,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  artigoText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E40AF',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  descricaoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 18,
  },
});
