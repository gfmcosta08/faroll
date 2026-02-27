import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate   = useNavigate()
  const [email, setEmail]     = useState('')
  const [senha, setSenha]     = useState('')
  const [erro,  setErro]      = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)
    try {
      await login(email, senha)
      navigate('/')
    } catch {
      setErro('Email ou senha inválidos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="w-12 h-1 bg-orange-500 rounded-full" />
            <span className="text-orange-500 font-black text-sm uppercase tracking-[0.3em]">Virtual Assistant</span>
            <span className="w-12 h-1 bg-orange-500 rounded-full" />
          </div>
          <h1 className="text-6xl font-black tracking-tighter bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
            Fox Imobiliário
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Automação para corretores e imobiliárias</p>
        </div>

        <form onSubmit={handleSubmit}
          className="bg-slate-900/50 border border-white/10 rounded-3xl p-8 backdrop-blur">
          <h2 className="text-xl font-black text-white mb-6">Entrar na plataforma</h2>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Email</label>
              <input
                type="email" required value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500/50 transition-all text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Senha</label>
              <input
                type="password" required value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500/50 transition-all text-sm"
              />
            </div>
          </div>

          {erro && (
            <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm font-medium">
              {erro}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full mt-6 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-black rounded-xl py-4 transition-all text-sm uppercase tracking-widest">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
