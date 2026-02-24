import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Header } from "@/components/layout/Header";
import { Navigation } from "@/components/layout/Navigation";
import { CalendarDays, Clock, ArrowLeft, AlertTriangle, Check, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useApp } from "@/contexts/AppContext";
import { toast } from "sonner";
import { useCanScheduleWithProfessional, useGcoinBalanceForLink, useCreateAppointment } from "@/hooks/useGcoinsQuery";

const timeSlots = ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

export function ProfessionalCalendarScreen() {
  const {
    user,
    selectedProfessional,
    navigate,
    goBack,
    isDateBlocked,
    isTimeSlotAvailable,
    getAppointmentsForProfessional,
    getProfessionalSettings,
  } = useApp();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Hooks de integração com banco de dados
  const { data: canScheduleFromDB, isLoading: isLoadingPermission } = useCanScheduleWithProfessional(selectedProfessional?.id);
  const { data: gcoinBalance } = useGcoinBalanceForLink(selectedProfessional?.id);
  const createAppointmentMutation = useCreateAppointment();

  if (!selectedProfessional) {
    navigate("contatos");
    return null;
  }

  // 🔒 Dependente NÃO acessa agenda profissional
  if (user?.role === "dependente") {
    navigate("contatos");
    return null;
  }

  const appointments = getAppointmentsForProfessional(selectedProfessional.id);
  const settings = getProfessionalSettings(selectedProfessional.id);

  /**
   * REGRA DE OURO:
   * - Quem possui Gcoins no vínculo específico pode agendar
   * - Profissional pode agendar com OUTRO profissional
   * - Profissional NÃO agenda a PRÓPRIA agenda
   */
  const isOwnAgenda = user?.role === "profissional" && user?.id === selectedProfessional.id;

  // Usa permissão do banco se disponível, senão fallback para lógica local
  const canSchedule = (canScheduleFromDB ?? false) && !isOwnAgenda;

  const antecedenciaAgendamentoHoras = Math.floor(settings.antecedenciaAgendamento / 60);
  const antecedenciaCancelamentoHoras = Math.floor(settings.antecedenciaCancelamento / 60);

  const isDateFullyBlocked = isDateBlocked(selectedProfessional.id, selectedDate);

  const getSlotStatus = (hora: string): "available" | "blocked" | "occupied" => {
    if (isDateBlocked(selectedProfessional.id, selectedDate, hora)) {
      return "blocked";
    }
    if (!isTimeSlotAvailable(selectedProfessional.id, selectedDate, hora)) {
      return "occupied";
    }
    return "available";
  };

  const handleSchedule = async () => {
    if (!selectedTime || !canSchedule || !selectedProfessional) return;

    try {
      // Usa mutation do banco de dados (trigger consome Gcoin automaticamente)
      await createAppointmentMutation.mutateAsync({
        professional_id: selectedProfessional.id,
        data: format(selectedDate, "yyyy-MM-dd"),
        hora_inicio: selectedTime,
        titulo: `Consulta com ${selectedProfessional.nome}`,
      });

      toast.success("Agendamento confirmado! 1 Gcoin consumido.");
      setSelectedTime(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao agendar";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />

      <main className="p-4 max-w-4xl mx-auto space-y-4">
        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="icon" onClick={goBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Agenda de {selectedProfessional.nome}</h1>
          </div>

          {/* Saldo de Gcoins */}
          {gcoinBalance && (
            <Alert className="mb-4 border-primary/50 bg-primary/10">
              <Check className="h-4 w-4 text-primary" />
              <AlertDescription className="text-sm">
                <strong>Saldo disponível:</strong> {gcoinBalance.disponivel} Gcoins
                {gcoinBalance.consumido > 0 && ` (${gcoinBalance.consumido} consumidos)`}
              </AlertDescription>
            </Alert>
          )}

          {/* Avisos de permissão */}
          {!isLoadingPermission && !canSchedule && (
            <Alert className="mb-4 border-destructive/50 bg-destructive/10">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-sm">
                <strong>Apenas visualização:</strong>{" "}
                {isOwnAgenda
                  ? "Você não pode agendar na sua própria agenda."
                  : "Você não possui Gcoins neste vínculo para agendar."}
              </AlertDescription>
            </Alert>
          )}

          {/* Regras de antecedência */}
          <Alert className="mb-4 border-warning/50 bg-warning/10">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertDescription className="text-sm">
              <strong>Regras:</strong> Antecedência mínima para agendamento: {antecedenciaAgendamentoHoras}h |
              Cancelamento sem penalidade até {antecedenciaCancelamentoHoras}h antes
            </AlertDescription>
          </Alert>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Calendário */}
            <Card className="shadow-card border-0">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  Selecione a Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      setSelectedDate(date);
                      setSelectedTime(null);
                    }
                  }}
                  locale={ptBR}
                  disabled={(date) => date < new Date()}
                  className="rounded-md"
                />
              </CardContent>
            </Card>

            {/* Horários */}
            <Card className="shadow-card border-0">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5 text-primary" />
                  Horários — {format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}
                  {!canSchedule && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      Somente visualização
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isDateFullyBlocked ? (
                  <Alert className="border-destructive/50 bg-destructive/10">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <AlertDescription>Este dia está bloqueado pelo profissional.</AlertDescription>
                  </Alert>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {timeSlots.map((hora) => {
                      const status = getSlotStatus(hora);
                      const isSelected = selectedTime === hora;

                      return (
                        <Button
                          key={hora}
                          variant={isSelected ? "default" : status === "available" ? "outline" : "ghost"}
                          className={
                            status === "blocked"
                              ? "opacity-50 line-through bg-destructive/10"
                              : status === "occupied"
                                ? "opacity-50 bg-muted"
                                : ""
                          }
                          disabled={status !== "available" || !canSchedule}
                          onClick={() => setSelectedTime(hora)}
                        >
                          {hora}
                        </Button>
                      );
                    })}
                  </div>
                )}

                {selectedTime && canSchedule && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 rounded-lg bg-primary/10 border border-primary/20"
                  >
                    <p className="text-sm mb-3">
                      <strong>Confirmar agendamento:</strong>
                      <br />
                      {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} às {selectedTime}
                      <br />
                      <span className="text-muted-foreground">
                        (1 Gcoin será consumido)
                      </span>
                    </p>
                    <Button 
                      onClick={handleSchedule} 
                      className="w-full gap-2"
                      disabled={createAppointmentMutation.isPending}
                    >
                      {createAppointmentMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Agendando...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4" />
                          Confirmar Agendamento
                        </>
                      )}
                    </Button>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
