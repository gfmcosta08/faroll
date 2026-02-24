import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/contexts/AppContext";
import { Search, MapPin, User, Loader2, Filter } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Navigation } from "@/components/layout/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { Professional } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { countries, getStatesByCountry, getCitiesByState } from "@/data/locations";

interface ProfessionalDB {
  id: string;
  nome: string;
  avatar_url: string | null;
  profissao: string | null;
  profession_id: string | null;
  especialidades: string[] | null;
  specialization_ids: string[] | null;
  cidade: string | null;
  estado: string | null;
  pais: string | null;
  descricao: string | null;
  tipo_atendimento: string | null;
  registro: string | null;
  user_id: string;
  perfil_ativo: boolean | null;
  antecedencia_agendamento: number | null;
  antecedencia_cancelamento: number | null;
}

interface Profession {
  id: string;
  nome: string;
}

interface Specialization {
  id: string;
  nome: string;
  profession_id: string | null;
}

export function GalleryScreen() {
  const appContext = useApp();
  const [professionals, setProfessionals] = useState<ProfessionalDB[]>([]);
  const [professions, setProfessions] = useState<Profession[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Filter states
  const [selectedProfession, setSelectedProfession] = useState<string>("all");
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>("all");
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [selectedState, setSelectedState] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [selectedAttendanceType, setSelectedAttendanceType] = useState<string>("all");

  useEffect(() => {
    fetchProfessions();
    fetchSpecializations();
    fetchProfessionals();
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
      console.error("[GalleryScreen] Erro ao buscar profissões:", error);
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
      console.error("[GalleryScreen] Erro ao buscar especializações:", error);
    }
  };

  const fetchProfessionals = async () => {
    try {
      setLoading(true);
      console.log("[GalleryScreen] Buscando profissionais ativos...");

      // RLS já filtra apenas profissionais ativos (via is_professional_profile)
      // Filtramos perfil_ativo=true no banco para garantir
      // Filtra apenas profissionais ativos COM profissão definida
      // Clientes não preenchem o campo profissao, então esse filtro os exclui
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .eq("perfil_ativo", true)
        .not("profissao", "is", null);

      if (profilesError) {
        console.error("[GalleryScreen] Erro ao buscar perfis:", profilesError);
        throw profilesError;
      }

      console.log("[GalleryScreen] Profissionais encontrados:", profilesData?.length || 0);
      setProfessionals(profilesData || []);
    } catch (error) {
      console.error("[GalleryScreen] Erro geral:", error);
      setProfessionals([]);
    } finally {
      setLoading(false);
    }
  };

  // Reset dependent filters when parent changes
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

  // Get filtered specializations based on selected profession
  const filteredSpecializations = selectedProfession === "all"
    ? specializations
    : specializations.filter(s => s.profession_id === selectedProfession);

  // Get available states based on selected country
  const availableStates = selectedCountry === "all" ? [] : getStatesByCountry(selectedCountry);

  // Get available cities based on selected state
  const availableCities = selectedState === "all" ? [] : getCitiesByState(selectedState);

  // Get unique locations from professionals for dynamic filtering
  const uniqueCountries = Array.from(new Set(professionals.map(p => p.pais).filter(Boolean)));
  const uniqueStates = Array.from(new Set(professionals.map(p => p.estado).filter(Boolean)));
  const uniqueCities = Array.from(new Set(professionals.map(p => p.cidade).filter(Boolean)));

  if (!appContext) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const { selectProfessional, navigate } = appContext;

  const filteredProfessionals = professionals.filter((prof) => {
    // Text search
    const searchLower = search.toLowerCase();
    const matchesSearch = !search.trim() ||
      prof.nome?.toLowerCase().includes(searchLower) ||
      prof.profissao?.toLowerCase().includes(searchLower) ||
      (prof.especialidades?.join(' ').toLowerCase() || '').includes(searchLower);

    // Profession filter
    const matchesProfession = selectedProfession === "all" ||
      prof.profession_id === selectedProfession ||
      prof.profissao?.toLowerCase() === professions.find(p => p.id === selectedProfession)?.nome.toLowerCase();

    // Specialization filter
    const matchesSpecialization = selectedSpecialization === "all" ||
      prof.specialization_ids?.includes(selectedSpecialization) ||
      prof.especialidades?.some(e =>
        e.toLowerCase() === specializations.find(s => s.id === selectedSpecialization)?.nome.toLowerCase()
      );

    // Country filter
    const matchesCountry = selectedCountry === "all" || prof.pais === selectedCountry ||
      prof.pais === countries.find(c => c.code === selectedCountry)?.name;

    // State filter
    const matchesState = selectedState === "all" || prof.estado === selectedState ||
      prof.estado === availableStates.find(s => s.code === selectedState)?.name;

    // City filter
    const matchesCity = selectedCity === "all" || prof.cidade === selectedCity;

    // Attendance type filter
    const matchesAttendanceType = selectedAttendanceType === "all" ||
      prof.tipo_atendimento?.toLowerCase() === selectedAttendanceType.toLowerCase();

    return matchesSearch && matchesProfession && matchesSpecialization && matchesCountry && matchesState && matchesCity && matchesAttendanceType;
  });

  const handleSelectProfessional = (prof: ProfessionalDB) => {
    const professional: Professional = {
      id: prof.id,
      nome: prof.nome,
      profissao: prof.profissao || "",
      especialidades: prof.especialidades || [],
      pais: prof.pais || "Brasil",
      estado: prof.estado || "",
      cidade: prof.cidade || "",
      tipo: (prof.tipo_atendimento as "Online" | "Presencial" | "Ambos") || "Online",
      descricao: prof.descricao || "",
      registro: prof.registro || "",
      foto: prof.avatar_url || "",
      antecedenciaAgendamento: prof.antecedencia_agendamento || 1440,
      antecedenciaCancelamento: prof.antecedencia_cancelamento || 2880,
    };
    selectProfessional(professional);
    navigate("perfil");
  };

  const activeFiltersCount = [
    selectedProfession !== "all",
    selectedSpecialization !== "all",
    selectedCountry !== "all",
    selectedState !== "all",
    selectedCity !== "all",
    selectedAttendanceType !== "all",
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />

      <main className="p-4 max-w-4xl mx-auto">
        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="space-y-4">
          {/* Search and Filters Card */}
          <Card className="shadow-card border-0">
            <CardContent className="p-4 space-y-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, profissão ou especialidade..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
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

              {/* Results count */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter size={16} />
                <span>
                  {filteredProfessionals.length} profissional{filteredProfessionals.length !== 1 ? 'is' : ''} encontrado{filteredProfessionals.length !== 1 ? 's' : ''}
                  {activeFiltersCount > 0 && ` (${activeFiltersCount} filtro${activeFiltersCount !== 1 ? 's' : ''} ativo${activeFiltersCount !== 1 ? 's' : ''})`}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Results List */}
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Carregando profissionais...</p>
              </div>
            ) : filteredProfessionals.length > 0 ? (
              filteredProfessionals.map((professional, index) => (
                <motion.div
                  key={professional.id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className="shadow-card border-0 cursor-pointer transition-all hover:shadow-lg"
                    onClick={() => handleSelectProfessional(professional)}
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {professional.avatar_url ? (
                          <img
                            src={professional.avatar_url}
                            alt={professional.nome}
                            className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                            <User className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg truncate">{professional.nome}</h3>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>
                              {professional.profissao || "Profissional"} • {professional.cidade || "Online"}
                            </span>
                          </div>
                          {professional.descricao && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{professional.descricao}</p>
                          )}
                          {professional.especialidades && professional.especialidades.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {professional.especialidades.slice(0, 3).map((esp, i) => (
                                <Badge key={i} variant="specialty" className="text-xs">
                                  {esp}
                                </Badge>
                              ))}
                              {professional.especialidades.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{professional.especialidades.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">Nenhum profissional encontrado</p>
                <p className="text-sm mt-1">
                  {professionals.length === 0
                    ? "Ainda não há profissionais cadastrados no sistema"
                    : "Tente ajustar os filtros de busca"}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
