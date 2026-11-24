import { create } from 'zustand';
import { getSupabaseClient, isMockSupabase } from '../../data/sync/supabaseClient';

interface UsuarioAuth {
  id: string;
  email: string;
  nome: string;
  organizacaoId: string;
}

interface AuthStoreState {
  autenticado: boolean;
  modoOffline: boolean;
  usuario: UsuarioAuth | null;
  ufPadrao: string;
  carregando: boolean;
  erro: string | null;

  iniciarModoOffline: () => void;
  loginOnline: (email: string, senha: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setUfPadrao: (uf: string) => void;
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  autenticado: true, // Inicia autenticado localmente para conveniência do MVP offline
  modoOffline: true,
  usuario: {
    id: 'inst_default',
    email: 'instrutor@simuladetran.local',
    nome: 'Instrutor Principal',
    organizacaoId: 'org_default',
  },
  ufPadrao: 'MA',
  carregando: false,
  erro: null,

  iniciarModoOffline: () => {
    set({
      autenticado: true,
      modoOffline: true,
      usuario: {
        id: 'inst_default',
        email: 'instrutor@simuladetran.local',
        nome: 'Instrutor Autônomo',
        organizacaoId: 'org_default',
      },
      erro: null,
    });
  },

  loginOnline: async (email: string, senha: string) => {
    set({ carregando: true, erro: null });
    try {
      if (isMockSupabase()) {
        // Mock de autenticação instantânea
        set({
          autenticado: true,
          modoOffline: false,
          usuario: {
            id: 'inst_mock_user',
            email,
            nome: email.split('@')[0],
            organizacaoId: 'org_default',
          },
          carregando: false,
        });
        return true;
      }

      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });

      if (error) throw error;

      set({
        autenticado: true,
        modoOffline: false,
        usuario: {
          id: data.user.id,
          email: data.user.email || email,
          nome: data.user.user_metadata?.nome || email.split('@')[0],
          organizacaoId: 'org_default',
        },
        carregando: false,
      });
      return true;
    } catch (e: any) {
      set({
        carregando: false,
        erro: e?.message || 'Falha ao autenticar.',
      });
      return false;
    }
  },

  logout: async () => {
    try {
      if (!isMockSupabase()) {
        await getSupabaseClient().auth.signOut();
      }
    } catch {}

    set({
      autenticado: false,
      modoOffline: false,
      usuario: null,
      erro: null,
    });
  },

  setUfPadrao: (uf: string) => set({ ufPadrao: uf.toUpperCase() }),
}));

