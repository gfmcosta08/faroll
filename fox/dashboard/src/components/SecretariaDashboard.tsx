import { useState, useEffect, useCallback } from 'react'
import { Users, Bot, AlertTriangle, Calendar, CheckSquare, RefreshCw, UserCheck } from 'lucide-react'
import api from '../api'
import StatCard from './StatCard'

interface SecretariaDashboardProps {
  data: Record<string, unknown>
}

interface LeadBot {
  id: string
  nome?: string
  telefone?: string
  status_lead: string
  bot_ativo?: boolean | null
  ultima_interacao?: string
  reativa_em?: number | null
  bot_desativado_por?: string
}

const STATUS_CONF: Record<string, { label: string; color: string }> = {
  novo:           { label: 'Novos',          color: 'text-orange-400 bg-orange-500/10' },
  em_atendimento: { label: 'Em Atendimento', color: 'text-blue-400 bg-blue-500/10' },
  visita:         { label: 'Em Visita',      color: 'text-purple-400 bg-purple-500/10' },
  proposta:       { label: 'Em Proposta',    color: 'text-yellow-400 bg-yellow-500/10' },
  fechado:        { label: 'Fechados',       color: 'text-emerald-400 bg-emerald-500/10' },
  perdido:        { label: 'Perdidos',       color: 'text-red-400 bg-red-500/10' },
}

function BotToggle({ leadId, botAtivo, onToggle, loading }: {
  leadId: string; botAtivo: boolean; onToggle: (id: string, ativo: boolean) => void; loading: boolean
}) {
  return (
    <button
      onClick={() => onToggle(leadId, botAtivo)}
      disabled={loading}
      className={`relative flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-black transition-all select-none
        ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105 active:scale-95'}
        ${botAtivo
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
          : 'bg-slate-700/50 border-slate-600/50 text-slate-400 hover:bg-slate-700'
        }`}
    >
      <span className={`w-2 h-2 rounded-full ${botAtivo ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
      {botAtivo ? <><Bot size={12} /> Bot Ativo</> : <><UserCheck size={12} /> Humano</>}
    </button>
  )
}

function LeadRow({ lead, onToggle, toggling }: { lead: LeadBot; onToggle: (id: string, ativo: boolean) => void; toggling: string | null }) {
  const st = STATUS_CONF[lead.status_lead] ?? STATUS_CONF.novo
  const botAtivo = lead.bot_ativo !== false

  const tempoStr = (() => {
    if (!lead.ultima_interacao) return '—'
    try {
      const diff = Date.now() - new Date(lead.ultima_interacao).getTime()
      const min  = Math.floor(diff / 60000)
      if (min < 60) return `${min} min atrás`
      const h = Math.floor(min / 60)
      if (h < 24)   return `${h}h atrás`
      return `${Math.floor(h / 24)}d atrás`
    } catch { return '—' }
  })()

  return (
    <tr className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${!botAtivo ? 'bg-blue-500/[0.02]' : ''}`}>
      <td className="px-5 py-4">
        <div className="font-bold text-slate-200 text-sm">{lead.nome ?? lead.telefone}</div>
        {lead.nome && <div className="text-xs text-slate-600">{lead.telefone}</div>}
      </td>
      <td className="px-5 py-4">
        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${st.color}`}>{st.label}</span>
      </td>
      <td className="px-5 py-4 text-slate-500 text-xs font-medium">{tempoStr}</td>
      <td className="px-5 py-4">
        {!botAtivo && lead.reativa_em != null && (
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <RefreshCw size={10} className="text-slate-600" />
            {lead.reativa_em > 0
              ? `reativa em ~${lead.reativa_em} min`
              : <span className="text-orange-400">reativando...</span>
            }
          </div>
        )}
        {!botAtivo && lead.bot_desativado_por && (
          <div className="text-[10px] text-slate-600 mt-0.5">por {lead.bot_desativado_por}</div>
        )}
      </td>
      <td className="px-5 py-4">
        <BotToggle leadId={lead.id} botAtivo={botAtivo} onToggle={onToggle} loading={toggling === lead.id} />
      </td>
    </tr>
  )
}

export default function SecretariaDashboard({ data }: SecretariaDashboardProps) {
  const hoje    = (data?.hoje                      ?? {}) as Record<string, unknown>
  const dist    = (data?.distribuicao_por_corretor  ?? []) as Array<Record<string, unknown>>
  const semResp = (data?.leads_sem_responsavel      ?? []) as Array<Record<string, unknown>>
  const status  = (data?.resumo_status              ?? {}) as Record<string, number>
  const maxTotal = Math.max(...dist.map(d => Number(d.total ?? 0)), 1)

  const [leads,      setLeads]      = useState<LeadBot[]>([])
  const [toggling,   setToggling]   = useState<string | null>(null)
  const [loadingBot, setLoadingBot] = useState(true)
  const [filtro,     setFiltro]     = useState('todos')

  const carregarLeads = useCallback(async () => {
    try {
      const r = await api.get<LeadBot[]>('/api/leads/bot-status')
      setLeads(r.data)
    } catch (e) {
      console.error('Erro bot-status', e)
    } finally {
      setLoadingBot(false)
    }
  }, [])

  useEffect(() => {
    carregarLeads()
    const interval = setInterval(carregarLeads, 30000)
    return () => clearInterval(interval)
  }, [carregarLeads])

  async function toggleBot(leadId: string, botAtivo: boolean) {
    setToggling(leadId)
    try {
      await api.post(`/api/leads/${leadId}/bot/toggle`)
      setLeads(prev => prev.map(l =>
        l.id === leadId
          ? { ...l, bot_ativo: !botAtivo, reativa_em: !botAtivo ? null : 10, bot_desativado_por: !botAtivo ? undefined : 'Você' }
          : l
      ))
    } catch {
      alert('Erro ao alterar status do bot')
    } finally {
      setToggling(null)
    }
  }

  const leadsFiltrados = leads.filter(l => {
    if (filtro === 'bot_ativo') return l.bot_ativo !== false
    if (filtro === 'bot_off')   return l.bot_ativo === false
    return true
  })

  const botAtivos = leads.filter(l => l.bot_ativo !== false).length
  const botOff    = leads.filter(l => l.bot_ativo === false).length

  return (
    <div className="space-y-10">
      <div>
        <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-400 mb-4">
          <Calendar size={16} className="text-orange-500" /> Hoje
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Leads Novos Hoje"             value={Number(hoje.leads_novos ?? 0)}                  icon={Users}       color="orange" />
          <StatCard title="Fora Horário Sem Responsável" value={Number(hoje.leads_fora_horario_sem_resp ?? 0)}  icon={Bot}         color="red"    sub="aguardando corretor" />
          <StatCard title="Visitas Agendadas"             value={Number(hoje.visitas_agendadas ?? 0)}           icon={Calendar}    color="purple" />
          <StatCard title="Propostas Ativas"             value={Number(hoje.propostas_ativas ?? 0)}             icon={CheckSquare} color="emerald" />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-400">
            <Bot size={16} className="text-orange-500" /> Controle do Atendimento — Bot por Lead
          </h2>
          <button onClick={carregarLeads}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-orange-400 transition-colors">
            <RefreshCw size={12} /> Atualizar
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-4 text-center cursor-pointer hover:border-emerald-500/30 transition-all"
            onClick={() => setFiltro('bot_ativo')}>
            <div className="text-2xl font-black text-emerald-400">{botAtivos}</div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1 flex items-center justify-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" /> Bot Ativo
            </div>
          </div>
          <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 text-center cursor-pointer hover:border-orange-500/20 transition-all"
            onClick={() => setFiltro('bot_off')}>
            <div className="text-2xl font-black text-slate-300">{botOff}</div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1 flex items-center justify-center gap-1">
              <UserCheck size={10} className="text-blue-400" /> Humano Ativo
            </div>
          </div>
          <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 text-center cursor-pointer hover:border-orange-500/20 transition-all"
            onClick={() => setFiltro('todos')}>
            <div className="text-2xl font-black text-white">{leads.length}</div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Total de Conversas</div>
          </div>
        </div>

        <div className="flex items-start gap-3 bg-blue-500/5 border border-blue-500/15 rounded-xl px-4 py-3 mb-4">
          <Bot size={16} className="text-blue-400 mt-0.5 shrink-0" />
          <p className="text-xs text-slate-400 leading-relaxed">
            <strong className="text-slate-200">Como funciona:</strong> O bot responde automaticamente todos os leads.
            Quando você vir uma conversa acontecendo, pode <strong className="text-emerald-400">desligar o bot</strong> e assumir manualmente.
            Se ficar <strong className="text-orange-400">10 minutos sem resposta</strong>, o bot volta a responder sozinho.
          </p>
        </div>

        <div className="flex gap-2 mb-3">
          {([['todos','Todos'], ['bot_ativo','Bot Ativo'], ['bot_off','Humano Ativo']] as [string, string][]).map(([v, l]) => (
            <button key={v} onClick={() => setFiltro(v)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all
                ${filtro === v ? 'bg-orange-500/20 border-orange-500/40 text-orange-400' : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-300'}`}>
              {l}
            </button>
          ))}
        </div>

        <div className="bg-slate-900/50 border border-white/10 rounded-2xl overflow-hidden">
          {loadingBot ? (
            <div className="text-center py-10 text-slate-600 text-sm font-bold animate-pulse">Carregando conversas...</div>
          ) : leadsFiltrados.length === 0 ? (
            <div className="text-center py-10 text-slate-600 text-xs font-bold uppercase tracking-widest">Nenhuma conversa encontrada</div>
          ) : (
            <table className="w-full">
              <thead className="bg-white/[0.03]">
                <tr>
                  {['Lead', 'Status', 'Última atividade', 'Info', 'Controle do Bot'].map(h => (
                    <th key={h} className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leadsFiltrados.map(lead => (
                  <LeadRow key={lead.id} lead={lead} onToggle={toggleBot} toggling={toggling} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div>
        <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-400 mb-4">
          <Users size={16} className="text-blue-500" /> Pipeline Geral
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {Object.entries(STATUS_CONF).map(([k, v]) => (
            <div key={k} className="bg-slate-900/50 border border-white/10 rounded-2xl p-4 text-center">
              <div className="text-2xl font-black text-white">{status[k] ?? 0}</div>
              <span className={`inline-block mt-2 text-[10px] font-black px-2 py-0.5 rounded-full ${v.color}`}>{v.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-400 mb-4">
          <Users size={16} className="text-purple-500" /> Fila por Corretor
        </h2>
        <div className="bg-slate-900/50 border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-white/[0.03]">
              <tr>
                {['Corretor', 'Total', 'Novos', 'Atendimento', 'Visita', 'Proposta', ''].map(h => (
                  <th key={h} className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {dist.map(c => (
                <tr key={String(c.id)} className={`hover:bg-white/[0.03] ${Number(c.total ?? 0) > 10 ? 'border-l-2 border-red-500/50' : ''}`}>
                  <td className="px-5 py-4 font-bold text-slate-200">{String(c.nome ?? '')}</td>
                  <td className="px-5 py-4 font-black text-white">{String(c.total ?? 0)}</td>
                  <td className="px-5 py-4 text-orange-400 font-semibold text-sm">{String(c.novo ?? 0)}</td>
                  <td className="px-5 py-4 text-blue-400 font-semibold text-sm">{String(c.em_atendimento ?? 0)}</td>
                  <td className="px-5 py-4 text-purple-400 font-semibold text-sm">{String(c.visita ?? 0)}</td>
                  <td className="px-5 py-4 text-yellow-400 font-semibold text-sm">{String(c.proposta ?? 0)}</td>
                  <td className="px-5 py-4">
                    <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${Number(c.total ?? 0) > 10 ? 'bg-red-500' : 'bg-orange-500'}`}
                        style={{ width: `${Math.round((Number(c.total ?? 0) / maxTotal) * 100)}%` }} />
                    </div>
                  </td>
                </tr>
              ))}
              {dist.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-600 text-sm">Sem corretores ativos</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {semResp.length > 0 && (
        <div>
          <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-400 mb-4">
            <AlertTriangle size={16} className="text-red-500" /> Sem Responsável ({semResp.length})
          </h2>
          <div className="bg-slate-900/50 border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-white/[0.03]">
                <tr>
                  {['Lead', 'Status', 'Chegou em', 'Origem'].map(h => (
                    <th key={h} className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {semResp.map(l => (
                  <tr key={String(l.id)} className="hover:bg-white/[0.03]">
                    <td className="px-5 py-4 font-bold text-slate-200">{String(l.nome ?? '')}</td>
                    <td className="px-5 py-4">
                      <span className="text-xs text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full capitalize">
                        {String(l.status ?? '').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500 text-sm">
                      {l.data ? new Date(String(l.data)).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                    </td>
                    <td className="px-5 py-4">
                      {l.fora_horario
                        ? <span className="text-xs text-blue-400 flex items-center gap-1"><Bot size={12} /> Bot (fora horário)</span>
                        : <span className="text-xs text-slate-600">Horário comercial</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
