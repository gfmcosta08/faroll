import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, Home, LogOut, UserCog } from 'lucide-react'
import { useAuth } from './context/AuthContext'
import { ReactNode } from 'react'

const navBase = [
  { to: '/',        label: 'Dashboard',     icon: LayoutDashboard, perfis: null as string[] | null },
  { to: '/leads',   label: 'Leads',         icon: Users,           perfis: null as string[] | null },
  { to: '/imoveis', label: 'Imóveis',       icon: Home,            perfis: null as string[] | null },
  { to: '/colaboradores', label: 'Colaboradores', icon: UserCog,   perfis: ['gerente', 'admin'] },
]

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() { logout(); navigate('/login') }

  const nav = navBase.filter(item =>
    !item.perfis || item.perfis.includes(user?.perfil ?? '')
  )

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      <aside className="w-64 bg-slate-900/50 border-r border-white/5 flex flex-col p-6 fixed h-full">
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-0.5 bg-orange-500 rounded-full" />
            <span className="text-orange-500 font-black text-[10px] uppercase tracking-[0.3em]">AI Platform</span>
          </div>
          <h1 className="text-3xl font-black tracking-tighter bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
            APP FOX
          </h1>
        </div>

        <nav className="space-y-1 flex-1">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all
                ${isActive
                  ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                  : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'}`
              }>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/5 pt-4">
          <div className="px-4 mb-3">
            <div className="text-sm font-bold text-slate-200">{user?.nome}</div>
            <div className="text-xs text-slate-500 capitalize">{user?.perfil}</div>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/5 font-bold text-sm transition-all">
            <LogOut size={18} /> Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-64 p-10">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
