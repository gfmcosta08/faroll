export interface Profession {
  id: string;
  nome: string;
  registro: string;
  categoria: 'saude' | 'imobiliario' | 'outro';
}

export const professions: Profession[] = [
  { id: 'psicologo',             nome: 'Psicólogo',             registro: 'CRP',     categoria: 'saude' },
  { id: 'psiquiatra',            nome: 'Psiquiatra',            registro: 'CRM',     categoria: 'saude' },
  { id: 'fisioterapeuta',        nome: 'Fisioterapeuta',        registro: 'CREFITO', categoria: 'saude' },
  { id: 'terapeuta_ocupacional', nome: 'Terapeuta Ocupacional', registro: 'CREFITO', categoria: 'saude' },
  { id: 'nutricionista',         nome: 'Nutricionista',         registro: 'CRN',     categoria: 'saude' },
  { id: 'medico',                nome: 'Médico',                registro: 'CRM',     categoria: 'saude' },
  { id: 'corretor_imoveis',      nome: 'Corretor de Imóveis',   registro: 'CRECI',   categoria: 'imobiliario' },
];

export const specializationsByProfession: Record<string, string[]> = {
  'Psicólogo': [
    'Clínica', 'Infantil', 'Neuropsicologia', 'TCC', 'Psicanálise',
    'Sistêmica', 'Adulto', 'Casal', 'Família', 'Ansiedade', 'Depressão', 'TDAH', 'TEA',
  ],
  'Psiquiatra': [
    'Adulto', 'Infantil', 'Geriatria', 'Dependência Química',
    'Transtornos de Humor', 'Ansiedade', 'Psicose',
  ],
  'Fisioterapeuta': [
    'Ortopedia', 'Neurologia', 'Respiratória', 'Esportiva',
    'Pélvica', 'Pediatria', 'Gerontologia',
  ],
  'Terapeuta Ocupacional': [
    'Saúde Mental', 'Pediatria', 'Neurologia', 'Reabilitação', 'Gerontologia',
  ],
  'Nutricionista': [
    'Clínica', 'Esportiva', 'Materno-Infantil', 'Oncologia', 'Funcional', 'Comportamental',
  ],
  'Médico': [
    'Clínica Geral', 'Cardiologia', 'Neurologia', 'Endocrinologia',
    'Dermatologia', 'Geriatria', 'Pediatria',
  ],
  'Corretor de Imóveis': [
    'Residencial', 'Comercial', 'Rural', 'Lançamentos', 'Lotes',
    'Alto Padrão', 'Imóveis Industriais', 'Avaliação de Imóveis',
  ],
};

export function getSpecializationsForProfession(profissao: string): string[] {
  return specializationsByProfession[profissao] || [];
}

export function getAllSpecializations(): string[] {
  const allSpecs = Object.values(specializationsByProfession).flat();
  return [...new Set(allSpecs)].sort();
}
