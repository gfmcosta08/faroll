import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import DonoDashboard from '../components/DonoDashboard'
import CorretorDashboard from '../components/CorretorDashboard'
import SecretariaDashboard from '../components/SecretariaDashboard'

const PROFILE_LABELS: Record<string, string> = {
  gerente:    'Painel do Gerente',
  admin:      'Painel Admin',
  corretor:   'Meu Painel',
  secretaria: 'Painel Operacional',
}

export default function Dashboard() {
  const { user } = useAuth()
  const [data, setData]       = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const perfil   = user?.perfil ?? 'corretor'
  const endpoint =
    perfil === 'secretaria' ? '/api/dashboard/secretaria' :
    perfil === 'corretor'   ? '/api/dashboard/corretor'   :
                              '/api/dashboard/empresa'

  function carregar() {
    setLoading(true)
    api.get(endpoint)
      .then(r => { setData(r.data as Record<string, unknown>); setError(null) })
      .catch((e: { response?: { data?: { detail?: string } } }) =>
        setError(e.response?.data?.detail ?? 'Erro ao carregar dashboard'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { carregar() }, [perfil])

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white">{PROFILE_LABELS[perfil] ?? 'Dashboard'}</h1>
          <p className="text-slate-500 text-sm font-medium mt-0.5">
            Olá, {user?.nome}! Aqui está o resumo de hoje.
          </p>
        </div>
        <button onClick={carregar}
          className="text-xs font-black text-slate-500 hover:text-orange-400 bg-white/5 hover:bg-orange-500/10 border border-white/10 px-4 py-2 rounded-xl transition-all">
          Atualizar
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-600 font-bold text-sm animate-pulse">Carregando métricas...</div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-red-400 font-semibold text-sm">
          {error}
        </div>
      )}

      {!loading && !error && data && (
        <>
          {perfil === 'corretor'   && <CorretorDashboard   data={data} />}
          {perfil === 'secretaria' && <SecretariaDashboard data={data} />}
          {(perfil === 'gerente' || perfil === 'admin') && <DonoDashboard data={data} />}
        </>
      )}
    </div>
  )
}
