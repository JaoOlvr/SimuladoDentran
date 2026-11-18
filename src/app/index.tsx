import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';

export default function HomeScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 24,
        }}
      >
        <View
          style={{
            backgroundColor: '#1E40AF',
            paddingVertical: 12,
            paddingHorizontal: 20,
            borderRadius: 16,
            marginBottom: 20,
          }}
        >
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 24,
              fontWeight: '800',
              letterSpacing: 0.5,
            }}
          >
            SimulaDetran
          </Text>
        </View>

        <Text
          style={{
            fontSize: 16,
            color: '#475569',
            textAlign: 'center',
            marginBottom: 8,
            fontWeight: '600',
          }}
        >
          Resolução Contran nº 1.020/2025
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: '#64748B',
            textAlign: 'center',
            marginBottom: 32,
          }}
        >
          Padrão Maranhão (MA) — Portaria Detran-MA nº 127/2026
        </Text>

        <View
          style={{
            width: '100%',
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
            marginBottom: 24,
          }}
        >
          <Text
            style={{
              fontSize: 15,
              fontWeight: '700',
              color: '#0F172A',
              marginBottom: 8,
            }}
          >
            Motor de Pontuação Validado
          </Text>
          <Text style={{ fontSize: 13, color: '#334155', lineHeight: 20 }}>
            • Limite de aprovação: até 10 pontos{'\n'}• 11 ou mais: Reprovado{'\n'}
            • Faltas: Leve (1), Média (2), Grave (4), Gravíssima (6){'\n'}•
            Incapacidade técnica: limite 2 com Art. 169 automático{'\n'}•
            Encerramentos: Eliminado e Não Concluído
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
