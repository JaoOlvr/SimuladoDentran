import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSimuladoStore, AbaSimulado } from '../../features/simulado/simuladoStore';
import { ScoreBadge } from '../../components/ScoreBadge';
import { InfracaoCard } from '../../components/InfracaoCard';
import { ToastUndo } from '../../components/ToastUndo';
import { OcorrenciaEspecialModal } from '../../components/OcorrenciaEspecialModal';
import { InfracaoCatalogo, NaturezaInfracao } from '../../core/rules/types';

export default function SimuladoAtivoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const {
    simuladoAtual,
    alunoAtual,
    estadoCalculado,
    perfilRegra,
    catalogoInfracoes,
    abaAtiva,
    grupoFiltro,
    pesoFiltro,
    buscaTexto,
    toastMensagem,
    carregando,
    setAbaAtiva,
    setGrupoFiltro,
    setPesoFiltro,
    setBuscaTexto,
    limparToast,
    carregarSimulado,
    lancarInfracao,
    lancarIncapacidade,
    desfazer,
    eliminar,
    interromper,
  } = useSimuladoStore();

  const [modalEspecialAberto, setModalEspecialAberto] = useState(false);

  useEffect(() => {
    if (id && (!simuladoAtual || simuladoAtual.id !== id)) {
      carregarSimulado(id);
    }
  }, [id, simuladoAtual, carregarSimulado]);

  // Lista de grupos distintos do catálogo
  const gruposDisponiveis = useMemo(() => {
    const setGrupos = new Set(catalogoInfracoes.map((inf) => inf.agrupamento_ux));
    return ['todos', ...Array.from(setGrupos)];
  }, [catalogoInfracoes]);

  // Atalhos frequentes estatisticamente mais comuns no Brasil
  const infracoesFrequentes = useMemo(() => {
    const idsFrequentes = [
      'ctb_196', // Não deu seta (grave - 4pts)
      'ctb_169', // Atenção / Apagou motor / marcha (leve - 1pt)
      'ctb_208', // Parada obrigatória / semáforo (gravíssima - 6pts)
      'ctb_181_xvii', // Estacionamento / Baliza afastada (grave - 4pts)
      'ctb_167', // Deixar de usar cinto (grave - 4pts)
      'ctb_227', // Uso indevido de buzina (leve - 1pt)
      'ctb_186_ii', // Contramão (gravíssima - 6pts)
      'ctb_214_i_ii_iii', // Preferência pedestre (gravíssima - 6pts)
    ];
    return catalogoInfracoes.filter((inf) => idsFrequentes.includes(inf.id));
  }, [catalogoInfracoes]);

  // Filtragem dinâmica de infrações
  const infracoesFiltradas = useMemo(() => {
    let lista = catalogoInfracoes;

    // Se estiver na aba Frequentes
    if (abaAtiva === 'frequentes') {
      lista = infracoesFrequentes;
    } else if (abaAtiva === 'grupo') {
      if (grupoFiltro !== 'todos') {
        lista = lista.filter((inf) => inf.agrupamento_ux === grupoFiltro);
      }
    } else if (abaAtiva === 'peso') {
      if (pesoFiltro !== 'todos') {
        lista = lista.filter((inf) => inf.natureza === pesoFiltro);
      }
    }

    // Busca por texto
    if (buscaTexto.trim().length > 0) {
      const q = buscaTexto.toLowerCase().trim();
      lista = lista.filter(
        (inf) =>
          inf.descricao.toLowerCase().includes(q) ||
          inf.artigo_ctb.toLowerCase().includes(q) ||
          inf.agrupamento_ux.toLowerCase().includes(q)
      );
    }

    return lista;
  }, [catalogoInfracoes, abaAtiva, grupoFiltro, pesoFiltro, buscaTexto, infracoesFrequentes]);

  const handleLancarInfracao = async (inf: InfracaoCatalogo) => {
    await lancarInfracao(inf);
  };

  const handleDesfazer = async () => {
    await desfazer();
  };

  const handleFinalizar = () => {
    Alert.alert(
      'Encerrar Avaliação',
      'Deseja concluir o trajeto do simulado e ir para a tela de resultado final?',
      [
        { text: 'Continuar no Trajeto', style: 'cancel' },
        {
          text: 'Sim, Finalizar',
          style: 'default',
          onPress: () => {
            if (id) {
              router.push(`/simulado/${id}/resultado`);
            }
          },
        },
      ]
    );
  };

  if (carregando || !simuladoAtual) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1E40AF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Cabeçalho Fixo — Placar em Tempo Real */}
        <ScoreBadge estado={estadoCalculado} />

        {/* Informações do Aluno / Veículo */}
        <View style={styles.alunoHeader}>
          <Text style={styles.alunoNome} numberOfLines={1}>
            {alunoAtual ? alunoAtual.nome : 'Simulado Rápido'}
          </Text>
          <Text style={styles.veiculoInfo}>
            Cat. {simuladoAtual.categoria} • Câmbio {simuladoAtual.tipo_cambio}
          </Text>
        </View>

        {/* Campo de Busca Rápida */}
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por infração, artigo ou palavra-chave..."
            placeholderTextColor="#94A3B8"
            value={buscaTexto}
            onChangeText={setBuscaTexto}
            clearButtonMode="while-editing"
          />
        </View>

        {/* Abas Rápidas da Thumb Zone (Frequentes / Por Grupo / Por Peso) */}
        <View style={styles.tabsRow}>
          {(['frequentes', 'grupo', 'peso'] as AbaSimulado[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, abaAtiva === tab && styles.tabButtonActive]}
              onPress={() => setAbaAtiva(tab)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, abaAtiva === tab && styles.tabTextActive]}>
                {tab === 'frequentes'
                  ? '⭐ Frequentes'
                  : tab === 'grupo'
                  ? '📂 Por Grupo'
                  : '⚖️ Por Peso'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sub-filtros dinâmicos seletivos */}
        {abaAtiva === 'grupo' && (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={gruposDisponiveis}
            keyExtractor={(item) => item}
            style={styles.subFilterList}
            contentContainerStyle={{ paddingHorizontal: 12 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.subFilterChip,
                  grupoFiltro === item && styles.subFilterChipActive,
                ]}
                onPress={() => setGrupoFiltro(item)}
              >
                <Text
                  style={[
                    styles.subFilterText,
                    grupoFiltro === item && styles.subFilterTextActive,
                  ]}
                >
                  {item === 'todos' ? 'Todos os Grupos' : item.replace(/_/g, ' ')}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}

        {abaAtiva === 'peso' && (
          <View style={styles.pesoRow}>
            {(['todos', 'leve', 'media', 'grave', 'gravissima'] as const).map((peso) => (
              <TouchableOpacity
                key={peso}
                style={[
                  styles.subFilterChip,
                  pesoFiltro === peso && styles.subFilterChipActive,
                ]}
                onPress={() => setPesoFiltro(peso)}
              >
                <Text
                  style={[
                    styles.subFilterText,
                    pesoFiltro === peso && styles.subFilterTextActive,
                  ]}
                >
                  {peso === 'todos'
                    ? 'Todos'
                    : peso === 'leve'
                    ? '1 pt'
                    : peso === 'media'
                    ? '2 pts'
                    : peso === 'grave'
                    ? '4 pts'
                    : '6 pts'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Lista de Infrações Lançáveis com 1 Toque (min-height: 64dp) */}
        <FlatList
          data={infracoesFiltradas}
          keyExtractor={(item) => item.id}
          style={styles.infracoesList}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 110 }}
          renderItem={({ item }) => (
            <InfracaoCard infracao={item} onPress={handleLancarInfracao} />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                Nenhuma infração encontrada para o filtro atual.
              </Text>
            </View>
          }
        />

        {/* Toast Temporário de 5s com Botão DESFAZER */}
        {toastMensagem && (
          <ToastUndo
            mensagem={toastMensagem}
            onUndo={handleDesfazer}
            onDismiss={limparToast}
          />
        )}

        {/* Modal de Ocorrência Especial (Incapacidade 0/2, Interromper, Eliminar) */}
        <OcorrenciaEspecialModal
          visible={modalEspecialAberto}
          contadorIncapacidade={estadoCalculado.contador_incapacidade_tecnica}
          limiteIncapacidade={perfilRegra.limite_incapacidade_tecnica}
          onClose={() => setModalEspecialAberto(false)}
          onRegistrarIncapacidade={async (submotivo) => {
            await lancarIncapacidade(submotivo);
          }}
          onEliminar={async (motivo, obs) => {
            await eliminar(motivo, obs);
            if (id) router.replace(`/simulado/${id}/resultado`);
          }}
          onInterromper={async (motivo, obs) => {
            await interromper(motivo, obs);
            if (id) router.replace(`/simulado/${id}/resultado`);
          }}
        />

        {/* Barra Inferior Fixa da Thumb Zone */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.bottomBarButton}
            onPress={handleDesfazer}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Desfazer último lançamento"
          >
            <Text style={styles.bottomBarUndoText}>↩ Desfazer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.bottomBarButton, styles.specialButton]}
            onPress={() => setModalEspecialAberto(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Ocorrência Especial"
          >
            <Text style={styles.specialButtonText}>⚠️ Especial</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.bottomBarButton, styles.finishButton]}
            onPress={handleFinalizar}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Finalizar simulado"
          >
            <Text style={styles.finishButtonText}>🏁 Finalizar</Text>
          </TouchableOpacity>
        </View>
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
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alunoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  alunoNome: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  veiculoInfo: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  searchBar: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#1E40AF',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  subFilterList: {
    maxHeight: 46,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 6,
  },
  pesoRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F8FAFC',
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  subFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
    marginRight: 6,
  },
  subFilterChipActive: {
    backgroundColor: '#1D4ED8',
  },
  subFilterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    textTransform: 'capitalize',
  },
  subFilterTextActive: {
    color: '#FFFFFF',
  },
  infracoesList: {
    flex: 1,
    paddingTop: 8,
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 72,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderTopWidth: 2,
    borderTopColor: '#CBD5E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 8,
  },
  bottomBarButton: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  bottomBarUndoText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  specialButton: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  specialButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#92400E',
  },
  finishButton: {
    backgroundColor: '#047857',
    borderColor: '#047857',
  },
  finishButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
