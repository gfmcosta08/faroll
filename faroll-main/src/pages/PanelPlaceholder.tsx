import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, ArrowLeft } from "lucide-react";

const CONFIG: Record<string, { title: string; description: string }> = {
  saude: {
    title: "Health-App",
    description: "Gestão inteligente para sua clínica. Em produção este link abrirá o painel no mesmo domínio.",
  },
  imoveis: {
    title: "Fox Imobiliário",
    description: "Automação para corretores e imobiliárias. Em produção este link abrirá o painel no mesmo domínio.",
  },
};

export default function PanelPlaceholder() {
  const { app } = useParams<{ app: string }>();
  const config = app ? CONFIG[app] : null;

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted p-4">
        <div className="text-center max-w-md space-y-4">
          <h1 className="text-xl font-semibold">Painel não encontrado</h1>
          <Button asChild>
            <Link to="/" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao FarolBR
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <div className="text-center max-w-md space-y-6 bg-card rounded-2xl shadow-lg border p-8">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
            <LayoutDashboard className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h1 className="text-2xl font-bold">{config.title}</h1>
        <p className="text-muted-foreground text-sm">{config.description}</p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button asChild>
            <Link to="/" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao FarolBR
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
