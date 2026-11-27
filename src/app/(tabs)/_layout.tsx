import React from 'react';
import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1E40AF',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: '800',
        },
        tabBarStyle: {
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E8F0',
          borderTopWidth: 1.5,
        },
        tabBarActiveTintColor: '#1E40AF',
        tabBarInactiveTintColor: '#64748B',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Simulados',
          tabBarLabel: 'Início',
          headerTitle: 'SimulaDetran',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'car-sport' : 'car-sport-outline'}
              size={size || 24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="alunos"
        options={{
          title: 'Alunos',
          tabBarLabel: 'Alunos',
          headerTitle: 'Gestão de Alunos',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'people' : 'people-outline'}
              size={size || 24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="configuracoes"
        options={{
          title: 'Configurações',
          tabBarLabel: 'Ajustes / LGPD',
          headerTitle: 'Configurações e LGPD',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'settings' : 'settings-outline'}
              size={size || 24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
