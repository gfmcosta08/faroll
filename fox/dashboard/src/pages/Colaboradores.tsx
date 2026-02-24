import { useState, useEffect, FormEvent } from 'react'
import { Users, Plus, Search, UserCheck, UserX } from 'lucide-react'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'
import CorretorPerfil from '../components/CorretorPerfil'

interface Colaborador {
  id: string
  nome: string
  email: string
  telefone?: string
  perfil: string
  ativo: boolean
  corretor_id?: string
}

interface ColaboradorForm {
  nome: string
  email: string
  telefone: string
  senha: string
  perfil: string
}

const PERFIL_CONF: Record<string, { label: string; color: string }> = {
  gerente:    { label: 'Gerente',    color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  corretor:   { label: 'Corretor',   color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  secretaria: { label: 'Secretária', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  admin:      { label: 'Admin',      color: 'text-red-400 bg-red-500/10 border-red-500/20' },
}

const FORM_VAZIO: ColaboradorForm = { nome: '', email: '', telefone: '', senha: '', perfil: 'corretor' }

const inputClass = "w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500/50 text-white"
const selectClass = "w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none text-slate-200"

export default function Colaboradores() {
  const { user } = useAuth()
  const isGerente = user?.perfil === 'gerente' || user?.perfil === 'admin'

  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [search,        setSearch]        = useState('')
  const [loading,       setLoading]       = useState(true)
  const [showForm,      setShowForm]      = useState(false)
  const [form,          setForm]          = useState<ColaboradorForm>(FORM_VAZIO)
  const [salvando,      setSalvando]      = useState(false)
  const [detalhe,       setDetalhe]       = useState<{ open: boolean; id: string | null; nome: string }>({ open: false, id: null, nome: '' })

  function carregar() {
    api.get<Colaborador[]>('/api/corretores').then(r => setColaboradores(r.data)).finally(() => setLoading(false))
  }
  useEffect(() => { carregar() }, [])

  const set = (k: keyof ColaboradorForm, v: string) => setForm(p => ({ ...p, [k]: v }))

  async function salvar(e: FormEvent) {
    e.preventDefault()
    setSalvando(true)
    try {
      await api.post('/api/corretores', form)
      setShowForm(false)
      setForm(FORM_VAZIO)
      carregar()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
      alert(msg ?? 'Erro ao criar colaborador')
    } finally {
      setSalvando(false)
    }
  }

  async function desativar(id: string) {
    if (!confirm('Desativar este colaborador?')) return
    try {
      await api.put(`/api/corretores/${id}/desativar`)
      carregar()
    } catch {
      alert('Erro ao desativar')
    }
  }

  const filtrados = colaboradores.filter(c =>
    c.nome?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input type="text" placeholder="Buscar colaborador..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-orange-500/50 text-sm" />
        </div>
        {isGerente && (
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-black px-5 py-3 rounded-xl text-sm transition-all">
            <Plus size={18} /> Novo Colaborador
          </button>
        )}
      </div>

      {showForm && isGerente && (
        <form onSubmit={salvar} className="bg-slate-900/50 border border-orange-500/20 rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-black text-orange-400 mb-2">Novo Colaborador</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Nome *</label>
              <input required type="text" value={form.nome} onChange={e => set('nome', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">E-mail *</label>
              <input required type="email" value={form.email} onChange={e => set('email', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Telefone</label>
              <input type="text" value={form.telefone} onChange={e => set('telefone', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Senha *</label>
              <input required type="password" value={form.senha} onChange={e => set('senha', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Perfil</label>
              <select value={form.perfil} onChange={e => set('perfil', e.target.value)} className={selectClass}>
                <option value="corretor">Corretor</option>
                <option value="secretaria">Secretária</option>
                <option value="gerente">Gerente</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={salvando}
              className="bg-orange-500 hover:bg-orange-400 text-white font-black px-6 py-3 rounded-xl text-sm disabled:opacity-50">
              {salvando ? 'Salvando...' : 'Criar Colaborador'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setForm(FORM_VAZIO) }}
              className="bg-slate-800 text-slate-400 font-bold px-6 py-3 rounded-xl text-sm hover:bg-slate-700">
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(PERFIL_CONF).map(([k, v]) => {
          const count = colaboradores.filter(c => c.perfil === k && c.ativo).length
          if (count === 0) return null
          return (
            <div key={k} className="bg-slate-900/50 border border-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl font-black text-white">{count}</div>
              <span className={`inline-block mt-1 text-[10px] font-black px-2 py-0.5 rounded-full border ${v.color}`}>{v.label}</span>
            </div>
          )
        })}
      </div>

      <div className="bg-slate-900/50 border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-white/5 flex items-center gap-3">
          <Users size={18} className="text-orange-500" />
          <span className="font-black text-slate-200">Colaboradores</span>
          <span className="ml-auto text-xs font-black text-orange-500 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
            {filtrados.length} pessoas
          </span>
        </div>

        {loading ? (
          <div className="text-center py-14 text-slate-600 font-bold">Carregando...</div>
        ) : (
          <table className="w-full">
            <thead className="bg-white/[0.03]">
              <tr>
                {['Nome', 'E-mail', 'Telefone', 'Perfil', 'Status', isGerente ? 'Ações' : ''].map(h => (
                  <th key={h} className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtrados.map(c => {
                const pc = PERFIL_CONF[c.perfil] ?? PERFIL_CONF.corretor
                return (
                  <tr key={c.id}
                    onClick={() => setDetalhe({ open: true, id: c.id, nome: c.nome })}
                    className="hover:bg-white/[0.04] cursor-pointer transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                          <span className="text-sm font-black text-orange-400">{c.nome?.charAt(0)}</span>
                        </div>
                        <span className="font-bold text-slate-200 group-hover:text-orange-400 transition-colors">{c.nome}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-400 text-sm">{c.email}</td>
                    <td className="px-5 py-4 text-slate-500 text-sm">{c.telefone ?? '—'}</td>
                    <td className="px-5 py-4">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${pc.color}`}>{pc.label}</span>
                    </td>
                    <td className="px-5 py-4">
                      {c.ativo
                        ? <span className="flex items-center gap-1 text-xs text-emerald-400"><UserCheck size={13} /> Ativo</span>
                        : <span className="flex items-center gap-1 text-xs text-red-400"><UserX size={13} /> Inativo</span>
                      }
                    </td>
                    {isGerente && (
                      <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                        {c.ativo && c.id !== user?.corretor_id && (
                          <button onClick={() => desativar(c.id)}
                            className="text-xs text-slate-600 hover:text-red-400 font-bold transition-colors border border-white/10 hover:border-red-500/30 px-3 py-1.5 rounded-lg">
                            Desativar
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                )
              })}
              {filtrados.length === 0 && (
                <tr><td colSpan={6} className="py-10 text-center text-slate-600 text-xs font-bold uppercase tracking-widest">Nenhum colaborador</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={detalhe.open}
        onClose={() => setDetalhe(d => ({ ...d, open: false }))}
        title={`Produtividade — ${detalhe.nome}`}
        wide
      >
        {detalhe.id && <CorretorPerfil corretorId={detalhe.id} />}
      </Modal>
    </div>
  )
}
