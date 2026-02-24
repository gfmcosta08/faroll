import { useState, useEffect } from 'react'
import { Phone, Search, UserCheck } from 'lucide-react'
import api from '../api'
import Modal from '../components/Modal'
import LeadDetail from '../components/LeadDetail'

interface Lead {
  id: string
  nome?: string
  telefone?: string
  status_lead: string
  orcamento_max?: number
  data_primeiro_contato?: string
  corretor_id?: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  novo:           { label: 'Novo',           color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  em_atendimento: { label: 'Em Atendimento', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  visita:         { label: 'Visita',         color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  proposta:       { label: 'Proposta',       color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  fechado:        { label: 'Fechado',        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  perdido:        { label: 'Perdido',        color: 'text-red-400 bg-red-500/10 border-red-500/20' },
}

export default function Leads() {
  const [leads, setLeads]         = useState<Lead[]>([])
  const [search, setSearch]       = useState('')
  const [filtro, setFiltro]       = useState('todos')
  const [loading, setLoading]     = useState(true)
  const [assumindo, setAssumindo] = useState<string | null>(null)
  const [detalhe, setDetalhe]     = useState<{ open: boolean; lead: Lead | null }>({ open: false, lead: null })

  function carregar() {
    api.get<Lead[]>('/api/leads').then(r => setLeads(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { carregar() }, [])

  async function assumirLead(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    setAssumindo(id)
    try {
      await api.post(`/api/leads/${id}/assumir`)
      carregar()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
      alert(msg ?? 'Erro ao assumir lead')
    } finally {
      setAssumindo(null)
    }
  }

  const filtrados = leads.filter(l => {
    const matchSearch = l.nome?.toLowerCase().includes(search.toLowerCase()) || l.telefone?.includes(search)
    const matchFiltro = filtro === 'todos' || l.status_lead === filtro
    return matchSearch && matchFiltro
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input type="text" placeholder="Buscar lead por nome ou telefone..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-orange-500/50 text-sm"
          />
        </div>
        <select value={filtro} onChange={e => setFiltro(e.target.value)}
          className="bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500/50 text-slate-300">
          <option value="todos">Todos os status</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      <div className="bg-slate-900/50 border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-lg font-black flex items-center gap-3">
            <Phone className="text-orange-500" size={20} /> Leads
          </h3>
          <span className="text-xs font-bold text-orange-500 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
            {filtrados.length} leads
          </span>
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-600 font-bold">Carregando...</div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-16 text-slate-600 font-bold uppercase text-xs tracking-widest">
            Nenhum lead encontrado
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/[0.03]">
                <tr>
                  {['Nome', 'Telefone', 'Status', 'Orçamento', 'Primeiro Contato', 'Ação'].map(h => (
                    <th key={h} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtrados.map(lead => {
                  const st = STATUS_CONFIG[lead.status_lead] ?? STATUS_CONFIG.novo
                  const semCorretor = !lead.corretor_id && lead.status_lead === 'novo'
                  return (
                    <tr key={lead.id}
                      onClick={() => setDetalhe({ open: true, lead })}
                      className="hover:bg-white/[0.04] transition-colors group cursor-pointer">
                      <td className="px-6 py-5">
                        <div className="font-bold text-slate-200 group-hover:text-orange-400 transition-colors">
                          {lead.nome ?? 'Sem nome'}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-slate-400 font-semibold text-sm">{lead.telefone}</td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${st.color}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {st.label}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-slate-400 text-sm">
                        {lead.orcamento_max ? `R$ ${Number(lead.orcamento_max).toLocaleString()}` : '—'}
                      </td>
                      <td className="px-6 py-5 text-slate-500 text-sm">
                        {lead.data_primeiro_contato
                          ? new Date(lead.data_primeiro_contato).toLocaleDateString('pt-BR')
                          : '—'}
                      </td>
                      <td className="px-6 py-5">
                        {semCorretor && (
                          <button onClick={e => assumirLead(e, lead.id)} disabled={assumindo === lead.id}
                            className="flex items-center gap-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-black px-3 py-2 rounded-lg transition-all disabled:opacity-50">
                            <UserCheck size={14} />
                            {assumindo === lead.id ? 'Assumindo...' : 'Assumir'}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={detalhe.open}
        onClose={() => setDetalhe(d => ({ ...d, open: false }))}
        title="Detalhes do Lead"
      >
        {detalhe.lead && <LeadDetail lead={detalhe.lead} onUpdate={carregar} />}
      </Modal>
    </div>
  )
}
