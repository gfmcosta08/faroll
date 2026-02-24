import { DollarSign, Users, Building2, AlertTriangle, Clock, TrendingUp, Bot } from 'lucide-react'
import StatCard from './StatCard'

interface CorretorDashboardProps {
  data: Record<string, unknown>
}

const R$ = (v: unknown) => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`

const STATUS_CONF: Record<string, { label: string; color: 'orange' | 'blue' | 'purple' | 'emerald' | 'red' }> = {
  novo:           { label: 'Novos',           color: 'orange' },
  em_atendimento: { label: 'Em Atendimento',  color: 'blue' },
  visita:         { label: 'Visita',          color: 'purple' },
  proposta:       { label: 'Proposta',        color: 'emerald' },
  fechado:        { label: 'Fechados',        color: 'emerald' },
  perdido:        { label: 'Perdidos',        color: 'red' },
}

export default function CorretorDashboard({ data }: CorretorDashboardProps) {
  const perf    = (data?.performance      ?? {}) as Record<string, unknown>
  const statusL = (data?.leads_por_status ?? {}) as Record<string, number>
  const alertas = (data?.alertas          ?? []) as Array<Record<string, unknown>>
  const mim     = (data?.meus_imoveis     ?? {}) as Record<string, unknown>

  return (
    <div className="space-y-10">
      <div>
        <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-400 mb-4">
          <Users size={16} className="text-orange-500" /> Meus Leads
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {Object.entries(STATUS_CONF).map(([k, v]) => (
            <StatCard key={k} title={v.label} value={statusL[k] ?? 0} color={v.color} />
          ))}
        </div>

        {Number(data?.leads_fora_horario ?? 0) > 0 && (
          <div className="mt-4 flex items-center gap-3 bg-orange-500/5 border border-orange-500/15 rounded-xl px-5 py-3">
            <Bot size={16} className="text-orange-400" />
            <span className="text-sm text-slate-300">
              <span className="font-black text-orange-400">{String(data.leads_fora_horario)}</span> leads chegaram fora do horário comercial e foram atendidos pelo bot
            </span>
          </div>
        )}
      </div>

      <div>
        <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-400 mb-4">
          <DollarSign size={16} className="text-emerald-500" /> Minha Performance
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Vendas no Mês"      value={Number(perf.vendas_mes ?? 0)}     icon={TrendingUp} color="orange" />
          <StatCard title="Comissão no Mês"    value={R$(perf.comissao_mes)}             icon={DollarSign} color="emerald" />
          <StatCard title="Comissão Acumulada" value={R$(perf.comissao_total)}           icon={DollarSign} color="emerald" sub="total histórico" />
          <StatCard title="Ticket Médio"       value={R$(perf.ticket_medio)}             icon={TrendingUp} color="purple" />
          <StatCard title="Taxa de Conversão"
            value={`${perf.conversao_pct ?? 0}%`} icon={TrendingUp} color="blue"
            sub={`${perf.leads_fechados ?? 0} de ${perf.total_leads ?? 0} leads`} />
        </div>
      </div>

      <div>
        <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-400 mb-4">
          <AlertTriangle size={16} className="text-red-500" /> Alertas — Leads Parados
        </h2>
        {alertas.length === 0 ? (
          <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-2xl p-6 text-center">
            <p className="text-emerald-400 font-bold text-sm">Nenhum lead parado! Tudo em dia.</p>
          </div>
        ) : (
          <div className="bg-slate-900/50 border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-white/[0.03]">
                <tr>
                  {['Lead', 'Status', 'Parado há'].map(h => (
                    <th key={h} className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {alertas.map(a => (
                  <tr key={String(a.lead_id)} className="hover:bg-white/[0.03]">
                    <td className="px-6 py-4 font-bold text-slate-200">{String(a.nome ?? '')}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-400 capitalize">
                        {String(a.status ?? '').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`flex items-center gap-1.5 text-sm font-black ${
                        Number(a.horas_parado) >= 72 ? 'text-red-400' :
                        Number(a.horas_parado) >= 48 ? 'text-orange-400' : 'text-yellow-400'
                      }`}>
                        <Clock size={14} />
                        {Number(a.horas_parado) >= 24
                          ? `${Math.floor(Number(a.horas_parado) / 24)} dia(s)`
                          : `${a.horas_parado}h`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-400 mb-4">
          <Building2 size={16} className="text-blue-500" /> Meus Imóveis
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <StatCard title="Total Cadastrados" value={Number(mim.total ?? 0)}   color="slate" />
          <StatCard title="Disponíveis"        value={Number(mim.ativos ?? 0)} color="emerald" icon={Building2} />
          <StatCard title="Vendidos"           value={Number(mim.vendidos ?? 0)} color="orange" icon={TrendingUp} />
        </div>
      </div>
    </div>
  )
}
