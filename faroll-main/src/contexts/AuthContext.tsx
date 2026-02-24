import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth, AuthUser, AuthState, AppRole } from '@/hooks/useAuth';
import type { Session } from '@supabase/supabase-js';

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ success: boolean; error: string | null }>;
  signUp: (
    email: string,
    password: string,
    nome: string,
    role?: 'cliente' | 'profissional',
    additionalData?: Record<string, unknown>
  ) => Promise<{ success: boolean; error: string | null; userId?: string }>;
  signOut: () => Promise<{ success: boolean; error: string | null }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error: string | null }>;
  updateProfile: (data: Partial<{
    nome: string;
    telefone: string;
    cpf: string;
    pais: string;
    estado: string;
    cidade: string;
    avatar_url: string;
    profissao: string;
    especialidades: string[];
    tipo_atendimento: string;
    descricao: string;
    registro: string;
  }>) => Promise<{ success: boolean; error: string | null }>;
  isAuthenticated: boolean;
  clearLocalAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

// Re-exportar tipos úteis
export type { AuthUser, AuthState, AppRole, Session };
