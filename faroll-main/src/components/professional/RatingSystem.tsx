import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface RatingSystemProps {
  professionalId: string;
  clientId: string;
  onRatingSubmitted?: () => void;
}

export interface ExistingRating {
  id: string;
  rating: number;
  comentario: string | null;
  anonimo: boolean;
  created_at: string;
  client_id: string;
}

interface Rating extends ExistingRating {
  profiles: {
    nome: string;
    avatar_url: string | null;
  } | null;
}

// Hook para buscar avaliação existente
export function useExistingRating(professionalId: string, clientId: string) {
  const [rating, setRating] = useState<ExistingRating | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRating = useCallback(async () => {
    if (!professionalId || !clientId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("professional_ratings")
        .select("id, rating, comentario, anonimo, created_at, client_id")
        .eq("professional_id", professionalId)
        .eq("client_id", clientId)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("Erro ao carregar avaliação:", error);
      }

      setRating(data);
    } catch (error) {
      console.error("Erro geral:", error);
    } finally {
      setLoading(false);
    }
  }, [professionalId, clientId]);

  useEffect(() => {
    fetchRating();
  }, [fetchRating]);

  return { rating, loading, refetch: fetchRating };
}

export function RatingSystem({ professionalId, clientId, onRatingSubmitted }: RatingSystemProps) {
  const [existingRating, setExistingRating] = useState<Rating | null>(null);
  const [hoveredStar, setHoveredStar] = useState<number>(0);
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [comentario, setComentario] = useState<string>("");
  const [anonimo, setAnonimo] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [hasVinculo, setHasVinculo] = useState<boolean>(false);

  useEffect(() => {
    checkVinculoAndLoadRating();
  }, [professionalId, clientId]);

  const checkVinculoAndLoadRating = async () => {
    try {
      setLoading(true);

      // Verificar se existe vínculo
      const { data: vinculoData, error: vinculoError } = await supabase
        .from("professional_client_links")
        .select("id")
        .eq("professional_id", professionalId)
        .eq("client_id", clientId)
        .maybeSingle();

      if (vinculoError) {
        console.error("Erro ao verificar vínculo:", vinculoError);
      }

      setHasVinculo(!!vinculoData);

      // Carregar avaliação existente
      const { data: ratingData, error: ratingError } = await supabase
        .from("professional_ratings")
        .select(
          `
          *,
          profiles!professional_ratings_client_id_fkey (
            nome,
            avatar_url
          )
        `,
        )
        .eq("professional_id", professionalId)
        .eq("client_id", clientId)
        .maybeSingle();

      if (ratingError && ratingError.code !== "PGRST116") {
        console.error("Erro ao carregar avaliação:", ratingError);
      }

      if (ratingData) {
        setExistingRating(ratingData);
        setSelectedRating(ratingData.rating);
        setComentario(ratingData.comentario || "");
        setAnonimo(ratingData.anonimo || false);
      }
    } catch (error) {
      console.error("Erro geral:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (selectedRating === 0) {
      toast.error("Selecione uma avaliação de 1 a 5 estrelas");
      return;
    }

    if (!hasVinculo) {
      toast.error("Você precisa ter um vínculo com este profissional para avaliá-lo");
      return;
    }

    try {
      setSubmitting(true);

      const ratingData = {
        professional_id: professionalId,
        client_id: clientId,
        rating: selectedRating,
        comentario: comentario.trim() || null,
        anonimo: anonimo,
      };

      let error;

      if (existingRating) {
        // Atualizar avaliação existente
        const result = await supabase.from("professional_ratings").update(ratingData).eq("id", existingRating.id);
        error = result.error;
      } else {
        // Criar nova avaliação
        const result = await supabase.from("professional_ratings").insert(ratingData);
        error = result.error;
      }

      if (error) {
        console.error("Erro ao salvar avaliação:", error);
        toast.error("Erro ao salvar avaliação");
        return;
      }

      toast.success(existingRating ? "Avaliação atualizada!" : "Avaliação enviada!");

      // Recarregar dados
      await checkVinculoAndLoadRating();

      // Callback opcional
      if (onRatingSubmitted) {
        onRatingSubmitted();
      }
    } catch (error) {
      console.error("Erro ao enviar avaliação:", error);
      toast.error("Erro ao enviar avaliação");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!existingRating) return;

    if (!confirm("Tem certeza que deseja excluir sua avaliação?")) {
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase.from("professional_ratings").delete().eq("id", existingRating.id);

      if (error) {
        console.error("Erro ao deletar avaliação:", error);
        toast.error("Erro ao deletar avaliação");
        return;
      }

      toast.success("Avaliação removida");

      // Resetar estado
      setExistingRating(null);
      setSelectedRating(0);
      setComentario("");
      setAnonimo(false);

      if (onRatingSubmitted) {
        onRatingSubmitted();
      }
    } catch (error) {
      console.error("Erro ao deletar avaliação:", error);
      toast.error("Erro ao deletar avaliação");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = () => {
    return (
      <div className="flex gap-2 justify-center my-6">
        {[1, 2, 3, 4, 5].map((star) => {
          const isSelected = star <= selectedRating;
          const isHovered = star <= hoveredStar;
          const shouldFill = isSelected || isHovered;

          return (
            <button
              key={star}
              type="button"
              onClick={() => setSelectedRating(star)}
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(0)}
              disabled={submitting || !hasVinculo}
              className="transition-transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Star
                className={`w-10 h-10 transition-colors ${
                  shouldFill ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-300"
                }`}
              />
            </button>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!hasVinculo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Avaliação</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            Você precisa ter um vínculo ativo com este profissional para poder avaliá-lo.
          </p>
          <p className="text-sm text-muted-foreground">
            Após aceitar uma proposta e realizar pelo menos uma sessão, você poderá deixar sua avaliação.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">{existingRating ? "Sua Avaliação" : "Avaliar Profissional"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderStars()}

        {selectedRating > 0 && (
          <div className="text-center text-sm font-medium mb-2">
            {selectedRating === 1 && "Muito insatisfeito"}
            {selectedRating === 2 && "Insatisfeito"}
            {selectedRating === 3 && "Neutro"}
            {selectedRating === 4 && "Satisfeito"}
            {selectedRating === 5 && "Muito satisfeito"}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="comentario">Comentário (opcional)</Label>
          <Textarea
            id="comentario"
            placeholder="Conte sobre sua experiência com este profissional..."
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            disabled={submitting}
            rows={4}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="anonimo"
            checked={anonimo}
            onCheckedChange={(checked) => setAnonimo(checked as boolean)}
            disabled={submitting}
          />
          <Label htmlFor="anonimo" className="text-sm font-normal cursor-pointer">
            Avaliar anonimamente
          </Label>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSubmit} disabled={submitting || selectedRating === 0} className="flex-1">
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : existingRating ? (
              "Atualizar Avaliação"
            ) : (
              "Enviar Avaliação"
            )}
          </Button>

          {existingRating && (
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
              Excluir
            </Button>
          )}
        </div>

        {existingRating && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Avaliação criada em: {new Date(existingRating.created_at).toLocaleDateString("pt-BR")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Componente para exibir lista de avaliações (para usar no perfil do profissional)
interface RatingsListProps {
  professionalId: string;
  limit?: number;
}

export function RatingsList({ professionalId, limit }: RatingsListProps) {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRatings();
  }, [professionalId]);

  const loadRatings = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from("professional_ratings")
        .select(
          `
          *,
          profiles!professional_ratings_client_id_fkey (
            nome,
            avatar_url
          )
        `,
        )
        .eq("professional_id", professionalId)
        .order("created_at", { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Erro ao carregar avaliações:", error);
        return;
      }

      setRatings(data || []);
    } catch (error) {
      console.error("Erro geral:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (ratings.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Nenhuma avaliação ainda.</p>
        <p className="text-sm mt-2">Seja o primeiro a avaliar este profissional!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {ratings.map((rating) => (
        <Card key={rating.id}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-semibold">{rating.anonimo ? "Anônimo" : rating.profiles?.nome || "Usuário"}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(rating.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
              {renderStars(rating.rating)}
            </div>
            {rating.comentario && <p className="text-sm text-muted-foreground mt-3">{rating.comentario}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
