import { useState, useEffect, ReactNode, FormEvent } from 'react'
import { Home, Plus, Search, ChevronDown } from 'lucide-react'
import api from '../api'
import Modal from '../components/Modal'
import ImovelDetail from '../components/ImovelDetail'

interface Imovel {
  id: string
  tipo: string
  titulo?: string
  status?: string
  finalidade?: string
  bairro?: string
  cidade?: string
  valor: number
  quartos?: number
  suites?: number
  banheiros?: number
  vagas_garagem?: number
  metragem?: number
  area_total?: number
  mobiliado?: boolean
  area_pet?: boolean
  aceita_financiamento?: boolean
  varanda?: boolean
  piscina?: boolean
  nivel_urgencia?: string
  [key: string]: unknown
}

interface ImovelForm {
  tipo: string; titulo: string; finalidade: string; codigo_interno: string;
  proprietario_nome: string; proprietario_telefone: string; exclusividade: boolean;
  cep: string; estado: string; cidade: string; bairro: string; endereco: string; numero: string;
  complemento: string; ponto_referencia: string; nome_condominio_edificio: string;
  andar: string; numero_apartamento: string;
  valor: string; valor_aluguel: string; comissao_pct: string; valor_minimo: string;
  aceita_proposta: boolean; permuta: boolean; aceita_fgts: boolean;
  aceita_consorcio: boolean; aceita_financiamento: boolean;
  iptu: string; valor_condominio: string;
  area_total: string; area_construida: string; area_util: string; area_terreno: string;
  metragem: string; quartos: string; suites: string; banheiros: string; lavabo: boolean;
  vagas_garagem: string; vagas_cobertas: string; vagas_descobertas: string;
  varanda: boolean; sacada: boolean; varanda_gourmet: boolean;
  escritorio: boolean; closet: boolean; dependencia_empregada: boolean;
  deposito: boolean; porao: boolean; sotao: boolean; area_servico: boolean;
  area_pet: boolean; mobiliado: boolean; semi_mobiliado: boolean;
  planejados: boolean; ar_condicionado: boolean; aquecimento_solar: boolean;
  energia_solar: boolean; piscina: boolean; churrasqueira: boolean;
  area_gourmet: boolean; jardim: boolean; quintal: boolean; vista_mar: boolean;
  vista_panoramica: boolean; frente_rua: boolean; condominio: boolean;
  condominio_fechado: boolean; portaria_24h: boolean; elevador: boolean;
  academia: boolean; salao_festas: boolean; playground: boolean; quadra: boolean;
  estado_imovel: string; ano_construcao: string; ultima_reforma: string;
  matricula_registrada: boolean; escritura_ok: boolean; quitado: boolean;
  alienado: boolean; financiado_banco: boolean; regularizado: boolean;
  habite_se: boolean; documentacao_pendente: boolean; observacoes_juridicas: string;
  descricao_curta: string; descricao_longa: string;
  palavras_chave: string; perfil_comprador: string; faixa_preco: string;
  destaques: string; nivel_urgencia: string;
  caracteristicas: string; observacao: string; destaque: boolean;
  [key: string]: unknown;
}

const TIPOS = [
  { value: 'apartamento',       label: 'Apartamento' },
  { value: 'casa',              label: 'Casa' },
  { value: 'terreno',           label: 'Terreno' },
  { value: 'chacara',           label: 'Chácara' },
  { value: 'imovel_comercial',  label: 'Imóvel Comercial' },
  { value: 'lote_comercial',    label: 'Lote Comercial' },
  { value: 'lote_residencial',  label: 'Lote Residencial' },
]

const ESTADOS_IMOVEL = [
  { value: 'novo',          label: 'Novo' },
  { value: 'usado',         label: 'Usado' },
  { value: 'reformado',     label: 'Reformado' },
  { value: 'em_construcao', label: 'Em Construção' },
  { value: 'planta',        label: 'Na Planta' },
  { value: 'pronto_morar',  label: 'Pronto para Morar' },
  { value: 'precisa_reforma', label: 'Precisa de Reforma' },
]

const STATUS_COLOR: Record<string, string> = {
  disponivel:       'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  vendido_corretor: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
  vendido_outro:    'text-red-400 bg-red-500/10 border-red-500/20',
  alugado:          'text-blue-400 bg-blue-500/10 border-blue-500/20',
  inativo:          'text-slate-600 bg-slate-800/50 border-slate-700',
}

const TIPO_LABEL = TIPOS.reduce<Record<string, string>>((acc, t) => ({ ...acc, [t.value]: t.label }), {})

const VAZIO: ImovelForm = {
  tipo: 'apartamento', titulo: '', finalidade: 'venda', codigo_interno: '',
  proprietario_nome: '', proprietario_telefone: '', exclusividade: false,
  cep: '', estado: '', cidade: '', bairro: '', endereco: '', numero: '',
  complemento: '', ponto_referencia: '', nome_condominio_edificio: '',
  andar: '', numero_apartamento: '',
  valor: '', valor_aluguel: '', comissao_pct: '6', valor_minimo: '',
  aceita_proposta: true, permuta: false, aceita_fgts: false,
  aceita_consorcio: false, aceita_financiamento: false,
  iptu: '', valor_condominio: '',
  area_total: '', area_construida: '', area_util: '', area_terreno: '',
  metragem: '', quartos: '', suites: '', banheiros: '', lavabo: false,
  vagas_garagem: '', vagas_cobertas: '', vagas_descobertas: '',
  varanda: false, sacada: false, varanda_gourmet: false,
  escritorio: false, closet: false, dependencia_empregada: false,
  deposito: false, porao: false, sotao: false, area_servico: false,
  area_pet: false, mobiliado: false, semi_mobiliado: false,
  planejados: false, ar_condicionado: false, aquecimento_solar: false,
  energia_solar: false, piscina: false, churrasqueira: false,
  area_gourmet: false, jardim: false, quintal: false, vista_mar: false,
  vista_panoramica: false, frente_rua: false, condominio: false,
  condominio_fechado: false, portaria_24h: false, elevador: false,
  academia: false, salao_festas: false, playground: false, quadra: false,
  estado_imovel: 'pronto_morar', ano_construcao: '', ultima_reforma: '',
  matricula_registrada: false, escritura_ok: false, quitado: false,
  alienado: false, financiado_banco: false, regularizado: false,
  habite_se: false, documentacao_pendente: false, observacoes_juridicas: '',
  descricao_curta: '', descricao_longa: '',
  palavras_chave: '', perfil_comprador: '', faixa_preco: '',
  destaques: '', nivel_urgencia: 'media',
  caracteristicas: '', observacao: '', destaque: false,
}

function Secao({ titulo, children, defaultAberta = false }: { titulo: string; children: ReactNode; defaultAberta?: boolean }) {
  const [aberta, setAberta] = useState(defaultAberta)
  return (
    <div className="border border-white/10 rounded-xl overflow-hidden">
      <button type="button" onClick={() => setAberta(!aberta)}
        className="w-full flex items-center justify-between px-6 py-4 bg-slate-800/50 hover:bg-slate-800/80 transition-colors">
        <span className="font-black text-sm text-slate-200">{titulo}</span>
        <ChevronDown size={16} className={`text-slate-500 transition-transform ${aberta ? 'rotate-180' : ''}`} />
      </button>
      {aberta && <div className="p-6 space-y-4 bg-slate-900/30">{children}</div>}
    </div>
  )
}

function Campo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">{label}</label>
      {children}
    </div>
  )
}

const inputClass = "w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500/50 text-white placeholder-slate-600"
const selectClass = "w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500/50 text-slate-200"

function Toggle({ label, k, form, set }: { label: string; k: string; form: ImovelForm; set: (k: string, v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-slate-400 hover:text-slate-200 transition-colors">
      <div onClick={() => set(k, !form[k])}
        className={`w-10 h-6 rounded-full flex items-center px-1 transition-all cursor-pointer ${form[k] ? 'bg-orange-500' : 'bg-slate-700'}`}>
        <div className={`w-4 h-4 bg-white rounded-full shadow transition-all ${form[k] ? 'translate-x-4' : 'translate-x-0'}`} />
      </div>
      {label}
    </label>
  )
}

function GrupoToggle({ itens, form, set }: { itens: [string, string][]; form: ImovelForm; set: (k: string, v: boolean) => void }) {
  return (
    <div className="flex flex-wrap gap-4">
      {itens.map(([k, label]) => <Toggle key={k} label={label} k={k} form={form} set={set} />)}
    </div>
  )
}

function Chip({ children, urgent }: { children: ReactNode; urgent?: boolean }) {
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded text-slate-400 font-semibold
      ${urgent ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-white/5 border border-white/10'}`}>
      {children}
    </span>
  )
}

export default function Imoveis() {
  const [imoveis, setImoveis]   = useState<Imovel[]>([])
  const [search, setSearch]     = useState('')
  const [filtro, setFiltro]     = useState('todos')
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState<ImovelForm>(VAZIO)
  const [salvando, setSalvando] = useState(false)
  const [detalhe, setDetalhe]   = useState<{ open: boolean; imovel: Imovel | null }>({ open: false, imovel: null })

  function carregar() {
    api.get<Imovel[]>('/api/imoveis').then(r => setImoveis(r.data)).finally(() => setLoading(false))
  }
  useEffect(() => { carregar() }, [])

  const set = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }))
  const num = (v: string) => v === '' || v === null ? null : Number(v)

  async function salvar(e: FormEvent) {
    e.preventDefault()
    setSalvando(true)
    try {
      await api.post('/api/imoveis', {
        ...form,
        valor:               num(form.valor),
        valor_aluguel:       num(form.valor_aluguel),
        comissao_pct:        num(form.comissao_pct),
        valor_minimo:        num(form.valor_minimo),
        iptu:                num(form.iptu),
        valor_condominio:    num(form.valor_condominio),
        area_total:          num(form.area_total),
        area_construida:     num(form.area_construida),
        area_util:           num(form.area_util),
        area_terreno:        num(form.area_terreno),
        metragem:            num(form.metragem),
        quartos:             num(form.quartos),
        suites:              num(form.suites),
        banheiros:           num(form.banheiros),
        vagas_garagem:       num(form.vagas_garagem),
        vagas_cobertas:      num(form.vagas_cobertas),
        vagas_descobertas:   num(form.vagas_descobertas),
        andar:               num(form.andar),
        ano_construcao:      num(form.ano_construcao),
        ultima_reforma:      num(form.ultima_reforma),
      })
      setShowForm(false)
      setForm(VAZIO)
      carregar()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
      alert(msg ?? 'Erro ao salvar imóvel')
    } finally {
      setSalvando(false)
    }
  }

  const filtrados = imoveis.filter(i => {
    const ms = `${i.bairro ?? ''} ${i.cidade ?? ''} ${i.tipo} ${i.titulo ?? ''}`.toLowerCase()
    const okSearch = ms.includes(search.toLowerCase())
    const okFiltro = filtro === 'todos' || i.status === filtro || i.finalidade === filtro
    return okSearch && okFiltro
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input type="text" placeholder="Buscar por tipo, bairro, cidade ou título..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-orange-500/50 text-sm" />
        </div>
        <select value={filtro} onChange={e => setFiltro(e.target.value)}
          className="bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-300 outline-none">
          <option value="todos">Todos</option>
          <option value="disponivel">Disponíveis</option>
          <option value="venda">Venda</option>
          <option value="aluguel">Aluguel</option>
          <option value="vendido_corretor">Vendidos</option>
          <option value="alugado">Alugados</option>
        </select>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-black px-5 py-3 rounded-xl text-sm transition-all">
          <Plus size={18} /> Novo Imóvel
        </button>
      </div>

      {showForm && (
        <form onSubmit={salvar} className="bg-slate-900/50 border border-orange-500/20 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-black text-orange-400">Cadastrar Imóvel</h3>
            <button type="button" onClick={() => { setShowForm(false); setForm(VAZIO) }}
              className="text-slate-500 hover:text-white text-sm font-bold">Cancelar</button>
          </div>

          <Secao titulo="1. Informações Básicas" defaultAberta>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Campo label="Tipo *">
                <select required value={form.tipo} onChange={e => set('tipo', e.target.value)} className={selectClass}>
                  {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Campo>
              <Campo label="Finalidade *">
                <select required value={form.finalidade} onChange={e => set('finalidade', e.target.value)} className={selectClass}>
                  <option value="venda">Venda</option>
                  <option value="aluguel">Aluguel</option>
                </select>
              </Campo>
              <Campo label="Código Interno">
                <input type="text" value={form.codigo_interno} onChange={e => set('codigo_interno', e.target.value)} className={inputClass} />
              </Campo>
            </div>
            <Campo label="Título do Anúncio">
              <input type="text" value={form.titulo} onChange={e => set('titulo', e.target.value)} className={inputClass} />
            </Campo>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Campo label="Nome do Proprietário">
                <input type="text" value={form.proprietario_nome} onChange={e => set('proprietario_nome', e.target.value)} className={inputClass} />
              </Campo>
              <Campo label="Telefone do Proprietário">
                <input type="text" value={form.proprietario_telefone} onChange={e => set('proprietario_telefone', e.target.value)} className={inputClass} />
              </Campo>
            </div>
            <GrupoToggle itens={[['exclusividade', 'Exclusividade'], ['destaque', 'Destaque']]} form={form} set={set} />
          </Secao>

          <Secao titulo="2. Localização">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Campo label="CEP"><input type="text" value={form.cep} onChange={e => set('cep', e.target.value)} className={inputClass} /></Campo>
              <Campo label="Estado"><input type="text" value={form.estado} onChange={e => set('estado', e.target.value)} className={inputClass} /></Campo>
              <Campo label="Cidade *"><input required type="text" value={form.cidade} onChange={e => set('cidade', e.target.value)} className={inputClass} /></Campo>
              <Campo label="Bairro *"><input required type="text" value={form.bairro} onChange={e => set('bairro', e.target.value)} className={inputClass} /></Campo>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <Campo label="Endereço"><input type="text" value={form.endereco} onChange={e => set('endereco', e.target.value)} className={inputClass} /></Campo>
              </div>
              <Campo label="Número"><input type="text" value={form.numero} onChange={e => set('numero', e.target.value)} className={inputClass} /></Campo>
              <Campo label="Complemento"><input type="text" value={form.complemento} onChange={e => set('complemento', e.target.value)} className={inputClass} /></Campo>
            </div>
          </Secao>

          <Secao titulo="3. Informações Financeiras">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Campo label="Valor de Venda (R$) *"><input required type="number" min="0" value={form.valor} onChange={e => set('valor', e.target.value)} className={inputClass} /></Campo>
              <Campo label="Valor de Aluguel (R$)"><input type="number" min="0" value={form.valor_aluguel} onChange={e => set('valor_aluguel', e.target.value)} className={inputClass} /></Campo>
              <Campo label="Comissão (%)"><input type="number" min="0" max="20" step="0.5" value={form.comissao_pct} onChange={e => set('comissao_pct', e.target.value)} className={inputClass} /></Campo>
            </div>
            <GrupoToggle itens={[
              ['aceita_proposta', 'Aceita Proposta'], ['aceita_financiamento', 'Aceita Financiamento'],
              ['aceita_fgts', 'Aceita FGTS'], ['aceita_consorcio', 'Aceita Consórcio'], ['permuta', 'Permuta'],
            ]} form={form} set={set} />
          </Secao>

          <Secao titulo="4. Características Estruturais">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Campo label="Quartos"><input type="number" min="0" value={form.quartos} onChange={e => set('quartos', e.target.value)} className={inputClass} /></Campo>
              <Campo label="Suítes"><input type="number" min="0" value={form.suites} onChange={e => set('suites', e.target.value)} className={inputClass} /></Campo>
              <Campo label="Banheiros"><input type="number" min="0" value={form.banheiros} onChange={e => set('banheiros', e.target.value)} className={inputClass} /></Campo>
              <Campo label="Vagas Garagem"><input type="number" min="0" value={form.vagas_garagem} onChange={e => set('vagas_garagem', e.target.value)} className={inputClass} /></Campo>
              <Campo label="Metragem (m²)"><input type="number" min="0" value={form.metragem} onChange={e => set('metragem', e.target.value)} className={inputClass} /></Campo>
              <Campo label="Área Total (m²)"><input type="number" min="0" value={form.area_total} onChange={e => set('area_total', e.target.value)} className={inputClass} /></Campo>
            </div>
            <GrupoToggle itens={[
              ['varanda', 'Varanda'], ['sacada', 'Sacada'], ['piscina', 'Piscina'],
              ['churrasqueira', 'Churrasqueira'], ['mobiliado', 'Mobiliado'],
            ]} form={form} set={set} />
          </Secao>

          <Secao titulo="5. Estado e Situação Legal">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Campo label="Estado do Imóvel">
                <select value={form.estado_imovel} onChange={e => set('estado_imovel', e.target.value)} className={selectClass}>
                  {ESTADOS_IMOVEL.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                </select>
              </Campo>
              <Campo label="Nível de Urgência">
                <select value={form.nivel_urgencia} onChange={e => set('nivel_urgencia', e.target.value)} className={selectClass}>
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                </select>
              </Campo>
            </div>
          </Secao>

          <Secao titulo="6. Marketing e Bot">
            <Campo label="Descrição Curta (para o bot)">
              <input type="text" value={form.descricao_curta} onChange={e => set('descricao_curta', e.target.value)} className={inputClass} />
            </Campo>
            <Campo label="Descrição Longa">
              <textarea value={form.descricao_longa} onChange={e => set('descricao_longa', e.target.value)} rows={3} className={`${inputClass} resize-none`} />
            </Campo>
          </Secao>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={salvando}
              className="bg-orange-500 hover:bg-orange-400 text-white font-black px-8 py-3 rounded-xl text-sm transition-all disabled:opacity-50">
              {salvando ? 'Salvando...' : 'Salvar Imóvel'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setForm(VAZIO) }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-6 py-3 rounded-xl text-sm">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-16 text-slate-600 font-bold">Carregando...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtrados.map(im => {
            const stColor = STATUS_COLOR[im.status ?? ''] ?? STATUS_COLOR.disponivel
            return (
              <div key={im.id} onClick={() => setDetalhe({ open: true, imovel: im })}
                className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 hover:border-orange-500/30 transition-all group cursor-pointer">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    {im.titulo && <div className="text-xs text-slate-500 font-medium mb-0.5 line-clamp-1">{im.titulo}</div>}
                    <div className="font-black text-slate-200 group-hover:text-orange-400 transition-colors">
                      {TIPO_LABEL[im.tipo] ?? im.tipo}
                    </div>
                    <div className="text-slate-500 text-xs mt-0.5">{im.bairro} · {im.cidade}</div>
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${stColor}`}>
                    {im.status?.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="text-2xl font-black text-white mb-3">
                  R$ {Number(im.valor).toLocaleString('pt-BR')}
                </div>

                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 font-semibold mb-3">
                  {im.quartos   && <span>{im.quartos} qtos</span>}
                  {im.suites    && <span>{im.suites} suítes</span>}
                  {im.banheiros && <span>{im.banheiros} ban.</span>}
                  {im.vagas_garagem && <span>{im.vagas_garagem} vaga{im.vagas_garagem > 1 ? 's' : ''}</span>}
                  {im.metragem  && <span>{im.metragem}m²</span>}
                  {im.area_total && !im.metragem && <span>{im.area_total}m²</span>}
                  <span className={`ml-auto font-bold ${im.finalidade === 'venda' ? 'text-orange-400' : 'text-blue-400'}`}>
                    {im.finalidade}
                  </span>
                </div>

                <div className="flex gap-1.5 flex-wrap">
                  {im.mobiliado           && <Chip>Mobiliado</Chip>}
                  {im.area_pet            && <Chip>Pet</Chip>}
                  {im.aceita_financiamento && <Chip>Financiamento</Chip>}
                  {im.varanda             && <Chip>Varanda</Chip>}
                  {im.piscina             && <Chip>Piscina</Chip>}
                  {im.nivel_urgencia === 'alta' && <Chip urgent>Urgente</Chip>}
                </div>
              </div>
            )
          })}
          {filtrados.length === 0 && (
            <div className="col-span-3 text-center py-16 text-slate-600 font-bold uppercase text-xs tracking-widest">
              Nenhum imóvel encontrado
            </div>
          )}
        </div>
      )}

      <Modal open={detalhe.open} onClose={() => setDetalhe(d => ({ ...d, open: false }))} title="Imóvel" wide>
        {detalhe.imovel && <ImovelDetail imovel={detalhe.imovel} onUpdate={carregar} />}
      </Modal>
    </div>
  )
}
