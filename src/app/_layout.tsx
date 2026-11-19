import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1E40AF',
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: '800',
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="alunos/novo"
          options={{
            title: 'Novo Aluno',
          }}
        />
        <Stack.Screen
          name="alunos/[id]"
          options={{
            title: 'Perfil do Aluno',
          }}
        />
        <Stack.Screen
          name="alunos/[id]/evolucao"
          options={{
            title: 'Evolução e Estatísticas',
          }}
        />
        <Stack.Screen
          name="simulado/novo"
          options={{
            title: 'Preparar Simulado',
          }}
        />
        <Stack.Screen
          name="simulado/[id]"
          options={{
            title: 'Simulado Prático',
            headerBackVisible: false,
          }}
        />
        <Stack.Screen
          name="simulado/[id]/resultado"
          options={{
            title: 'Resultado Final',
            headerBackVisible: false,
          }}
        />
      </Stack>
    </>
  );
}
