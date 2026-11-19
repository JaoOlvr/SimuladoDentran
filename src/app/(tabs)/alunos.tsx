import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { alunosRepository } from '../../data/db/repositories/alunosRepository';
import { simuladosRepository } from '../../data/db/repositories/simuladosRepository';
import { Aluno, SimuladoDb } from '../../data/db/schema';
import { BigActionButton } from '../../components/BigActionButton';

interface AlunoComStatus extends Aluno {
  ultimoSimulado?: SimuladoDb;
}

export default function AlunosScreen() {
  const [alunosLista, setAlunosLista] = useState<AlunoComStatus[]>([]);
  const [busca, setBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState<'TODAS' | 'A' | 'B'>('TODAS');
  const [carregando, setCarregando] = useState(true);

  const carregarDados = useCallback(async () => {
    setCarregando(true);
    try {
      const paramCategoria = filtroCategoria === 'TODAS' ? undefined : filtroCategoria;
      const alunos = await alunosRepository.listar({
        busca: busca.trim() || undefined,
        categoria: paramCategoria,
      });

      const comStatus: AlunoComStatus[] = await Promise.all(
        alunos.map(async (a) => {
          const ultimo = await simuladosRepository.buscarUltimoDoAluno(a.id);
          return { ...a, ultimoSimulado: ultimo };
        })
      );

      setAlunosLista(comStatus);
    } catch (e) {
      console.error(e);
    } finally {
      setCarregando(false);
    }
  }, [busca, filtroCategoria]);

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [carregarDados])
  );

  const renderBadgeStatus = (ultimo?: SimuladoDb) => {
    if (!ultimo) {
      return (
        <View style={[styles.badge, { backgroundColor: '#F1F5F9' }]}>
          <Text style={[styles.badgeText, { color: '#64748B' }]}>Sem simulados</Text>
        </View>
      );
    }

    if (ultimo.status === 'APROVADO') {
      return (
        <View style={[styles.badge, { backgroundColor: '#DCFCE7' }]}>
          <Text style={[styles.badgeText, { color: '#15803D' }]}>
            Aprovado ({ultimo.pontos_totais} pts)
          </Text>
        </View>
      );
    }

    if (ultimo.status === 'REPROVADO') {
      return (
        <View style={[styles.badge, { backgroundColor: '#FEE2E2' }]}>
          <Text style={[styles.badgeText, { color: '#B91C1C' }]}>
            Reprovado ({ultimo.pontos_totais} pts)
          </Text>
        </View>
      );
    }

    return (
      <View style={[styles.badge, { backgroundColor: '#FEF3C7' }]}>
        <Text style={[styles.badgeText, { color: '#B45309' }]}>{ultimo.status}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Barra de Busca Instantânea */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nome do aluno..."
            placeholderTextColor="#94A3B8"
            value={busca}
            onChangeText={setBusca}
          />
        </View>

        {/* Filtros Rápidos de Categoria */}
        <View style={styles.filterRow}>
          {(['TODAS', 'B', 'A'] as const).map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.filterButton,
                filtroCategoria === cat && styles.filterButtonActive,
              ]}
              onPress={() => setFiltroCategoria(cat)}
            >
              <Text
                style={[
                  styles.filterText,
                  filtroCategoria === cat && styles.filterTextActive,
                ]}
              >
                {cat === 'TODAS' ? 'Todas' : `Cat. ${cat}`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Botão Novo Aluno */}
        <BigActionButton
          title="+ Cadastrar Novo Aluno"
          variant="primary"
          minHeight={52}
          onPress={() => router.push('/alunos/novo')}
          style={{ marginBottom: 12 }}
        />

        {/* Lista de Alunos */}
        {carregando ? (
          <ActivityIndicator size="large" color="#1E40AF" style={{ marginTop: 24 }} />
        ) : (
          <FlatList
            data={alunosLista}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 24 }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Nenhum aluno encontrado.</Text>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.alunoCard}
                onPress={() => router.push(`/alunos/${item.id}`)}
                activeOpacity={0.7}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.alunoNome}>{item.nome}</Text>
                  {renderBadgeStatus(item.ultimoSimulado)}
                </View>

                <View style={styles.cardDetails}>
                  <Text style={styles.detailText}>
                    Cat. {item.categoria_pretendida} • Câmbio {item.tipo_cambio}
                  </Text>
                  {item.telefone && (
                    <Text style={styles.telefoneText}>{item.telefone}</Text>
                  )}
                </View>
              </TouchableOpacity>
            )}
          />
        )}
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
    padding: 16,
  },
  searchContainer: {
    marginBottom: 10,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
  },
  filterButtonActive: {
    backgroundColor: '#1E40AF',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  alunoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  alunoNome: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  telefoneText: {
    fontSize: 13,
    color: '#0284C7',
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
  },
});

