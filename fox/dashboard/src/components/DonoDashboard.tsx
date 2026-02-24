import { useState, ReactNode } from 'react'
import { DollarSign, TrendingUp, Building2, Users, Bot, MapPin, AlertTriangle, Clock, Star, BarChart2, ChevronRight } from 'lucide-react'
import { LucideIcon } from 'lucide-react'
import StatCard from './StatCard'
import Modal from './Modal'
import CorretorPerfil from './CorretorPerfil'

interface DonoDashboardProps {
  data: Record<string, unknown>
}

const R$ = (v: unknown) => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`
const pct = (v: unknown) => `${v ?? 0}%`

type SectionColor = 'orange' | 'blue' | 'purple' | 'emerald'

function Section({ title, icon: Icon, children, color = 'orange' }: { title: string; icon: LucideIcon; children: ReactNode; color?: SectionColor }) {
  const colors: Record<SectionColor, string> = { orange: 'text-orange-500', blue: 'text-blue-500', purple: 'text-purple-500', emerald: 'text-emerald-500' }
  return (
    <div className="space-y-4">
      <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-400">
        <Icon size={16} className={colors[color]} /> {title}
      </h2>
      {children}
    </div>
  )
}

function BarSimple({ value, max, color = 'bg-orange-500' }: { value: number; max: number; color?: string }) {
  const pctW = max ? Math.round((value / max) * 100) : 0
  return (
    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden flex-1">
      <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pctW}%` }} />
    </div>
  )
}

export default function DonoDashboard({ data }: DonoDashboardProps) {
  const [perfilSel, setPerfilSel] = useState<{ id: string; nome: string } | null>(null)

  const fin  = (data?.financeiro          ?? {}) as Record<string, unknown>
  const com  = (data?.comercial           ?? {}) as Record<string, unknown>
  const im   = (data?.imoveis             ?? {}) as Record<string, unknown>
  const mer  = (data?.mercado             ?? {}) as Record<string, unknown>
  const bot  = (data?.atendimento_bot     ?? {}) as Record<string, unknown>
  const rank = (data?.ranking_corretores  ?? []) as Array<Record<string, unknown>>

  const maxFat = Math.max(...rank.map(c => Number(c.faturamento ?? 0)), 1)
  const diasBot = (bot.distribuicao_por_dia ?? {}) as Record<string, number>
  const maxDia = Math.max(...Object.values(diasBot), 1)

  const finPorCorretor = (fin.por_corretor ?? []) as Array<Record<string, unknown>>
  const comPerdidos = (com.perdidos_com_motivo ?? []) as Array<Record<string, unknown>>
  const merBairros = (mer.bairros_mais_buscados ?? []) as Array<Record<string, unknown>>
  const merTipos   = (mer.tipos_mais_buscados   ?? []) as Array<Record<string, unknown>>
  const semResp    = (data?.leads_sem_responsavel ?? []) as Array<Record<string, unknown>>

  return (
    <>
    <div className="space-y-10">

      <Section title="Financeiro" icon={DollarSign} color="orange">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard title="Faturamento Mês"   value={R$(fin.faturamento_mes)}        icon={DollarSign}  color="orange" />
          <StatCard title="Faturamento Total" value={R$(fin.faturamento_total)}       icon={DollarSign}  color="orange" sub="comissões acumuladas" />
          <StatCard title="Ticket Médio"      value={R$(fin.ticket_medio)}            icon={TrendingUp}  color="purple" />
          <StatCard title="Valor Captado"     value={R$(fin.valor_captado)}           icon={Building2}   color="blue"   sub="imóveis disponíveis" />
          <StatCard title="Total Vendido"     value={R$(fin.valor_total_vendido)}     icon={Star}        color="emerald" sub="valor bruto das vendas" />
          <StatCard title="Pipeline"          value={R$(fin.pipeline_valor)}          icon={BarChart2}   color="slate"  sub="leads em proposta" />
        </div>

        {finPorCorretor.length > 0 && (
          <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
            <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Faturamento por Corretor</div>
            <div className="space-y-3">
              {finPorCorretor.map((c, i) => (
                <div key={String(c.id)} className="flex items-center gap-4">
                  <span className="text-xs text-slate-600 w-4">{i + 1}</span>
                  <span className="text-sm font-bold text-slate-300 w-32 truncate">{String(c.nome ?? '')}</span>
                  <BarSimple value={Number(c.faturamento ?? 0)} max={maxFat} />
                  <span className="text-sm font-black text-white w-28 text-right">{R$(c.faturamento)}</span>
                  <span className="text-xs text-slate-500 w-16 text-right">{String(c.vendas)} venda{Number(c.vendas) !== 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Section>

      <Section title="Comercial" icon={TrendingUp} color="purple">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Total de Leads"     value={Number(com.total_leads ?? 0)}                icon={Users}       color="orange" />
          <StatCard title="Conversão Geral"    value={pct(com.conversao_geral)}                    icon={TrendingUp}  color="emerald" sub="leads → fechados" />
          <StatCard title="Leads Abertos"      value={Number(com.leads_abertos ?? 0)}              icon={Users}       color="blue" />
          <StatCard title="Tempo Médio Venda"  value={`${com.tempo_medio_venda_dias ?? 0} dias`}   icon={Clock}       color="slate" />
        </div>

        {comPerdidos.length > 0 && (
          <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
            <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">
              Leads Perdidos — {String(com.leads_perdidos ?? 0)} total
            </div>
            <div className="space-y-2">
              {comPerdidos.map((l, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                  <span className="text-slate-400 text-sm font-semibold flex-1">{String(l.nome ?? '')}</span>
                  <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">{String(l.motivo ?? '')}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Section>

      <Section title="Imóveis" icon={Building2} color="blue">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard title="Total"           value={Number(im.total ?? 0)}              color="slate" />
          <StatCard title="Disponíveis"     value={Number(im.ativos ?? 0)}             color="emerald" icon={Building2} />
          <StatCard title="Vendidos (nós)"  value={Number(im.vendidos_corretor ?? 0)}  color="orange"  icon={Star} />
          <StatCard title="Vendidos (3ºs)"  value={Number(im.vendidos_outros ?? 0)}    color="red"     icon={AlertTriangle} />
          <StatCard title="Parados +30d"    value={Number(im.parados_30_dias ?? 0)}    color="purple"  sub="precisam de ação" />
          <StatCard title="Parados +60d"    value={Number(im.parados_60_dias ?? 0)}    color="red"     sub="urgente" />
        </div>
      </Section>

      <Section title="Automação — ROI do Bot" icon={Bot} color="emerald">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard title="Leads fora do horário" value={Number(bot.leads_captados_fora_horario ?? 0)} icon={Bot} color="orange" sub={`${bot.pct_leads_fora_horario ?? 0}% do total`} />
          <StatCard title="Viraram venda"         value={Number(bot.leads_fora_viraram_venda ?? 0)}    icon={Star} color="emerald" sub="sem o bot, perdidos" />
          <StatCard title="Valor gerado"          value={R$(bot.valor_gerado_fora)}                    icon={DollarSign} color="emerald" />
          <StatCard title="Mensagens fora horário" value={Number(bot.total_interacoes_fora_horario ?? 0)} icon={Bot} color="purple" />
          <StatCard title="Aguardando retorno"    value={Number(bot.leads_aguardando_retorno ?? 0)}    icon={AlertTriangle} color="red" sub="sem corretor responsável" />
        </div>

        <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
          <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">
            Mensagens fora do horário — por dia da semana
          </div>
          <div className="space-y-3">
            {Object.entries(diasBot).map(([dia, val]) => (
              <div key={dia} className="flex items-center gap-4">
                <span className="text-xs font-bold text-slate-500 w-16 capitalize">{dia}</span>
                <BarSimple value={val} max={maxDia} color="bg-orange-500" />
                <span className="text-sm font-bold text-white w-6 text-right">{val}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 text-xs text-slate-600">
            Horário comercial: Seg–Sex 08:00–18:00 · Sáb 08:00–12:00 · Dom fechado
          </div>
        </div>
      </Section>

      {(merBairros.length > 0 || merTipos.length > 0) && (
        <Section title="Demanda de Mercado" icon={MapPin} color="blue">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {merBairros.length > 0 && (
              <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
                <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Bairros mais buscados</div>
                <div className="space-y-3">
                  {merBairros.map((b, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-slate-600 w-4">{i + 1}</span>
                      <span className="text-sm font-bold text-slate-300 flex-1">{String(b.bairro ?? '')}</span>
                      <span className="text-xs font-black text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">{String(b.count ?? '')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {merTipos.length > 0 && (
              <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
                <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Tipos mais buscados</div>
                <div className="space-y-3">
                  {merTipos.map((t, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-slate-600 w-4">{i + 1}</span>
                      <span className="text-sm font-bold text-slate-300 flex-1 capitalize">{String(t.tipo ?? '').replace(/_/g, ' ')}</span>
                      <span className="text-xs font-black text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">{String(t.count ?? '')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      <Section title="Ranking da Equipe" icon={Users} color="orange">
        <p className="text-xs text-slate-600 -mt-2">Clique em um corretor para ver o perfil completo de produtividade</p>
        <div className="bg-slate-900/50 border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-white/[0.03]">
              <tr>
                {['#', 'Corretor', 'Faturamento', 'Vendas', 'Leads', 'Conversão', ''].map(h => (
                  <th key={h} className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rank.map((c, i) => (
                <tr key={String(c.id)}
                  onClick={() => setPerfilSel({ id: String(c.id), nome: String(c.nome ?? '') })}
                  className="hover:bg-orange-500/5 transition-colors cursor-pointer group">
                  <td className="px-5 py-4 text-slate-600 font-bold text-sm">{i + 1}</td>
                  <td className="px-5 py-4 font-bold text-slate-200 group-hover:text-orange-400 transition-colors">{String(c.nome ?? '')}</td>
                  <td className="px-5 py-4 font-black text-orange-400">{R$(c.faturamento)}</td>
                  <td className="px-5 py-4 text-slate-300 font-semibold text-sm">{String(c.vendas ?? '')}</td>
                  <td className="px-5 py-4 text-slate-400 text-sm">{String(c.total_leads ?? '')}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-black px-2 py-1 rounded-full ${
                      Number(c.conversao_pct) >= 30 ? 'text-emerald-400 bg-emerald-500/10' :
                      Number(c.conversao_pct) >= 10 ? 'text-yellow-400 bg-yellow-500/10' :
                      'text-slate-500 bg-slate-800'
                    }`}>{pct(c.conversao_pct)}</span>
                  </td>
                  <td className="px-5 py-4 text-slate-700 group-hover:text-orange-400 transition-colors">
                    <ChevronRight size={16} />
                  </td>
                </tr>
              ))}
              {rank.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-600 text-sm">Sem dados de corretores</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Section>
    </div>

    <Modal
      open={!!perfilSel}
      onClose={() => setPerfilSel(null)}
      title={`Produtividade — ${perfilSel?.nome ?? ''}`}
      wide
    >
      {perfilSel && <CorretorPerfil corretorId={perfilSel.id} />}
    </Modal>
  </>
  )
}
