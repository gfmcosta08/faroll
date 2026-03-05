import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '../lib/supabase'

export interface AuthUser {
  corretor_id?: string
  nome: string
  email: string
  perfil: 'corretor' | 'secretaria' | 'gerente' | 'admin'
  access_token?: string
}

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  login: (email: string, senha: string) => Promise<AuthUser>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

const PERFIL_MAP: Record<string, AuthUser['perfil']> = {
  dono_imobiliaria: 'admin',
  gerente:          'gerente',
  corretor:         'corretor',
  secretaria:       'secretaria',
}

async function buildAuthUser(userId: string, accessToken: string): Promise<AuthUser | null> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('nome, email, role')
    .eq('user_id', userId)
    .single()

  if (!profile) return null

  // Busca o corretor_id vinculado ao user, se existir
  const { data: corretor } = await supabase
    .from('corretores')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  return {
    corretor_id:  corretor?.id,
    nome:         profile.nome  ?? '',
    email:        profile.email ?? '',
    perfil:       PERFIL_MAP[profile.role] ?? 'corretor',
    access_token: accessToken,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]         = useState<AuthUser | null>(null)
  const [isLoading, setLoading] = useState(true)

  useEffect(() => {
    // Inicializa a partir da sessão existente (localStorage do Supabase)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const u = await buildAuthUser(session.user.id, session.access_token)
        setUser(u)
      }
      setLoading(false)
    })

    // Escuta mudanças de auth (login, logout, refresh de token)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_, session) => {
        if (session) {
          const u = await buildAuthUser(session.user.id, session.access_token)
          setUser(u)
        } else {
          setUser(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function login(email: string, senha: string): Promise<AuthUser> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    })

    if (error || !data.session) {
      throw new Error(error?.message ?? 'Login falhou')
    }

    const profile = await buildAuthUser(data.user.id, data.session.access_token)
    if (!profile) throw new Error('Perfil não encontrado no Faroll Imóveis')

    setUser(profile)
    return profile
  }

  async function logout() {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
