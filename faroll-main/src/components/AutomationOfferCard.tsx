import { ExternalLink, Bot, Calendar, Users, Home, Building2, MessageSquare } from 'lucide-react';
import { Profession } from '@/data/professions';

interface AutomationOfferCardProps {
  profession: Profession;
}

interface OfferConfig {
  titulo: string;
  subtitulo: string;
  descricao: string;
  beneficios: string[];
  ctaLabel: string;
  ctaHref: string;
  accentColor: string;
  icon: React.ReactNode;
}

function getOfferConfig(profession: Profession): OfferConfig | null {
  if (profession.categoria === 'saude') {
    return {
      titulo: 'Psicoapp',
      subtitulo: 'Gestão inteligente para sua clínica',
      descricao:
        'Automatize sua agenda, prontuários e cobranças. Foque no que importa: seus pacientes.',
      beneficios: [
        'Agenda online com confirmação automática via WhatsApp',
        'Prontuário digital integrado',
        'Gestão financeira de sessões e planos',
        'Lista de espera inteligente',
      ],
      ctaLabel: 'Conhecer o Psicoapp',
      ctaHref: 'https://psicoapp.com.br',
      accentColor: 'blue',
      icon: <Users size={28} className="text-blue-400" />,
    };
  }

  if (profession.categoria === 'imobiliario') {
    return {
      titulo: 'APP FOX',
      subtitulo: 'Secretária virtual para corretores',
      descricao:
        'Atenda leads pelo WhatsApp 24h com IA, gerencie imóveis e acompanhe seu funil de vendas em tempo real.',
      beneficios: [
        'Atendimento automático via WhatsApp com IA',
        'CRM de leads e pipeline de vendas',
        'Gestão completa do portfólio de imóveis',
        'Dashboard com métricas e ranking da equipe',
      ],
      ctaLabel: 'Conhecer o APP FOX',
      ctaHref: 'https://appfox.com.br',
      accentColor: 'orange',
      icon: <Building2 size={28} className="text-orange-400" />,
    };
  }

  return null;
}

const accentStyles: Record<string, { border: string; bg: string; badge: string; btn: string; dot: string }> = {
  blue: {
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/5',
    badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    btn: 'bg-blue-600 hover:bg-blue-500 text-white',
    dot: 'bg-blue-400',
  },
  orange: {
    border: 'border-orange-500/30',
    bg: 'bg-orange-500/5',
    badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    btn: 'bg-orange-500 hover:bg-orange-400 text-white',
    dot: 'bg-orange-400',
  },
};

export function AutomationOfferCard({ profession }: AutomationOfferCardProps) {
  const offer = getOfferConfig(profession);
  if (!offer) return null;

  const s = accentStyles[offer.accentColor] ?? accentStyles.orange;

  return (
    <div className={`rounded-2xl border ${s.border} ${s.bg} p-6 space-y-4`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${s.border} bg-white/5`}>
            {offer.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-white text-lg">{offer.titulo}</h3>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${s.badge}`}>
                Parceiro
              </span>
            </div>
            <p className="text-sm text-slate-400 font-medium">{offer.subtitulo}</p>
          </div>
        </div>
        <Bot size={18} className="text-slate-600 mt-1" />
      </div>

      {/* Descrição */}
      <p className="text-sm text-slate-300 leading-relaxed">{offer.descricao}</p>

      {/* Benefícios */}
      <ul className="space-y-2">
        {offer.beneficios.map((b, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot} mt-1.5 shrink-0`} />
            {b}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <a
        href={offer.ctaHref}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all ${s.btn}`}
      >
        {offer.ctaLabel}
        <ExternalLink size={14} />
      </a>
    </div>
  );
}
