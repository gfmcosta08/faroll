import { useState, useEffect } from "react";
import DOMPurify from "dompurify";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Star, ArrowRight, Sparkles, Calendar, User, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { countries, getStatesByCountry, getCitiesByState } from "@/data/locations";
import { Input } from "@/components/ui/input";
import { LighthouseLogo } from "./LighthouseLogo";

interface Profession {
  id: string;
  nome: string;
}

interface Specialization {
  id: string;
  nome: string;
  profession_id: string | null;
}


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

  // Filter states
  const [selectedProfession, setSelectedProfession] = useState<string>("all");
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>("all");
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [selectedState, setSelectedState] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [selectedAttendanceType, setSelectedAttendanceType] = useState<string>("all");
  const [searchText, setSearchText] = useState("");

  const [professions, setProfessions] = useState<Profession[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);

  useEffect(() => {
    loadData();
    fetchProfessions();
    fetchSpecializations();
  }, []);

  const fetchProfessions = async () => {
    try {
      const { data, error } = await supabase
        .from("professions")
        .select("id, nome")
        .eq("ativa", true)
        .order("nome");

      if (error) throw error;
      setProfessions(data || []);
    } catch (error) {
      console.error("Erro ao buscar profissões:", error);
    }
  };

  const fetchSpecializations = async () => {
    try {
      const { data, error } = await supabase
        .from("specializations")
        .select("id, nome, profession_id")
        .eq("ativa", true)
        .order("nome");

      if (error) throw error;
      setSpecializations(data || []);
    } catch (error) {
      console.error("Erro ao buscar especializações:", error);
    }
  };

  const handleCountryChange = (value: string) => {
    setSelectedCountry(value);
    setSelectedState("all");
    setSelectedCity("all");
  };

  const handleStateChange = (value: string) => {
    setSelectedState(value);
    setSelectedCity("all");
  };

  const handleProfessionChange = (value: string) => {
    setSelectedProfession(value);
    setSelectedSpecialization("all");
  };

  const filteredSpecializations = selectedProfession === "all"
    ? specializations
    : specializations.filter(s => s.profession_id === selectedProfession);

  const availableStates = selectedCountry === "all" ? [] : getStatesByCountry(selectedCountry);
  const availableCities = selectedState === "all" ? [] : getCitiesByState(selectedState);

  const loadData = async () => {
    try {
      setLoading(true);

      // Carregar top 5 profissionais mais bem avaliados
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
        .gt("rating_count", 0)
        .order("rating_average", { ascending: false })
        .order("rating_count", { ascending: false })
        .limit(5);

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

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= Math.round(rating) ? "fill-warning text-warning" : "fill-muted text-muted"
              }`}
          />
        ))}
        <span className="ml-1 text-sm text-muted-foreground">
          {rating.toFixed(1)} ({topProfessionals.find((p) => p.rating_average === rating)?.rating_count || 0})
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto px-4 h-[70px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LighthouseLogo size={40} />
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onLogin}>
              Entrar
            </Button>
            <Button variant="ghost" onClick={onRegister}>
              Cadastre-se
            </Button>
          </div>
        </div>
      </header>

      <section className="py-20 px-4 gradient-farol relative overflow-hidden">
        <div className="absolute inset-0 bg-black/5 pointer-events-none" />
        <div className="container mx-auto text-center max-w-4xl relative z-10">
          <h2 className="text-5xl md:text-6xl font-bold font-display mb-6 text-primary-foreground leading-tight">
            Seu sinal seguro para encontrar o cuidado que você precisa
          </h2>
          <p className="text-xl md:text-2xl text-primary-foreground/90 max-w-2xl mx-auto">
            Como um farol que guia navegantes em águas desconhecidas, nós orientamos você até profissionais de confiança.
          </p>
        </div>
      </section>

      {/* Top 5 Profissionais Mais Bem Avaliados */}
      <section className="py-16 px-4 bg-secondary">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold font-display mb-3 text-foreground">Profissionais Mais Bem Avaliados</h3>
            <p className="text-muted-foreground">
              Conheça os profissionais com as melhores avaliações da nossa plataforma
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="w-20 h-20 bg-muted rounded-full mx-auto" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-muted rounded mb-2" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : topProfessionals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {topProfessionals.map((professional) => (
                <Card
                  key={professional.id}
                  className="card-hover border-2 hover:border-primary/30"
                >
                  <CardHeader className="text-center pb-4">
                    <Avatar className="w-24 h-24 mx-auto mb-3 ring-4 ring-primary/20">
                      <AvatarImage src={professional.avatar_url || undefined} alt={professional.nome} />
                      <AvatarFallback className="text-lg gradient-farol text-primary-foreground">
                        {getInitials(professional.nome)}
                      </AvatarFallback>
                    </Avatar>
                    <h4 className="font-semibold text-lg">{professional.nome}</h4>
                    <p className="text-sm text-muted-foreground">{professional.profissao}</p>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {professional.descricao && (
                      <p className="text-sm text-muted-foreground line-clamp-3">{professional.descricao}</p>
                    )}

                    {professional.specialization_names.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {professional.specialization_names.slice(0, 2).map((spec, idx) => (
                          <Badge key={idx} variant="specialty" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                        {professional.specialization_names.length > 2 && (
                          <Badge variant="specialty" className="text-xs">
                            +{professional.specialization_names.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="flex flex-col items-center gap-2 pt-4 border-t">
                    {renderStars(professional.rating_average)}
                    <Button size="sm" variant="outline" className="w-full" onClick={onRegister}>
                      <Calendar className="w-4 h-4 mr-2" />
                      Ver Perfil
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhum profissional avaliado ainda.</p>
            </div>
          )}
        </div>
      </section>

      {/* Nossa Essência */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border-8 border-primary/5">
              <img
                src="/logo-farollbr.jpeg"
                alt="Logo original FarollBr"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
            <div className="space-y-6">
              <h3 className="text-4xl font-bold font-display text-primary">Nossa Essência</h3>
              <div className="space-y-4 text-muted-foreground text-lg leading-relaxed">
                <p>
                  O farol simboliza a luz que guia para o caminho seguro, para a direção correta, para o destino onde se pretende chegar. Para os marinheiros e pescadores, o farol representa coragem para enfrentar a força do mar e o poder da natureza.
                </p>
                <div className="bg-primary/5 p-6 rounded-2xl border-l-4 border-primary italic py-4">
                  "Quero que meu trabalho seja LUZ! Quero dar a orientação que eles precisam, guiá-los para o caminho seguro, e incentivá-los a ter esperança no futuro, para que enfim, sintam-se mais felizes!"
                </div>
                <p>
                  Quando as pessoas buscam ajuda, geralmente estão cheias de dúvidas e incertezas. Sentem-se inseguras, como marinheiros num mar revolto. O <strong>FarollBr</strong> nasceu para ser esse ponto de luz, oferecendo clareza e segurança na sua jornada de cuidado.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold font-display mb-3 text-foreground">Como Funciona</h3>
            <p className="text-muted-foreground">Simples, rápido e seguro para todos os perfis</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6 rounded-2xl bg-primary/5 border border-primary/10">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-primary" />
              </div>
              <h4 className="font-semibold text-lg mb-2">Cliente</h4>
              <p className="text-sm text-muted-foreground">Cadastre-se, encontre profissionais e agende consultas</p>
            </div>
            <div className="text-center p-6 rounded-2xl bg-accent/5 border border-accent/10">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-accent" />
              </div>
              <h4 className="font-semibold text-lg mb-2">Profissional</h4>
              <p className="text-sm text-muted-foreground">Gerencie sua agenda, atenda clientes e receba avaliações</p>
            </div>
            <div className="text-center p-6 rounded-2xl bg-coral/5 border border-coral/10">
              <div className="w-16 h-16 rounded-full bg-coral/10 flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-coral" />
              </div>
              <h4 className="font-semibold text-lg mb-2">Dependente</h4>
              <p className="text-sm text-muted-foreground">Familiares gerenciam consultas de quem precisa de cuidado</p>
            </div>
            <div className="text-center p-6 rounded-2xl bg-warning/5 border border-warning/10">
              <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-warning" />
              </div>
              <h4 className="font-semibold text-lg mb-2">Secretária</h4>
              <p className="text-sm text-muted-foreground">Auxilie profissionais na gestão de agenda e atendimentos</p>
            </div>
          </div>
        </div>
      </section>

      {/* Seção de Busca com Filtros */}
      <section className="py-12 px-4 bg-secondary">
        <div className="container mx-auto max-w-6xl">
          <h3 className="text-2xl font-bold font-display mb-6 text-center">
            Encontre o profissional ideal
          </h3>

          <div className="bg-card rounded-xl shadow-card p-6 space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, profissão ou especialidade..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Profession Filter */}
              <Select value={selectedProfession} onValueChange={handleProfessionChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Profissão" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="all">Profissão</SelectItem>
                  {professions.map((prof) => (
                    <SelectItem key={prof.id} value={prof.id}>
                      {prof.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Specialization Filter */}
              <Select value={selectedSpecialization} onValueChange={setSelectedSpecialization}>
                <SelectTrigger>
                  <SelectValue placeholder="Especialização" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="all">Especialização</SelectItem>
                  {filteredSpecializations.map((spec) => (
                    <SelectItem key={spec.id} value={spec.id}>
                      {spec.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Country Filter */}
              <Select value={selectedCountry} onValueChange={handleCountryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="País" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">País</SelectItem>
                  {countries.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* State Filter */}
              <Select
                value={selectedState}
                onValueChange={handleStateChange}
                disabled={selectedCountry === "all"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Estado</SelectItem>
                  {availableStates.map((state) => (
                    <SelectItem key={state.code} value={state.code}>
                      {state.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* City Filter */}
              <Select
                value={selectedCity}
                onValueChange={setSelectedCity}
                disabled={selectedState === "all"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Cidade" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="all">Cidade</SelectItem>
                  {availableCities.map((city) => (
                    <SelectItem key={city.name} value={city.name}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Attendance Type Filter */}
              <Select value={selectedAttendanceType} onValueChange={setSelectedAttendanceType}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de Atendimento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tipo de Atendimento</SelectItem>
                  <SelectItem value="presencial">Presencial</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="hibrido">Híbrido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search Button */}
            <Button
              size="lg"
              onClick={onRegister}
              className="w-full"
            >
              <Search className="w-5 h-5 mr-2" />
              Buscar Profissionais
            </Button>
          </div>
        </div>
      </section>

      {/* Seção de Vídeos - YouTube */}
      <section className="py-20 px-4 bg-muted/30 border-y">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold font-display mb-3 text-foreground">Vídeos Informativos</h3>
            <p className="text-muted-foreground">Confira nossos conteúdos exclusivos em nosso canal do YouTube</p>
          </div>

          <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl border-4 border-card relative group">
            <iframe
              className="w-full h-full"
              src="https://www.youtube.com/embed/dQw4w9WgXcQ" // Link placeholder, usuário pode informar o real depois
              title="Farollbr Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            ></iframe>
          </div>

          <div className="mt-8 text-center">
            <Button size="lg" variant="outline" className="rounded-full px-8">
              Inscreva-se em nosso canal
            </Button>
          </div>
        </div>
      </section>

      {/* Notícias e Artigos Informativos */}
      {contentCards.length > 0 && (
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold font-display mb-3 text-foreground">Notícias e Artigos Informativos</h3>
              <p className="text-muted-foreground">Fique por dentro das novidades e dicas de saúde e bem-estar (WordPress)</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {contentCards.slice(0, 2).map((card) => (
                <Card
                  key={card.id}
                  className="card-hover cursor-pointer group border-0 shadow-lg overflow-hidden"
                  onClick={() => handleContentClick(card.id)}
                >
                  {card.imagem_capa && (
                    <div className="relative h-56 overflow-hidden">
                      <img
                        src={card.imagem_capa}
                        alt={card.titulo}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <Badge
                        className="absolute top-4 right-4"
                        variant={card.tipo === "publicitario" ? "default" : "accent"}
                      >
                        {card.tipo === "publicitario" ? "Especial" : "Artigo"}
                      </Badge>
                    </div>
                  )}
                  <CardHeader>
                    <h4 className="font-bold text-xl group-hover:text-primary transition-colors line-clamp-2">{card.titulo}</h4>
                    {card.subtitulo && <p className="text-sm text-primary font-medium">{card.subtitulo}</p>}
                  </CardHeader>
                  {card.preview && (
                    <CardContent>
                      <p className="text-muted-foreground line-clamp-3 leading-relaxed">{card.preview}</p>
                    </CardContent>
                  )}
                  <CardFooter className="border-t bg-muted/30 pt-4">
                    <Button variant="link" className="px-0 text-primary font-bold group-hover:underline">
                      Continuar lendo no blog
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-12 px-4 border-t bg-card">
        <div className="container mx-auto flex flex-col items-center text-center">
          <LighthouseLogo size={32} className="mb-4 opacity-80" />
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            FarollBr: Navegue com clareza. Agende com segurança.
          </p>
          <div className="mt-8 pt-8 border-t w-full text-sm text-muted">
            <p>&copy; 2026 Farollbr. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
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
