import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useApp } from '@/contexts/AppContext';
import { MapPin, Globe, FileCheck, MessageCircle, Clock } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Navigation } from '@/components/layout/Navigation';
import { AutomationOfferCard } from '@/components/AutomationOfferCard';
import { professions } from '@/data/professions';

export function ProfileScreen() {
  const { selectedProfessional, navigate, getProfessionalSettings } = useApp();

  if (!selectedProfessional) {
    return null;
  }

  const p = selectedProfessional;
  const settings = getProfessionalSettings(p.id);
  const antecedenciaAgendamentoHoras = Math.floor(settings.antecedenciaAgendamento / 60);
  const antecedenciaCancelamentoHoras = Math.floor(settings.antecedenciaCancelamento / 60);

  // Busca o objeto Profession pelo nome da profissão do profissional selecionado,
  // para exibir o card de automação quando o usuário logado é profissional.
  const professionObj = professions.find(pr => pr.nome === p.profissao);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />
      
      <main className="p-4 max-w-2xl mx-auto">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <Card className="shadow-card border-0 overflow-hidden">
            <div className="gradient-health p-8 text-center">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="w-28 h-28 rounded-full mx-auto shadow-lg overflow-hidden border-4 border-card"
              >
                <img 
                  src={p.foto} 
                  alt={p.nome}
                  className="w-full h-full object-cover"
                />
              </motion.div>
              <h2 className="font-display text-2xl font-bold text-primary-foreground mt-4">
                {p.nome}
              </h2>
              <p className="text-primary-foreground/80 flex items-center justify-center gap-1 mt-1">
                <MapPin className="h-4 w-4" />
                {p.profissao} • {p.cidade}, {p.estado}
              </p>
            </div>

            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="font-display font-semibold mb-2">Sobre</h3>
                <p className="text-muted-foreground">{p.descricao}</p>
              </div>

              <div>
                <h3 className="font-display font-semibold mb-2">Especialidades</h3>
                <div className="flex flex-wrap gap-2">
                  {p.especialidades.map((esp) => (
                    <Badge key={esp} variant="secondary">
                      {esp}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-primary" />
                  <span>Tipo: {p.tipo}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FileCheck className="h-4 w-4 text-primary" />
                  <span>{p.registro}</span>
                </div>
              </div>

              {/* Regras de antecedência */}
              <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
                <Clock className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-sm">
                  <p className="font-medium text-amber-700 dark:text-amber-400 mb-1">Regras de Agendamento</p>
                  <p><strong>Antecedência para agendar:</strong> {antecedenciaAgendamentoHoras}h</p>
                  <p><strong>Cancelamento sem penalidade:</strong> até {antecedenciaCancelamentoHoras}h antes</p>
                </AlertDescription>
              </Alert>

              <Button 
                onClick={() => navigate('chat')} 
                className="w-full h-12 gap-2"
              >
                <MessageCircle className="h-5 w-5" />
                Iniciar Chat
              </Button>
            </CardContent>
          </Card>

          {/* Card de oferta de automação — exibido apenas para profissionais logados */}
          {user?.role === 'profissional' && professionObj && (
            <div className="mt-4">
              <AutomationOfferCard profession={professionObj} />
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
