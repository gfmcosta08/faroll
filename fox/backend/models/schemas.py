from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID
from datetime import datetime


# ── Auth ──────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: EmailStr
    senha: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    corretor_id: str
    empresa_id: str
    perfil: str
    nome: str


# ── Corretor ──────────────────────────────────────────────────
class CorretorCreate(BaseModel):
    nome: str
    email: EmailStr
    telefone: Optional[str] = None
    senha: str
    perfil: Optional[str] = "corretor"   # gerente | corretor | secretaria | admin

class CorretorOut(BaseModel):
    id: UUID
    empresa_id: UUID
    nome: str
    email: str
    telefone: Optional[str]
    perfil: str
    ativo: bool
    created_at: datetime


# ── Imóvel ────────────────────────────────────────────────────
class ImovelCreate(BaseModel):
    # Identificação
    tipo: str
    titulo: Optional[str] = None
    finalidade: str                          # venda | aluguel
    proprietario_nome: Optional[str] = None
    proprietario_telefone: Optional[str] = None
    exclusividade: bool = False
    codigo_interno: Optional[str] = None
    destaque: bool = False

    # Localização
    cep: Optional[str] = None
    estado: Optional[str] = None
    cidade: str
    bairro: str
    endereco: Optional[str] = None
    numero: Optional[str] = None
    complemento: Optional[str] = None
    ponto_referencia: Optional[str] = None
    nome_condominio_edificio: Optional[str] = None
    andar: Optional[int] = None
    numero_apartamento: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    # Financeiro
    valor: float
    valor_aluguel: Optional[float] = None
    aceita_proposta: bool = True
    valor_minimo: Optional[float] = None
    permuta: bool = False
    aceita_fgts: bool = False
    aceita_consorcio: bool = False
    aceita_financiamento: bool = False
    valor_estimado_mercado: Optional[float] = None
    comissao_pct: Optional[float] = 6.0
    iptu: Optional[float] = None
    valor_condominio: Optional[float] = None

    # Áreas
    metragem: Optional[float] = None
    area_total: Optional[float] = None
    area_construida: Optional[float] = None
    area_util: Optional[float] = None
    area_terreno: Optional[float] = None

    # Quartos e vagas
    quartos: Optional[int] = None
    suites: Optional[int] = None
    banheiros: Optional[int] = None
    lavabo: bool = False
    vagas_garagem: Optional[int] = None
    vagas_cobertas: Optional[int] = None
    vagas_descobertas: Optional[int] = None

    # Cômodos
    varanda: bool = False
    sacada: bool = False
    varanda_gourmet: bool = False
    escritorio: bool = False
    closet: bool = False
    dependencia_empregada: bool = False
    deposito: bool = False
    porao: bool = False
    sotao: bool = False
    area_servico: bool = False

    # Diferenciais
    mobiliado: bool = False
    semi_mobiliado: bool = False
    planejados: bool = False
    area_pet: bool = False
    ar_condicionado: bool = False
    aquecimento_solar: bool = False
    energia_solar: bool = False
    piscina: bool = False
    churrasqueira: bool = False
    area_gourmet: bool = False
    jardim: bool = False
    quintal: bool = False
    vista_mar: bool = False
    vista_panoramica: bool = False
    frente_rua: bool = False
    condominio: bool = False
    condominio_fechado: bool = False
    portaria_24h: bool = False
    elevador: bool = False
    academia: bool = False
    salao_festas: bool = False
    playground: bool = False
    quadra: bool = False

    # Estado do imóvel
    estado_imovel: Optional[str] = "pronto_morar"
    ano_construcao: Optional[int] = None
    ultima_reforma: Optional[int] = None

    # Mídia
    video_url: Optional[str] = None
    tour_url: Optional[str] = None
    planta_baixa_url: Optional[str] = None

    # Situação legal
    matricula_registrada: bool = False
    escritura_ok: bool = False
    quitado: bool = False
    alienado: bool = False
    financiado_banco: bool = False
    regularizado: bool = False
    habite_se: bool = False
    documentacao_pendente: bool = False
    observacoes_juridicas: Optional[str] = None

    # Bot Intelligence / Marketing
    faixa_preco: Optional[str] = None
    perfil_comprador: Optional[str] = None
    palavras_chave: Optional[str] = None
    descricao_curta: Optional[str] = None
    descricao_longa: Optional[str] = None
    destaques: Optional[str] = None
    nivel_urgencia: Optional[str] = "media"
    probabilidade_venda: Optional[int] = None

    # Texto livre
    caracteristicas: Optional[str] = None
    observacao: Optional[str] = None


class ImovelUpdate(BaseModel):
    tipo: Optional[str] = None
    titulo: Optional[str] = None
    finalidade: Optional[str] = None
    proprietario_nome: Optional[str] = None
    proprietario_telefone: Optional[str] = None
    exclusividade: Optional[bool] = None
    codigo_interno: Optional[str] = None
    destaque: Optional[bool] = None
    cep: Optional[str] = None
    estado: Optional[str] = None
    cidade: Optional[str] = None
    bairro: Optional[str] = None
    endereco: Optional[str] = None
    numero: Optional[str] = None
    complemento: Optional[str] = None
    ponto_referencia: Optional[str] = None
    valor: Optional[float] = None
    valor_aluguel: Optional[float] = None
    valor_minimo: Optional[float] = None
    comissao_pct: Optional[float] = None
    iptu: Optional[float] = None
    valor_condominio: Optional[float] = None
    quartos: Optional[int] = None
    suites: Optional[int] = None
    banheiros: Optional[int] = None
    vagas_garagem: Optional[int] = None
    metragem: Optional[float] = None
    area_total: Optional[float] = None
    area_util: Optional[float] = None
    status: Optional[str] = None
    estado_imovel: Optional[str] = None
    descricao_curta: Optional[str] = None
    descricao_longa: Optional[str] = None
    palavras_chave: Optional[str] = None
    nivel_urgencia: Optional[str] = None
    observacao: Optional[str] = None
    caracteristicas: Optional[str] = None


class ImovelVender(BaseModel):
    valor_venda: float
    corretor_venda_id: Optional[str] = None
    observacao_venda: Optional[str] = None


# ── Lead ──────────────────────────────────────────────────────
class LeadUpdate(BaseModel):
    nome: Optional[str] = None
    email: Optional[str] = None
    status_lead: Optional[str] = None
    motivo_perda: Optional[str] = None
    orcamento_min: Optional[float] = None
    orcamento_max: Optional[float] = None
