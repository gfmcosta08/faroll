import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Star, MapPin, Search, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Professional {
  id: string;
  nome: string;
  avatar_url: string | null;
  profissao: string | null;
  profession_id: string | null;
  especialidades: string[] | null;
  cidade: string | null;
  estado: string | null;
  rating_average: number | null;
  rating_count: number | null;
  perfil_ativo: boolean | null;
  user_id: string;
}

interface Profession {
  id: string;
  nome: string;
}

export const ProfessionalGallery: React.FC = () => {
  const navigate = useNavigate();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [professions, setProfessions] = useState<Profession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProfession, setSelectedProfession] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");

  useEffect(() => {
    fetchProfessions();
    fetchProfessionals();
  }, []);

  const fetchProfessions = async () => {
    try {
      const { data, error } = await supabase.from("professions").select("id, nome").order("nome");

      if (error) throw error;
      setProfessions(data || []);
    } catch (error) {
      console.error("Erro ao buscar profissões:", error);
    }
  };

  const fetchProfessionals = async () => {
    try {
      setLoading(true);

      const { data: profilesData, error: profilesError } = await supabase.from("profiles").select(`
          id,
          nome,
          avatar_url,
          profissao,
          profession_id,
          especialidades,
          cidade,
          estado,
          rating_average,
          rating_count,
          perfil_ativo,
          user_id
        `);

      if (profilesError) {
        console.error("Erro ao buscar perfis:", profilesError);
        throw profilesError;
      }

      if (!profilesData) {
        setProfessionals([]);
        return;
      }

      const userIds = profilesData.map((p) => p.user_id).filter(Boolean);

      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);

      if (rolesError) {
        console.error("Erro ao buscar roles:", rolesError);
      }

      const professionalsWithRoles = profilesData.filter((profile) => {
        const userRole = rolesData?.find((r) => r.user_id === profile.user_id);
        return userRole?.role === "profissional";
      });

      console.log("Profissionais encontrados:", professionalsWithRoles);
      setProfessionals(professionalsWithRoles);
    } catch (error) {
      console.error("Erro geral ao buscar profissionais:", error);
      setProfessionals([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProfessionals = professionals.filter((prof) => {
    const especialidadesText = prof.especialidades?.join(' ').toLowerCase() || '';
    const matchesSearch =
      prof.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prof.profissao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      especialidadesText.includes(searchTerm.toLowerCase());

    const matchesProfession =
      selectedProfession === "all" ||
      prof.profession_id === selectedProfession ||
      prof.profissao?.toLowerCase() === professions.find((p) => p.id === selectedProfession)?.nome.toLowerCase();

    const matchesCity = selectedCity === "all" || prof.cidade === selectedCity;

    return matchesSearch && matchesProfession && matchesCity;
  });

  const uniqueCities = Array.from(new Set(professionals.map((p) => p.cidade).filter(Boolean)));

  const renderStars = (rating: number | null) => {
    const stars = rating || 0;
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={16} className={i < stars ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
        ))}
        <span className="text-sm text-gray-600 ml-1">({rating?.toFixed(1) || "0.0"})</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando profissionais...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Galeria de Profissionais</h1>
        <p className="text-gray-600">Encontre o profissional ideal para você</p>
      </div>

      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <Input
                placeholder="Buscar por nome, profissão ou especialidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Select value={selectedProfession} onValueChange={setSelectedProfession}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Profissão" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Profissão</SelectItem>
              {professions.map((prof) => (
                <SelectItem key={prof.id} value={prof.id}>
                  {prof.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedCity} onValueChange={setSelectedCity}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Cidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Cidade</SelectItem>
              {uniqueCities.map((city) => (
                <SelectItem key={city} value={city!}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Filter size={16} />
          <span>{filteredProfessionals.length} profissionais encontrados</span>
        </div>
      </div>

      {filteredProfessionals.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Nenhum profissional encontrado</p>
          <p className="text-gray-400 mt-2">Tente ajustar os filtros de busca</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfessionals.map((prof) => (
            <Card
              key={prof.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/professional/${prof.id}`)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {prof.avatar_url ? (
                      <img src={prof.avatar_url} alt={prof.nome} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-primary">{prof.nome?.charAt(0).toUpperCase()}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg mb-1 truncate">{prof.nome}</h3>
                    <p className="text-sm text-gray-600 mb-2">{prof.profissao || "Profissão não informada"}</p>
                    {prof.especialidades && prof.especialidades.length > 0 && (
                      <p className="text-xs text-gray-500 mb-2 line-clamp-2">{prof.especialidades.join(', ')}</p>
                    )}

                    <div className="mb-2">
                      {renderStars(prof.rating_average)}
                      <span className="text-xs text-gray-500">{prof.rating_count || 0} avaliações</span>
                    </div>

                    {(prof.cidade || prof.estado) && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin size={12} />
                        <span>
                          {prof.cidade && prof.estado ? `${prof.cidade}, ${prof.estado}` : prof.cidade || prof.estado}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  className="w-full mt-4"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/professional/${prof.id}`);
                  }}
                >
                  Ver Perfil
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
