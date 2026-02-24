import { useState, useEffect } from 'react'
import { DollarSign, Users, Building2, AlertTriangle, Clock, TrendingUp } from 'lucide-react'
import api from '../api'

interface CorretorPerfilProps {
  corretorId: string
}

type ColorKey = 'orange' | 'emerald' | 'blue' | 'red' | 'purple' | 'slate' | 'yellow'

const colorMap: Record<string, string> = {
  orange:  'text-orange-400',
  emerald: 'text-emerald-400',
  blue:    'text-blue-400',
  red:     'text-red-400',
  purple:  'text-purple-400',
  slate:   'text-slate-400',
  yellow:  'text-yellow-400',
}

const R$ = (v: unknown) => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`
const pct = (v: unknown) => `${v ?? 0}%`

function Row({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value === null || value === undefined) return null
  return (
    <div className="flex justify-between py-2 border-b border-white/5 last:border-0">
      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{label}</span>
      <span className="text-sm font-bold text-slate-200">{String(value)}</span>
    </div>
  )
}

function MiniCard({ title, value, color = 'orange' }: { title: string; value: string | number; color?: string }) {
  return (
    <div className="bg-slate-800/50 rounded-xl p-4 text-center">
      <div className={`text-xl font-black ${colorMap[color] ?? colorMap.orange}`}>{value}</div>
      <div className="text-[10px] font-black text-slate-600 uppercase tracking-wider mt-1">{title}</div>
    </div>
  )
}

export default function CorretorPerfil({ corretorId }: CorretorPerfilProps) {
  const [data, setData]       = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro]       = useState<string | null>(null)

  useEffect(() => {
    if (!corretorId) return
    setLoading(true)
    api.get(`/api/corretores/${corretorId}/metricas`)
      .then(r => { setData(r.data as Record<string, unknown>); setErro(null) })
      .catch(() => setErro('Erro ao carregar métricas'))
      .finally(() => setLoading(false))
  }, [corretorId])

  if (loading) return <div className="text-center py-16 text-slate-600 font-bold animate-pulse">Carregando...</div>
  if (erro)    return <div className="text-red-400 text-sm p-4">{erro}</div>
  if (!data)   return null

  const corretor   = (data.corretor   ?? {}) as Record<string, unknown>
  const imoveis    = (data.imoveis    ?? {}) as Record<string, unknown>
  const financeiro = (data.financeiro ?? {}) as Record<string, unknown>
  const leads      = (data.leads      ?? {}) as Record<string, unknown>
  const alertas    = (data.alertas    ?? []) as Array<Record<string, unknown>>
  const perdidos   = (data.perdidos_com_motivo ?? []) as Array<Record<string, unknown>>
  const porStatus  = (leads.por_status ?? {}) as Record<string, number>

  const statusLeads: [string, number, string][] = [
    ['Novos',          porStatus.novo,           'orange'],
    ['Em Atendimento', porStatus.em_atendimento, 'blue'],
    ['Em Visita',      porStatus.visita,         'purple'],
    ['Em Proposta',    porStatus.proposta,        'yellow'],
    ['Fechados',       porStatus.fechado,         'emerald'],
    ['Perdidos',       porStatus.perdido,         'red'],
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
          <span className="text-2xl font-black text-orange-400">
            {String(corretor.nome ?? '?').charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-black text-white">{String(corretor.nome ?? '')}</h3>
          <div className="text-sm text-slate-500 mt-0.5 capitalize">{String(corretor.perfil ?? '')}</div>
          <div className="text-xs text-slate-600 mt-1">{String(corretor.email ?? '')}</div>
          {corretor.telefone && <div className="text-xs text-slate-600">{String(corretor.telefone)}</div>}
        </div>
        <span className={`text-[10px] font-black px-3 py-1.5 rounded-full border ${
          corretor.ativo
            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
            : 'text-red-400 bg-red-500/10 border-red-500/20'
        }`}>
          {corretor.ativo ? 'Ativo' : 'Inativo'}
        </span>
      </div>

      <div>
        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
          <DollarSign size={12} className="text-orange-400" /> Financeiro
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MiniCard title="Faturamento Total"  value={R$(financeiro.faturamento_total)} color="orange" />
          <MiniCard title="Faturamento do Mês" value={R$(financeiro.faturamento_mes)}   color="orange" />
          <MiniCard title="Ticket Médio"       value={R$(financeiro.ticket_medio)}       color="purple" />
          <MiniCard title="Tempo Médio Venda"  value={`${financeiro.tempo_medio_venda_dias || 0} dias`} color="slate" />
        </div>
      </div>

      <div>
        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
          <Building2 size={12} className="text-blue-400" /> Imóveis
        </div>
        <div className="grid grid-cols-4 gap-3">
          <MiniCard title="Total"        value={Number(imoveis.total ?? 0)}          color="slate" />
          <MiniCard title="Disponíveis"  value={Number(imoveis.disponiveis ?? 0)}    color="emerald" />
          <MiniCard title="Vendidos"     value={Number(imoveis.vendidos ?? 0)}       color="orange" />
          <MiniCard title="Parados +30d" value={Number(imoveis.parados_30_dias ?? 0)} color="red" />
        </div>
      </div>

      <div>
        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
          <Users size={12} className="text-purple-400" /> Leads
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {statusLeads.map(([label, val, color]) => (
            <MiniCard key={label} title={label} value={val ?? 0} color={color} />
          ))}
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 mt-3">
          <Row label="Total de Leads"    value={leads.total as number} />
          <Row label="Leads no Mês"      value={leads.leads_mes as number} />
          <Row label="Fechados"          value={leads.fechados as number} />
          <Row label="Taxa de Conversão" value={pct(leads.conversao_pct)} />
          <Row label="Vendas no Mês"     value={financeiro.vendas_mes as number} />
        </div>
      </div>

      {alertas.length > 0 && (
        <div>
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <AlertTriangle size={12} className="text-red-400" /> Leads Parados
          </div>
          <div className="space-y-2">
            {alertas.map(a => (
              <div key={String(a.lead_id)} className="flex items-center gap-3 bg-slate-800/50 rounded-xl px-4 py-3">
                <div className="flex-1">
                  <div className="text-sm font-bold text-slate-200">{String(a.nome ?? '')}</div>
                  <div className="text-xs text-slate-500 capitalize">{String(a.status ?? '').replace(/_/g, ' ')}</div>
                </div>
                <span className={`flex items-center gap-1 text-xs font-black ${
                  Number(a.horas_parado) >= 72 ? 'text-red-400' :
                  Number(a.horas_parado) >= 48 ? 'text-orange-400' : 'text-yellow-400'
                }`}>
                  <Clock size={12} />
                  {Number(a.horas_parado) >= 24
                    ? `${Math.floor(Number(a.horas_parado) / 24)}d`
                    : `${a.horas_parado}h`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {perdidos.length > 0 && (
        <div>
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <TrendingUp size={12} className="text-red-400" /> Leads Perdidos
          </div>
          <div className="space-y-2">
            {perdidos.map((l, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                <span className="text-sm text-slate-400 flex-1">{String(l.nome ?? '')}</span>
                <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">{String(l.motivo ?? '')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-[10px] text-slate-700 font-medium">
        Na empresa desde {corretor.created_at ? new Date(String(corretor.created_at)).toLocaleDateString('pt-BR') : '—'}
      </div>
    </div>
  )
}
