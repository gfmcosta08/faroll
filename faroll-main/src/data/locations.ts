// Dados de localização para os filtros
// Baseado em dados reais do Brasil e estrutura para expansão internacional

export interface Country {
  code: string;
  name: string;
}

export interface State {
  code: string;
  name: string;
  countryCode: string;
}

export interface City {
  name: string;
  stateCode: string;
}

// Países disponíveis
export const countries: Country[] = [
  { code: 'BR', name: 'Brasil' },
  { code: 'PT', name: 'Portugal' },
  { code: 'US', name: 'Estados Unidos' },
  { code: 'AR', name: 'Argentina' },
  { code: 'UY', name: 'Uruguai' },
  { code: 'PY', name: 'Paraguai' },
  { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colômbia' },
  { code: 'MX', name: 'México' },
  { code: 'ES', name: 'Espanha' },
];

// Estados do Brasil
export const brazilianStates: State[] = [
  { code: 'AC', name: 'Acre', countryCode: 'BR' },
  { code: 'AL', name: 'Alagoas', countryCode: 'BR' },
  { code: 'AP', name: 'Amapá', countryCode: 'BR' },
  { code: 'AM', name: 'Amazonas', countryCode: 'BR' },
  { code: 'BA', name: 'Bahia', countryCode: 'BR' },
  { code: 'CE', name: 'Ceará', countryCode: 'BR' },
  { code: 'DF', name: 'Distrito Federal', countryCode: 'BR' },
  { code: 'ES', name: 'Espírito Santo', countryCode: 'BR' },
  { code: 'GO', name: 'Goiás', countryCode: 'BR' },
  { code: 'MA', name: 'Maranhão', countryCode: 'BR' },
  { code: 'MT', name: 'Mato Grosso', countryCode: 'BR' },
  { code: 'MS', name: 'Mato Grosso do Sul', countryCode: 'BR' },
  { code: 'MG', name: 'Minas Gerais', countryCode: 'BR' },
  { code: 'PA', name: 'Pará', countryCode: 'BR' },
  { code: 'PB', name: 'Paraíba', countryCode: 'BR' },
  { code: 'PR', name: 'Paraná', countryCode: 'BR' },
  { code: 'PE', name: 'Pernambuco', countryCode: 'BR' },
  { code: 'PI', name: 'Piauí', countryCode: 'BR' },
  { code: 'RJ', name: 'Rio de Janeiro', countryCode: 'BR' },
  { code: 'RN', name: 'Rio Grande do Norte', countryCode: 'BR' },
  { code: 'RS', name: 'Rio Grande do Sul', countryCode: 'BR' },
  { code: 'RO', name: 'Rondônia', countryCode: 'BR' },
  { code: 'RR', name: 'Roraima', countryCode: 'BR' },
  { code: 'SC', name: 'Santa Catarina', countryCode: 'BR' },
  { code: 'SP', name: 'São Paulo', countryCode: 'BR' },
  { code: 'SE', name: 'Sergipe', countryCode: 'BR' },
  { code: 'TO', name: 'Tocantins', countryCode: 'BR' },
];

// Capitais e principais cidades do Brasil (expandível)
export const brazilianCities: City[] = [
  // Acre
  { name: 'Rio Branco', stateCode: 'AC' },
  // Alagoas
  { name: 'Maceió', stateCode: 'AL' },
  // Amapá
  { name: 'Macapá', stateCode: 'AP' },
  // Amazonas
  { name: 'Manaus', stateCode: 'AM' },
  // Bahia
  { name: 'Salvador', stateCode: 'BA' },
  { name: 'Feira de Santana', stateCode: 'BA' },
  // Ceará
  { name: 'Fortaleza', stateCode: 'CE' },
  // Distrito Federal
  { name: 'Brasília', stateCode: 'DF' },
  // Espírito Santo
  { name: 'Vitória', stateCode: 'ES' },
  { name: 'Vila Velha', stateCode: 'ES' },
  // Goiás
  { name: 'Goiânia', stateCode: 'GO' },
  { name: 'Aparecida de Goiânia', stateCode: 'GO' },
  // Maranhão
  { name: 'São Luís', stateCode: 'MA' },
  // Mato Grosso
  { name: 'Cuiabá', stateCode: 'MT' },
  // Mato Grosso do Sul
  { name: 'Campo Grande', stateCode: 'MS' },
  // Minas Gerais
  { name: 'Belo Horizonte', stateCode: 'MG' },
  { name: 'Uberlândia', stateCode: 'MG' },
  { name: 'Contagem', stateCode: 'MG' },
  { name: 'Juiz de Fora', stateCode: 'MG' },
  // Pará
  { name: 'Belém', stateCode: 'PA' },
  // Paraíba
  { name: 'João Pessoa', stateCode: 'PB' },
  { name: 'Campina Grande', stateCode: 'PB' },
  // Paraná
  { name: 'Curitiba', stateCode: 'PR' },
  { name: 'Londrina', stateCode: 'PR' },
  { name: 'Maringá', stateCode: 'PR' },
  // Pernambuco
  { name: 'Recife', stateCode: 'PE' },
  { name: 'Olinda', stateCode: 'PE' },
  // Piauí
  { name: 'Teresina', stateCode: 'PI' },
  // Rio de Janeiro
  { name: 'Rio de Janeiro', stateCode: 'RJ' },
  { name: 'Niterói', stateCode: 'RJ' },
  { name: 'São Gonçalo', stateCode: 'RJ' },
  // Rio Grande do Norte
  { name: 'Natal', stateCode: 'RN' },
  // Rio Grande do Sul
  { name: 'Porto Alegre', stateCode: 'RS' },
  { name: 'Caxias do Sul', stateCode: 'RS' },
  { name: 'Pelotas', stateCode: 'RS' },
  // Rondônia
  { name: 'Porto Velho', stateCode: 'RO' },
  // Roraima
  { name: 'Boa Vista', stateCode: 'RR' },
  // Santa Catarina
  { name: 'Florianópolis', stateCode: 'SC' },
  { name: 'Joinville', stateCode: 'SC' },
  { name: 'Blumenau', stateCode: 'SC' },
  // São Paulo
  { name: 'São Paulo', stateCode: 'SP' },
  { name: 'Campinas', stateCode: 'SP' },
  { name: 'Santos', stateCode: 'SP' },
  { name: 'São Bernardo do Campo', stateCode: 'SP' },
  { name: 'Ribeirão Preto', stateCode: 'SP' },
  { name: 'Sorocaba', stateCode: 'SP' },
  // Sergipe
  { name: 'Aracaju', stateCode: 'SE' },
  // Tocantins
  { name: 'Palmas', stateCode: 'TO' },
  { name: 'Araguaína', stateCode: 'TO' },
];

// Funções auxiliares
export function getStatesByCountry(countryCode: string): State[] {
  if (countryCode === 'BR') {
    return brazilianStates;
  }
  // Para outros países, retorna vazio por enquanto
  // Em produção, pode buscar de API ou tabela
  return [];
}

export function getCitiesByState(stateCode: string): City[] {
  return brazilianCities.filter(city => city.stateCode === stateCode);
}

export function getCountryName(countryCode: string): string {
  return countries.find(c => c.code === countryCode)?.name || countryCode;
}

export function getStateName(stateCode: string): string {
  return brazilianStates.find(s => s.code === stateCode)?.name || stateCode;
}
