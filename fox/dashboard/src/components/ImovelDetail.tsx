import { useState, ReactNode } from 'react'
import { MapPin, DollarSign, Home, Shield, Bot, Star, ChevronDown } from 'lucide-react'
import { LucideIcon } from 'lucide-react'

interface Imovel {
  id: string
  tipo: string
  titulo?: string
  status?: string
  finalidade?: string
  bairro?: string
  cidade?: string
  estado?: string
  codigo_interno?: string
  nivel_urgencia?: string
  exclusividade?: boolean
  destaque?: boolean
  valor: number
  valor_aluguel?: number
  valor_minimo?: number
  valor_estimado_mercado?: number
  quartos?: number
  suites?: number
  banheiros?: number
  vagas_garagem?: number
  vagas_cobertas?: number
  vagas_descobertas?: number
  metragem?: number
  area_total?: number
  area_construida?: number
  area_util?: number
  area_terreno?: number
  andar?: number
  numero_apartamento?: string
  endereco?: string
  numero?: string
  complemento?: string
  nome_condominio_edificio?: string
  ponto_referencia?: string
  cep?: string
  valor_condominio?: number
  iptu?: number
  comissao_pct?: number
  mobiliado?: boolean
  semi_mobiliado?: boolean
  planejados?: boolean
  area_pet?: boolean
  ar_condicionado?: boolean
  aquecimento_solar?: boolean
  energia_solar?: boolean
  piscina?: boolean
  churrasqueira?: boolean
  area_gourmet?: boolean
  jardim?: boolean
  quintal?: boolean
  vista_mar?: boolean
  vista_panoramica?: boolean
  frente_rua?: boolean
  condominio_fechado?: boolean
  portaria_24h?: boolean
  elevador?: boolean
  academia?: boolean
  salao_festas?: boolean
  playground?: boolean
  quadra?: boolean
  aceita_financiamento?: boolean
  aceita_fgts?: boolean
  aceita_consorcio?: boolean
  permuta?: boolean
  varanda?: boolean
  sacada?: boolean
  varanda_gourmet?: boolean
  lavabo?: boolean
  escritorio?: boolean
  closet?: boolean
  dependencia_empregada?: boolean
  deposito?: boolean
  porao?: boolean
  sotao?: boolean
  area_servico?: boolean
  matricula_registrada?: boolean
  escritura_ok?: boolean
  quitado?: boolean
  regularizado?: boolean
  habite_se?: boolean
  alienado?: boolean
  documentacao_pendente?: boolean
  observacoes_juridicas?: string
  estado_imovel?: string
  ano_construcao?: number
  ultima_reforma?: number
  descricao_curta?: string
  descricao_longa?: string
  palavras_chave?: string
  perfil_comprador?: string
  faixa_preco?: string
  destaques?: string
  caracteristicas?: string
  observacao?: string
  proprietario_nome?: string
  proprietario_telefone?: string
  data_venda?: string
  valor_venda?: number
  observacao_venda?: string
  data_cadastro?: string
  visualizacoes?: number
}

interface ImovelDetailProps {
  imovel: Imovel
  onUpdate?: () => void
}

const STATUS_COLOR: Record<string, string> = {
  disponivel:       'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  vendido_corretor: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
  vendido_outro:    'text-red-400 bg-red-500/10 border-red-500/20',
  alugado:          'text-blue-400 bg-blue-500/10 border-blue-500/20',
  inativo:          'text-slate-600 bg-slate-800/50 border-slate-700',
}

const TIPO_LABEL: Record<string, string> = {
  apartamento:      'Apartamento',
  casa:             'Casa',
  terreno:          'Terreno',
  chacara:          'Chácara',
  imovel_comercial: 'Imóvel Comercial',
  lote_comercial:   'Lote Comercial',
  lote_residencial: 'Lote Residencial',
}

type ChipColor = 'slate' | 'orange' | 'emerald' | 'blue' | 'red' | 'purple'

function Row({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value === null || value === undefined || value === '' || value === false) return null
  return (
    <div className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{label}</span>
      <span className="text-sm font-semibold text-slate-200">{String(value)}</span>
    </div>
  )
}

function Chip({ children, color = 'slate' }: { children: ReactNode; color?: ChipColor }) {
  const colors: Record<ChipColor, string> = {
    slate:   'bg-white/5 border-white/10 text-slate-400',
    orange:  'bg-orange-500/10 border-orange-500/20 text-orange-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    blue:    'bg-blue-500/10 border-blue-500/20 text-blue-400',
    red:     'bg-red-500/10 border-red-500/20 text-red-400',
    purple:  'bg-purple-500/10 border-purple-500/20 text-purple-400',
  }
  return (
    <span className={`text-[11px] border px-3 py-1 rounded-full font-semibold ${colors[color]}`}>
      {children}
    </span>
  )
}

function Secao({ titulo, icon: Icon, children, defaultAberta = true }: {
  titulo: string; icon?: LucideIcon; children: ReactNode; defaultAberta?: boolean
}) {
  const [aberta, setAberta] = useState(defaultAberta)
  return (
    <div>
      <button onClick={() => setAberta(!aberta)} className="w-full flex items-center justify-between mb-3 group">
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
          {Icon && <Icon size={12} className="text-orange-400" />} {titulo}
        </div>
        <ChevronDown size={14} className={`text-slate-600 transition-transform ${aberta ? 'rotate-180' : ''}`} />
      </button>
      {aberta && <div className="space-y-1">{children}</div>}
    </div>
  )
}

const R$ = (v: number | undefined | null) => v ? `R$ ${Number(v).toLocaleString('pt-BR')}` : null

export default function ImovelDetail({ imovel }: ImovelDetailProps) {
  if (!imovel) return null
  const st = STATUS_COLOR[imovel.status ?? ''] ?? STATUS_COLOR.disponivel
  const im = imovel

  const diferenciais = [
    im.mobiliado           && 'Mobiliado',
    im.semi_mobiliado      && 'Semi-mob.',
    im.planejados          && 'Planejados',
    im.area_pet            && 'Aceita Pet',
    im.ar_condicionado     && 'Ar-cond.',
    im.aquecimento_solar   && 'Aquec. Solar',
    im.energia_solar       && 'Energia Solar',
    im.piscina             && 'Piscina',
    im.churrasqueira       && 'Churrasqueira',
    im.area_gourmet        && 'Área Gourmet',
    im.jardim              && 'Jardim',
    im.quintal             && 'Quintal',
    im.vista_mar           && 'Vista Mar',
    im.vista_panoramica    && 'Vista Panorâmica',
    im.frente_rua          && 'Frente Rua',
    im.condominio_fechado  && 'Cond. Fechado',
    im.portaria_24h        && 'Portaria 24h',
    im.elevador            && 'Elevador',
    im.academia            && 'Academia',
    im.salao_festas        && 'Salão Festas',
    im.playground          && 'Playground',
    im.quadra              && 'Quadra',
    im.aceita_financiamento && 'Financiamento',
    im.aceita_fgts         && 'FGTS',
    im.aceita_consorcio    && 'Consórcio',
    im.permuta             && 'Permuta',
  ].filter((x): x is string => Boolean(x))

  const comodos = [
    im.varanda             && 'Varanda',
    im.sacada              && 'Sacada',
    im.varanda_gourmet     && 'Varanda Gourmet',
    im.lavabo              && 'Lavabo',
    im.escritorio          && 'Escritório',
    im.closet              && 'Closet',
    im.dependencia_empregada && 'Dep. Empregada',
    im.deposito            && 'Depósito',
    im.porao               && 'Porão',
    im.sotao               && 'Sótão',
    im.area_servico        && 'Área de Serviço',
  ].filter((x): x is string => Boolean(x))

  const legal = [
    im.matricula_registrada && 'Matrícula Registrada',
    im.escritura_ok        && 'Escritura',
    im.quitado             && 'Quitado',
    im.regularizado        && 'Regularizado',
    im.habite_se           && 'Habite-se',
  ].filter((x): x is string => Boolean(x))

  const numericFields: [string, number | undefined | null][] = [
    ['Quartos',    im.quartos],
    ['Suítes',     im.suites],
    ['Banheiros',  im.banheiros],
    ['Garagem',    im.vagas_garagem],
  ]
  const metricFields: [string, string | null][] = [
    ['Metragem',   im.metragem   ? `${im.metragem}m²`    : null],
    ['Área Total', im.area_total ? `${im.area_total}m²`  : null],
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          {im.titulo && <p className="text-xs text-slate-500 mb-1">{im.titulo}</p>}
          <h3 className="text-xl font-black text-white">{TIPO_LABEL[im.tipo] ?? im.tipo}</h3>
          <div className="flex items-center gap-1.5 text-slate-400 text-sm mt-1">
            <MapPin size={13} className="text-orange-400" />
            {[im.bairro, im.cidade, im.estado].filter(Boolean).join(' · ')}
          </div>
          {im.codigo_interno && <div className="text-xs text-slate-600 mt-1">Cód. {im.codigo_interno}</div>}
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${st}`}>
            {im.status?.replace(/_/g, ' ')}
          </span>
          {im.nivel_urgencia === 'alta' && <span className="text-[10px] font-black text-red-400 bg-red-500/10 px-2 py-1 rounded-full">Urgente</span>}
          {im.exclusividade && <span className="text-[10px] font-black text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded-full">Exclusivo</span>}
          {im.destaque && <Star size={14} className="text-orange-400" />}
        </div>
      </div>

      <div className="bg-orange-500/5 border border-orange-500/10 rounded-xl p-5">
        <div className="text-xs font-black text-orange-400 uppercase tracking-widest mb-1">
          {im.finalidade === 'aluguel' ? 'Aluguel' : 'Venda'}
        </div>
        <div className="text-3xl font-black text-white">
          R$ {Number(im.valor).toLocaleString('pt-BR')}
        </div>
        {im.valor_aluguel && <div className="text-sm text-slate-400 mt-1">Aluguel: {R$(im.valor_aluguel)}/mês</div>}
        {im.valor_minimo && <div className="text-xs text-slate-600 mt-1">Valor mínimo: {R$(im.valor_minimo)}</div>}
      </div>

      {(im.quartos || im.suites || im.banheiros || im.vagas_garagem || im.metragem || im.area_total) && (
        <div className="grid grid-cols-3 gap-3">
          {[...numericFields.filter(([, v]) => v).map(([l, v]) => [l, v] as [string, string | number]),
            ...metricFields.filter(([, v]) => v).map(([l, v]) => [l, v] as [string, string | number])
          ].map(([label, value]) => (
            <div key={label} className="bg-slate-800/50 rounded-xl px-3 py-3 text-center">
              <div className="text-lg font-black text-white">{value}</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      )}

      <Secao titulo="Localização" icon={MapPin}>
        <div className="bg-slate-800/50 rounded-xl p-4">
          <Row label="Endereço" value={[im.endereco, im.numero, im.complemento].filter(Boolean).join(', ') || null} />
          <Row label="Condomínio/Edifício" value={im.nome_condominio_edificio} />
          <Row label="Andar / Apto" value={[im.andar ? `${im.andar}º andar` : null, im.numero_apartamento].filter(Boolean).join(' · ') || null} />
          <Row label="Bairro"          value={im.bairro} />
          <Row label="Cidade / Estado" value={[im.cidade, im.estado].filter(Boolean).join(' — ') || null} />
          <Row label="CEP"             value={im.cep} />
          <Row label="Referência"      value={im.ponto_referencia} />
        </div>
      </Secao>

      <Secao titulo="Financeiro" icon={DollarSign} defaultAberta={false}>
        <div className="bg-slate-800/50 rounded-xl p-4">
          <Row label="Condomínio"     value={R$(im.valor_condominio)} />
          <Row label="IPTU (anual)"   value={R$(im.iptu)} />
          <Row label="Comissão"       value={im.comissao_pct ? `${im.comissao_pct}%` : null} />
          <Row label="Valor mínimo"   value={R$(im.valor_minimo)} />
          <Row label="Valor estimado" value={R$(im.valor_estimado_mercado)} />
        </div>
        {(['Financiamento','FGTS','Consórcio','Permuta'].filter(d => diferenciais.includes(d))).length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {['Financiamento', 'FGTS', 'Consórcio', 'Permuta'].filter(d => diferenciais.includes(d)).map(d => (
              <Chip key={d} color="emerald">{d}</Chip>
            ))}
          </div>
        )}
      </Secao>

      {comodos.length > 0 && (
        <Secao titulo="Cômodos" icon={Home} defaultAberta={false}>
          <div className="flex flex-wrap gap-2">
            {comodos.map(d => <Chip key={d}>{d}</Chip>)}
          </div>
        </Secao>
      )}

      {(im.area_construida || im.area_util || im.area_terreno) && (
        <Secao titulo="Áreas" icon={Home} defaultAberta={false}>
          <div className="bg-slate-800/50 rounded-xl p-4">
            <Row label="Área Construída" value={im.area_construida ? `${im.area_construida} m²` : null} />
            <Row label="Área Útil"       value={im.area_util       ? `${im.area_util} m²`       : null} />
            <Row label="Área Terreno"    value={im.area_terreno    ? `${im.area_terreno} m²`    : null} />
            {im.vagas_cobertas    && <Row label="Vagas Cobertas"    value={im.vagas_cobertas} />}
            {im.vagas_descobertas && <Row label="Vagas Descobertas" value={im.vagas_descobertas} />}
          </div>
        </Secao>
      )}

      {diferenciais.length > 0 && (
        <Secao titulo="Diferenciais" defaultAberta={false}>
          <div className="flex flex-wrap gap-2">
            {diferenciais.map(d => <Chip key={d} color="blue">{d}</Chip>)}
          </div>
        </Secao>
      )}

      <Secao titulo="Estado e Documentação" icon={Shield} defaultAberta={false}>
        <div className="bg-slate-800/50 rounded-xl p-4">
          <Row label="Estado"         value={im.estado_imovel?.replace(/_/g, ' ')} />
          <Row label="Ano Construção" value={im.ano_construcao} />
          <Row label="Última Reforma" value={im.ultima_reforma} />
        </div>
        {legal.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {legal.map(d => <Chip key={d} color="emerald">{d}</Chip>)}
          </div>
        )}
        {im.alienado             && <div className="mt-2"><Chip color="red">Alienado</Chip></div>}
        {im.documentacao_pendente && <div className="mt-2"><Chip color="red">Doc. Pendente</Chip></div>}
        {im.observacoes_juridicas && <p className="text-xs text-slate-500 mt-3 bg-slate-800/50 rounded-xl p-3">{im.observacoes_juridicas}</p>}
      </Secao>

      {(im.descricao_curta || im.descricao_longa || im.palavras_chave || im.perfil_comprador || im.destaques) && (
        <Secao titulo="Marketing e Bot" icon={Bot} defaultAberta={false}>
          {im.descricao_curta && (
            <div className="bg-orange-500/5 border border-orange-500/10 rounded-xl p-4">
              <div className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">Descrição (bot)</div>
              <p className="text-sm text-slate-300">{im.descricao_curta}</p>
            </div>
          )}
          <div className="bg-slate-800/50 rounded-xl p-4">
            <Row label="Perfil do comprador" value={im.perfil_comprador} />
            <Row label="Faixa de preço"      value={im.faixa_preco} />
            <Row label="Palavras-chave"       value={im.palavras_chave} />
            <Row label="Urgência"             value={im.nivel_urgencia} />
          </div>
          {im.destaques && (
            <div className="text-xs text-slate-400 bg-slate-800/50 rounded-xl p-3">
              <div className="font-black text-slate-500 uppercase tracking-widest text-[10px] mb-1">Destaques</div>
              {im.destaques}
            </div>
          )}
          {im.descricao_longa && (
            <div>
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Descrição Longa</div>
              <p className="text-sm text-slate-400 leading-relaxed bg-slate-800/50 rounded-xl p-4">{im.descricao_longa}</p>
            </div>
          )}
        </Secao>
      )}

      {(im.caracteristicas || im.observacao) && (
        <div className="space-y-3">
          {im.caracteristicas && (
            <div>
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Características</div>
              <p className="text-sm text-slate-300 bg-slate-800/50 rounded-xl p-4">{im.caracteristicas}</p>
            </div>
          )}
          {im.observacao && (
            <div>
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Observação Interna</div>
              <p className="text-sm text-slate-400 bg-slate-800/50 rounded-xl p-4">{im.observacao}</p>
            </div>
          )}
        </div>
      )}

      {(im.proprietario_nome || im.proprietario_telefone) && (
        <div className="bg-slate-800/50 rounded-xl p-4">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Proprietário</div>
          <Row label="Nome"     value={im.proprietario_nome} />
          <Row label="Telefone" value={im.proprietario_telefone} />
        </div>
      )}

      {im.data_venda && (
        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4">
          <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Dados da Venda</div>
          <Row label="Data"        value={new Date(im.data_venda).toLocaleDateString('pt-BR')} />
          <Row label="Valor Final" value={R$(im.valor_venda)} />
          <Row label="Observação"  value={im.observacao_venda} />
        </div>
      )}

      <div className="text-[10px] text-slate-600 font-medium flex items-center justify-between">
        <span>Cadastrado em {im.data_cadastro ? new Date(im.data_cadastro).toLocaleDateString('pt-BR') : '—'}</span>
        <span>{im.visualizacoes ?? 0} visualizações</span>
      </div>
    </div>
  )
}
