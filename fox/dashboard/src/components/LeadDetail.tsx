import { Phone, User, Calendar, DollarSign, Tag, MessageSquare, LucideIcon } from 'lucide-react'

interface Interacao {
  id: string
  tipo: 'cliente' | 'bot' | 'humano'
  mensagem: string
  data?: string
}

interface Lead {
  id: string
  nome?: string
  telefone?: string
  email?: string
  status_lead: string
  origem?: string
  data_primeiro_contato?: string
  ultima_interacao?: string
  orcamento_max?: number
  motivo_perda?: string
  preferencias?: Record<string, unknown>
  interacoes?: Interacao[]
}

interface LeadDetailProps {
  lead: Lead
  onUpdate?: () => void
}

const STATUS_COLOR: Record<string, string> = {
  novo:           'text-orange-400 bg-orange-500/10 border-orange-500/20',
  em_atendimento: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  visita:         'text-purple-400 bg-purple-500/10 border-purple-500/20',
  proposta:       'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  fechado:        'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  perdido:        'text-red-400 bg-red-500/10 border-red-500/20',
}

const STATUS_LABEL: Record<string, string> = {
  novo: 'Novo', em_atendimento: 'Em Atendimento', visita: 'Visita',
  proposta: 'Proposta', fechado: 'Fechado', perdido: 'Perdido',
}

function Field({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string | null | undefined }) {
  if (!value && value !== '0') return null
  return (
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-lg bg-white/5 mt-0.5 shrink-0">
        <Icon size={14} className="text-orange-400" />
      </div>
      <div>
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">{label}</div>
        <div className="text-sm font-semibold text-slate-200">{value}</div>
      </div>
    </div>
  )
}

export default function LeadDetail({ lead }: LeadDetailProps) {
  if (!lead) return null
  const st   = STATUS_COLOR[lead.status_lead] ?? STATUS_COLOR.novo
  const pref = lead.preferencias ?? {}

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-2xl font-black text-white">{lead.nome ?? 'Sem nome'}</h3>
          <p className="text-slate-500 text-sm font-medium mt-1">{lead.telefone}</p>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${st}`}>
          {STATUS_LABEL[lead.status_lead] ?? lead.status_lead}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field icon={Phone}    label="Telefone"         value={lead.telefone} />
        <Field icon={User}     label="Email"            value={lead.email} />
        <Field icon={Tag}      label="Origem"           value={lead.origem} />
        <Field icon={Calendar} label="Primeiro Contato" value={lead.data_primeiro_contato ? new Date(lead.data_primeiro_contato).toLocaleString('pt-BR') : null} />
        <Field icon={Calendar} label="Última Interação" value={lead.ultima_interacao ? new Date(lead.ultima_interacao).toLocaleString('pt-BR') : null} />
        <Field icon={DollarSign} label="Orçamento"      value={lead.orcamento_max ? `R$ ${Number(lead.orcamento_max).toLocaleString('pt-BR')}` : null} />
        {lead.motivo_perda && <Field icon={Tag} label="Motivo da Perda" value={lead.motivo_perda} />}
      </div>

      {Object.keys(pref).length > 0 && (
        <div className="bg-slate-800/50 rounded-xl p-5">
          <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Preferências (coletadas pelo bot)</div>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(pref).map(([k, v]) => (
              <div key={k} className="flex items-center gap-2 text-sm">
                <span className="text-slate-500 capitalize">{k}:</span>
                <span className="text-slate-200 font-semibold">{String(v)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {lead.interacoes && lead.interacoes.length > 0 && (
        <div>
          <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <MessageSquare size={12} /> Histórico de Conversas
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {lead.interacoes.slice().reverse().map(i => (
              <div key={i.id} className={`rounded-xl px-4 py-3 text-sm ${
                i.tipo === 'cliente' ? 'bg-slate-700/50 text-slate-200' :
                i.tipo === 'bot'     ? 'bg-orange-500/5 border border-orange-500/10 text-slate-300' :
                                      'bg-blue-500/5 border border-blue-500/10 text-slate-300'
              }`}>
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-[10px] font-black uppercase tracking-wider ${
                    i.tipo === 'cliente' ? 'text-slate-400' :
                    i.tipo === 'bot'     ? 'text-orange-400' : 'text-blue-400'
                  }`}>{i.tipo}</span>
                  <span className="text-[10px] text-slate-600">
                    {i.data ? new Date(i.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                <p className="leading-relaxed">{i.mensagem}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
