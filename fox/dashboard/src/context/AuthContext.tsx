import { createContext, useContext, useState, ReactNode } from 'react'
import api from '../api'

export interface AuthUser {
  corretor_id?: string
  nome: string
  email: string
  perfil: 'corretor' | 'secretaria' | 'gerente' | 'admin'
  access_token?: string
}

interface AuthContextType {
  user: AuthUser | null
  login: (email: string, senha: string) => Promise<AuthUser>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try { return JSON.parse(localStorage.getItem('fox_user') ?? 'null') } catch { return null }
  })

  async function login(email: string, senha: string): Promise<AuthUser> {
    const { data } = await api.post<AuthUser>('/api/auth/login', { email, senha })
    localStorage.setItem('fox_token', data.access_token ?? '')
    localStorage.setItem('fox_user', JSON.stringify(data))
    setUser(data)
    return data
  }

  function logout() {
    localStorage.removeItem('fox_token')
    localStorage.removeItem('fox_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
