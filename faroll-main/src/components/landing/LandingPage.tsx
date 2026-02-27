import { useState, useEffect } from "react";
import DOMPurify from "dompurify";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Star, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LandingNavbar } from "./LandingNavbar";
import { LandingHero } from "./LandingHero";
import { LandingFeatures } from "./LandingFeatures";
import { LandingPhilosophy } from "./LandingPhilosophy";
import { LandingProtocol } from "./LandingProtocol";
import { LandingMembership } from "./LandingMembership";
import { LandingFooter } from "./LandingFooter";

interface Professional {
  id: string;
  nome: string;
  avatar_url: string | null;
  profissao: string;
  descricao: string;
  rating_average: number;
  rating_count: number;
  specialization_names: string[];
}

interface ContentCard {
  id: string;
  titulo: string;
  subtitulo: string | null;
  imagem_capa: string | null;
  preview: string | null;
  tipo: string;
}

interface LandingPageProps {
  onLogin: () => void;
  onRegister: () => void;
}

export function LandingPage({ onLogin, onRegister }: LandingPageProps) {
  const [topProfessionals, setTopProfessionals] = useState<Professional[]>([]);
  const [contentCards, setContentCards] = useState<ContentCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContent, setSelectedContent] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Carregar profissionais em destaque (com ou sem avaliações)
      const { data: professionals, error: profError } = await supabase
        .from("profiles")
        .select(`
          id,
          nome,
          avatar_url,
          descricao,
          rating_average,
          rating_count,
          profissao,
          especialidades
        `)
        .eq("perfil_ativo", true)
        .order("rating_average", { ascending: false })
        .order("rating_count", { ascending: false })
        .limit(6);

      if (profError) {
        console.error("Erro ao carregar profissionais:", profError);
      } else if (professionals) {
        // Processar dados dos profissionais
        const processedProfessionals = professionals.map((prof) => ({
          id: prof.id,
          nome: prof.nome,
          avatar_url: prof.avatar_url,
          profissao: prof.profissao || "Profissional",
          descricao: prof.descricao || "",
          rating_average: prof.rating_average || 0,
          rating_count: prof.rating_count || 0,
          specialization_names: prof.especialidades || [],
        }));
        setTopProfessionals(processedProfessionals);
      }

      // Carregar cards de conteúdo
      const { data: content, error: contentError } = await supabase
        .from("content_cards")
        .select("id, titulo, subtitulo, imagem_capa, preview, tipo")
        .eq("ativo", true)
        .not("publicado_em", "is", null)
        .order("ordem", { ascending: true })
        .order("publicado_em", { ascending: false })
        .limit(6);

      if (contentError) {
        console.error("Erro ao carregar conteúdos:", contentError);
      } else if (content && content.length > 0) {
        setContentCards(content);
      } else {
        // Fallback com dados de exemplo caso o banco esteja vazio
        setContentCards([
          {
            id: "mock-1",
            titulo: "Como escolher o melhor profissional de saúde para você",
            subtitulo: "Dicas Práticas",
            imagem_capa: "https://images.unsplash.com/photo-1576091160550-217359f42f8c?auto=format&fit=crop&q=80&w=800",
            preview: "Descubra os principais critérios para avaliar antes de agendar sua primeira consulta e garantir um atendimento de qualidade.",
            tipo: "informativo",
            conteudo_completo: "<h1>Como escolher o melhor profissional de saúde</h1><p>Escolher um profissional de saúde é uma decisão importante que pode impactar diretamente sua qualidade de vida. Aqui estão alguns pontos fundamentais para levar em conta...</p>",
            ativo: true,
            publicado_em: new Date().toISOString()
          },
          {
            id: "mock-2",
            titulo: "A importância do acompanhamento preventivo",
            subtitulo: "Saúde e Bem-estar",
            imagem_capa: "https://images.unsplash.com/photo-1505751172107-119f4a396440?auto=format&fit=crop&q=80&w=800",
            preview: "Entenda por que a prevenção é o melhor caminho e como as consultas regulares podem evitar problemas graves no futuro.",
            tipo: "informativo",
            conteudo_completo: "<h1>A importância da prevenção</h1><p>Muitas vezes deixamos para procurar ajuda médica apenas quando sentimos dor, mas o acompanhamento preventivo é a chave para uma vida longa e saudável...</p>",
            ativo: true,
            publicado_em: new Date().toISOString()
          }
        ]);
      }
    } catch (error) {
      console.error("Erro geral ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number, count?: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= Math.round(rating) ? "fill-landing-clay text-landing-clay" : "text-landing-moss/30"}`}
          />
        ))}
        <span className="ml-1 text-sm text-landing-moss/80">
          {rating.toFixed(1)}{count != null ? ` (${count})` : ""}
        </span>
      </div>
    );
  };

  const handleContentClick = async (contentId: string) => {
    // Incrementar visualizações
    await supabase.rpc("increment_content_views", { content_id: contentId });
    setSelectedContent(contentId);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (selectedContent) {
    return <ContentDetailView contentId={selectedContent} onBack={() => setSelectedContent(null)} />;
  }

  return (
    <div className="min-h-screen bg-landing-cream landing-noise">
      <LandingNavbar onLogin={onLogin} onRegister={onRegister} />
      <LandingHero />
      <LandingFeatures />
      <LandingPhilosophy />
      <LandingProtocol />
      <LandingMembership onRegister={onRegister} />
      {(loading || topProfessionals.length > 0) && (
        <section className="py-14 px-4 bg-landing-cream" aria-label="Profissionais em destaque">
          <div className="container mx-auto max-w-5xl">
            <h2 className="font-outfit font-bold text-2xl md:text-3xl text-landing-charcoal text-center tracking-tight mb-2">
              Profissionais em destaque
            </h2>
            <p className="text-landing-moss/80 text-center text-sm mb-8">
              Conheça profissionais da plataforma.
            </p>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse rounded-2xl bg-white/60 backdrop-blur-sm border border-white/50 p-6 h-64" />
                ))}
              </div>
            ) : topProfessionals.length === 0 ? (
              <p className="text-center text-landing-moss/70 py-8 text-sm">Nenhum profissional em destaque no momento.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {topProfessionals.slice(0, 6).map((professional) => (
                  <div
                    key={professional.id}
                    className="rounded-2xl bg-white/70 backdrop-blur-sm border border-white/50 shadow-lg shadow-black/5 overflow-hidden hover:bg-white/90 transition-colors"
                  >
                    <div className="p-5 text-center">
                      <Avatar className="w-20 h-20 mx-auto mb-3 ring-2 ring-landing-moss/20 ring-offset-2 ring-offset-white/50">
                        <AvatarImage src={professional.avatar_url || undefined} alt={professional.nome} />
                        <AvatarFallback className="text-base bg-landing-moss text-landing-cream font-mono">
                          {getInitials(professional.nome)}
                        </AvatarFallback>
                      </Avatar>
                      <h4 className="font-outfit font-semibold text-landing-charcoal">{professional.nome}</h4>
                      <p className="text-xs text-landing-moss/80 font-mono">{professional.profissao}</p>
                    </div>
                    <div className="px-5 pb-4 space-y-2">
                      {professional.descricao && (
                        <p className="text-xs text-landing-moss/70 line-clamp-2">{professional.descricao}</p>
                      )}
                      {professional.specialization_names.length > 0 && (
                        <div className="flex flex-wrap gap-1 justify-center">
                          {professional.specialization_names.slice(0, 2).map((spec, idx) => (
                            <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-landing-moss/10 text-landing-moss font-mono">
                              {spec}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-center gap-1 pt-1">
                        {renderStars(professional.rating_average, professional.rating_count)}
                      </div>
                      <Button size="sm" className="w-full mt-2 bg-landing-clay hover:bg-landing-clay/90 text-white text-xs" onClick={onRegister}>
                        <Calendar className="w-3 h-3 mr-1" />
                        Ver perfil
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
      {(loading || contentCards.length > 0) && (
        <section className="py-14 px-4 bg-white/40" aria-label="Informativos">
          <div className="container mx-auto max-w-5xl">
            <h2 className="font-outfit font-bold text-2xl md:text-3xl text-landing-charcoal text-center tracking-tight mb-2">
              Notícias e informativos
            </h2>
            <p className="text-landing-moss/80 text-center text-sm mb-8">
              Artigos e novidades em formato jornal.
            </p>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="animate-pulse rounded-2xl bg-white/60 h-64 border border-white/50" />
                <div className="animate-pulse rounded-2xl bg-white/60 h-64 border border-white/50" />
              </div>
            ) : contentCards.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {contentCards.slice(0, 4).map((card) => (
                  <article
                    key={card.id}
                    onClick={() => handleContentClick(card.id)}
                    className="rounded-2xl bg-white/70 backdrop-blur-sm border border-white/50 shadow-lg shadow-black/5 overflow-hidden cursor-pointer hover:bg-white/90 transition-colors group"
                  >
                    {card.imagem_capa && (
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={card.imagem_capa}
                          alt={card.titulo}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-5">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-landing-clay">
                        {card.tipo === "publicitario" ? "Especial" : "Artigo"}
                      </span>
                      <h3 className="font-outfit font-semibold text-landing-charcoal mt-1 line-clamp-2 group-hover:text-landing-clay transition-colors">
                        {card.titulo}
                      </h3>
                      {card.subtitulo && <p className="text-xs text-landing-moss/80 mt-0.5">{card.subtitulo}</p>}
                      {card.preview && <p className="text-xs text-landing-moss/70 mt-2 line-clamp-2">{card.preview}</p>}
                      <p className="text-xs font-mono text-landing-clay mt-3 group-hover:underline">Ler mais →</p>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      )}
      <LandingFooter />
    </div>
  );
}

// Componente separado para visualização detalhada de conteúdo
interface ContentDetailViewProps {
  contentId: string;
  onBack: () => void;
}

function ContentDetailView({ contentId, onBack }: ContentDetailViewProps) {
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, [contentId]);

  const loadContent = async () => {
    try {
      // Se for um ID de mock, criar o conteúdo localmente
      if (contentId.startsWith("mock-")) {
        const mockData: Record<string, any> = {
          "mock-1": {
            titulo: "Como escolher o melhor profissional de saúde para você",
            subtitulo: "Dicas Práticas",
            imagem_capa: "https://images.unsplash.com/photo-1576091160550-217359f42f8c?auto=format&fit=crop&q=80&w=800",
            conteudo_completo: "<h1>Como escolher o melhor profissional de saúde</h1><p>Escolher um profissional de saúde é uma decisão importante que pode impactar diretamente sua qualidade de vida. Aqui estão alguns pontos fundamentais para levar em conta:</p><ul><li>Verifique a formação e especializações</li><li>Leia as avaliações de outros pacientes</li><li>Considere a facilidade de acesso (localização ou atendimento online)</li><li>Observe a empatia e o acolhimento no primeiro contato</li></ul>",
            tipo: "informativo",
            publicado_em: new Date().toISOString()
          },
          "mock-2": {
            titulo: "A importância do acompanhamento preventivo",
            subtitulo: "Saúde e Bem-estar",
            imagem_capa: "https://images.unsplash.com/photo-1505751172107-119f4a396440?auto=format&fit=crop&q=80&w=800",
            conteudo_completo: "<h1>A importância da prevenção</h1><p>Muitas vezes deixamos para procurar ajuda médica apenas quando sentimos dor, mas o acompanhamento preventivo é a chave para uma vida longa e saudável. Consultas regulares permitem detectar problemas precocemente, quando as chances de sucesso no tratamento são muito maiores.</p>",
            tipo: "informativo",
            publicado_em: new Date().toISOString()
          }
        };
        setContent(mockData[contentId]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.from("content_cards").select("*").eq("id", contentId).single();

      if (error) {
        console.error("Erro ao carregar conteúdo:", error);
      } else {
        setContent(data);
      }
    } catch (error) {
      console.error("Erro geral:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-4">Conteúdo não encontrado</p>
          <Button onClick={onBack}>Voltar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" onClick={onBack} className="mb-6">
          ← Voltar
        </Button>

        <article className="bg-card rounded-xl shadow-card overflow-hidden">
          {content.imagem_capa && (
            <img src={content.imagem_capa} alt={content.titulo} className="w-full h-96 object-cover" />
          )}

          <div className="p-8">
            <Badge className="mb-4" variant={content.tipo === "publicitario" ? "default" : "accent"}>
              {content.tipo === "publicitario" ? "Publicidade" : "Informativo"}
            </Badge>

            <h1 className="text-4xl font-bold font-display mb-4">{content.titulo}</h1>

            {content.subtitulo && <h2 className="text-xl text-muted-foreground mb-6">{content.subtitulo}</h2>}

            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.conteudo_completo) }}
            />

            {content.imagens_adicionais && content.imagens_adicionais.length > 0 && (
              <div className="mt-8 grid grid-cols-2 gap-4">
                {content.imagens_adicionais.map((img: string, idx: number) => (
                  <img key={idx} src={img} alt={`Imagem ${idx + 1}`} className="w-full h-64 object-cover rounded-lg" />
                ))}
              </div>
            )}

            {content.publicado_em && (
              <p className="text-sm text-muted-foreground mt-8">
                Publicado em: {new Date(content.publicado_em).toLocaleDateString("pt-BR")}
              </p>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}
