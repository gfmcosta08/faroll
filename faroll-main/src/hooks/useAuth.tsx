import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export type AppRole = "cliente" | "profissional" | "dependente" | "secretaria" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  nome: string;
  role: AppRole;
  profileId: string;
  avatarUrl?: string;
  /** Liberado pelo admin após contratação do Health-App */
  acessoHealthApp?: boolean;
  /** Liberado pelo admin após contratação do Fox Imobiliário */
  acessoFoxImobiliario?: boolean;
}

export interface AuthState {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  });

  // Ref para preservar o usuário atual — evita que o fallback sobrescreva o role correto
  const currentUserRef = useRef<AuthUser | null>(null);
  const originalSetState = setState;
  const setStateWithRef = useCallback((updater: any) => {
    originalSetState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (next.user) currentUserRef.current = next.user;
      return next;
    });
  }, [originalSetState]);

  const fetchUserData = useCallback(async (authUser: User): Promise<AuthUser | null> => {
    try {
      // Busca simplificada: Pega apenas o essencial
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, nome, email, avatar_url, acesso_health_app, acesso_fox_imobiliario")
        .eq("user_id", authUser.id)
        .maybeSingle();

      if (profileError) {
        console.error("[auth] Erro ao buscar perfil:", profileError.message);
        // Não barramos o login se houver erro de perfil, usamos dados da auth
      }

      // Busca roles
      const { data: rolesData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", authUser.id);

      if (roleError) {
        console.error("[auth] Erro ao buscar roles:", roleError.message);
      }

      const rolesPriority: AppRole[] = ["admin", "profissional", "secretaria", "dependente", "cliente"];
      const userRoles = rolesData?.map((r) => r.role as AppRole) || [];
      const role: AppRole = rolesPriority.find((r) => userRoles.includes(r)) || "cliente";

      return {
        id: authUser.id,
        email: authUser.email || "",
        nome: profile?.nome || authUser.user_metadata?.nome || authUser.email?.split('@')[0] || "Usuário",
        role,
        profileId: profile?.id || authUser.id,
        avatarUrl: profile?.avatar_url,
        acessoHealthApp: profile?.acesso_health_app ?? false,
        acessoFoxImobiliario: profile?.acesso_fox_imobiliario ?? false,
      };
    } catch (error) {
      console.error("[auth] Erro crítico no fetchUserData:", error);
      return null;
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Se a busca de perfil demorar mais de 3s, liberamos o login com dados básicos
        const userDataTimeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3500));
        const userDataPromise = fetchUserData(session.user);

        const userData = await Promise.race([userDataPromise, userDataTimeout]);

        if (userData) {
          setStateWithRef({ user: userData, session, loading: false, error: null });
        } else {
          // Fallback: preserva o role atual se já tiver um usuário carregado
          const fallbackUser: AuthUser = currentUserRef.current
            ? { ...currentUserRef.current, session: undefined as any }
            : {
                id: session.user.id,
                email: session.user.email || "",
                nome: session.user.user_metadata?.nome || "Usuário",
                role: (session.user.user_metadata?.role as AppRole) || "cliente",
                profileId: session.user.id,
              };
          setStateWithRef({ user: fallbackUser, session, loading: false, error: null });
        }
      } else {
        setState({ user: null, session: null, loading: false, error: null });
      }
    } catch (err) {
      console.error("[auth] Erro crítico na sessão:", err);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [fetchUserData]);

  useEffect(() => {
    // 1. Timeout de Segurança Global: Se demorar mais de 4s, libera a tela de qualquer jeito
    const safetyTimeout = setTimeout(() => {
      setState(prev => prev.loading ? { ...prev, loading: false } : prev);
    }, 4000);

    // 2. Verificar sessão atual
    refreshSession().finally(() => clearTimeout(safetyTimeout));

    // 3. Ouvir mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[auth] Evento de autenticação:", event);

      // Eventos silenciosos (troca de aba, refresh de token): só atualiza a sessão,
      // sem re-buscar dados do usuário para evitar re-render/loading visível
      const silentEvents = ["TOKEN_REFRESHED", "USER_UPDATED"];
      if (silentEvents.includes(event)) {
        setState(prev => ({ ...prev, session }));
        return;
      }

      if (session?.user) {
        // Se mudou de estado (ex: login feito), garantimos que o loading apareça enquanto buscamos dados
        setState(prev => ({ ...prev, session, loading: true }));

        const userDataTimeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000));
        const userDataPromise = fetchUserData(session.user);
        const userData = await Promise.race([userDataPromise, userDataTimeout]);

        if (userData) {
          setStateWithRef({ session, user: userData, loading: false, error: null });
        } else {
          // Fallback: preserva o role atual se já tiver um usuário carregado
          const fallbackUser: AuthUser = currentUserRef.current
            ? { ...currentUserRef.current }
            : {
                id: session.user.id,
                email: session.user.email || "",
                nome: session.user.user_metadata?.nome || "Usuário",
                role: (session.user.user_metadata?.role as AppRole) || "cliente",
                profileId: session.user.id,
              };
          setStateWithRef({ session, user: fallbackUser, loading: false, error: null });
        }
      } else {
        setState({ session: null, user: null, loading: false, error: null });
      }
    });

    return () => {
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, [fetchUserData, refreshSession]);

  const signIn = async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        // Se o erro for de sessão ou token, limpamos o local storage como segurança
        if (error.message.includes("session") || error.message.includes("token")) {
          localStorage.clear();
        }
        throw error;
      }

      return { success: true, error: null };
    } catch (err: any) {
      setState(prev => ({ ...prev, loading: false, error: err.message }));
      return { success: false, error: err.message };
    }
  };

  const signUp = async (email: string, password: string, nome: string, role: AppRole = "cliente", additionalData: any = {}) => {
    try {
      // 1. Criar conta no Auth
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nome, role } }
      });

      if (authError) throw authError;
      if (!data.user) throw new Error("Falha ao criar usuário");

      // 2. Criar perfil (silenciosamente - se falhar por colunas faltantes, o login ainda funcionará via metadata)
      try {
        await supabase.from("profiles").upsert({
          user_id: data.user.id,
          nome,
          email,
          perfil_ativo: true,
          ...additionalData
        }, { onConflict: 'user_id' });

        await supabase.from("user_roles").upsert({
          user_id: data.user.id,
          role
        }, { onConflict: 'user_id,role' });
      } catch (pErr) {
        console.warn("[auth] Erro ao criar perfil/role nas tabelas, mas conta criada:", pErr);
      }

      return { success: true, error: null, userId: data.user.id };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const signInWithGoogle = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          scopes: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly',
          redirectTo: window.location.origin,
        }
      });
      if (error) throw error;
      return { success: true, error: null };
    } catch (err: any) {
      setState(prev => ({ ...prev, loading: false, error: err.message }));
      return { success: false, error: err.message };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    return { success: true, error: null };
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const updateProfile = async (data: any) => {
    if (!state.user) return { success: false, error: "Usuário não logado" };
    try {
      const { error } = await supabase
        .from("profiles")
        .update(data)
        .eq("user_id", state.user.id);

      if (error) throw error;
      await refreshSession();
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const clearLocalAuth = useCallback(() => {
    localStorage.clear();
    window.location.reload();
  }, []);

  return {
    ...state,
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    isAuthenticated: !!state.session,
    clearLocalAuth
  };
};
