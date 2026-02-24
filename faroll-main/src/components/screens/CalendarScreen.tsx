import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarWithDots } from "@/components/ui/calendar-with-dots";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Header } from "@/components/layout/Header";
import { Navigation } from "@/components/layout/Navigation";
import { CalendarDays, Clock, User, Lock, Settings, Trash2, UserCheck, Plus, X } from "lucide-react";
import { format, isSameDay, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useApp } from "@/contexts/AppContext";
import { toast } from "sonner";

export function CalendarScreen() {
  const app = useApp();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showEventForm, setShowEventForm] = useState(false);

  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventStartTime, setEventStartTime] = useState("09:00");
  const [eventEndTime, setEventEndTime] = useState("10:00");

  if (!app) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando calendário...</p>
      </div>
    );
  }

  const {
    navigate,
    scheduleBlocks = [],
    user,
    contacts = [],
    getPersonalEvents,
    addPersonalEvent,
    removePersonalEvent,
    getAppointmentsForClient,
    getAppointmentsForProfessional,
    professionals = [],
    cancelAppointment,
  } = app;

  const isClient = user?.role === "cliente";
  const isProfessional = user?.role === "profissional";
  const userId = user?.id;

  const clientAppointments = getAppointmentsForClient();
  const professionalAppointments = isProfessional && userId ? getAppointmentsForProfessional(userId) : [];
  const allAppointments = isClient ? clientAppointments : professionalAppointments;
  const appointmentsForDate = allAppointments.filter((apt) => isSameDay(new Date(apt.data), selectedDate));

  const personalEvents = getPersonalEvents();
  const userPersonalEvents = personalEvents.filter((e) => e.userId === userId);
  const personalEventsForDate = userPersonalEvents.filter((e) => isSameDay(new Date(e.data), selectedDate));

  const getRelevantBlocks = () => {
    if (isProfessional && userId) {
      return scheduleBlocks.filter(b => b.profissionalId === userId);
    }
    if (isClient) {
      const linkedProfessionalIds = contacts
        .filter(c => c.propostaAceita)
        .map(c => c.profissionalId);
      return scheduleBlocks.filter(b => linkedProfessionalIds.includes(b.profissionalId));
    }
    return [];
  };

  const relevantBlocks = getRelevantBlocks();
  const blockedDates: Date[] = [];
  relevantBlocks.forEach((block) => {
    let current = new Date(block.dataInicio);
    const end = new Date(block.dataFim);
    while (current <= end) {
      blockedDates.push(new Date(current));
      current = addDays(current, 1);
    }
  });

  const blocksForSelectedDate = relevantBlocks.filter(
    (b) => selectedDate >= new Date(b.dataInicio) && selectedDate <= new Date(b.dataFim),
  );

  const datesWithAppointments = allAppointments.map((apt) => new Date(apt.data));
  const datesWithPersonalEvents = userPersonalEvents.map((e) => new Date(e.data));

  const getProfessionalName = (id: string) => professionals.find((p) => p.id === id)?.nome || "Profissional";
  const getClientName = (apt: typeof allAppointments[0]) => apt.clienteNome || "Cliente";

  const [formType, setFormType] = useState<"evento" | "bloqueio">("evento");
  const [blockType, setBlockType] = useState<"dia" | "periodo">("dia");

  const handleCreateEvent = () => {
    if (formType === "evento") {
      if (!eventTitle.trim()) {
        toast.error("Digite um título para o evento");
        return;
      }

      addPersonalEvent({
        titulo: eventTitle,
        descricao: eventDescription || undefined,
        data: selectedDate,
        horaInicio: eventStartTime,
        horaFim: eventEndTime,
        tipo: "evento",
      });
      toast.success("Evento pessoal criado!");
    } else {
      // Bloqueio de agenda
      app.addScheduleBlock({
        profissionalId: userId!,
        tipo: blockType,
        dataInicio: selectedDate,
        dataFim: selectedDate,
        faixasHorario: blockType === "periodo" ? [{ horaInicio: eventStartTime, horaFim: eventEndTime }] : [],
        motivo: eventDescription || "Bloqueio manual"
      });
    }

    setEventTitle("");
    setEventDescription("");
    setEventStartTime("09:00");
    setEventEndTime("10:00");
    setShowEventForm(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />

      <main className="p-4 max-w-4xl mx-auto">
        <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* LEGENDA */}
          <Card className="shadow-card border-0">
            <CardContent className="py-3">
              <div className="flex flex-wrap gap-4 justify-center text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(174, 58%, 56%)' }} />
                  <span>Evento pessoal</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(245, 74%, 60%)' }} />
                  <span>Agendamento</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(0, 0%, 60%)' }} />
                  <span>Bloqueio</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CALENDÁRIO */}
          <Card className="shadow-card border-0">
            <CardHeader className="pb-2 flex justify-between flex-row items-center">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarDays className="h-5 w-5 text-primary" />
                Calendário
              </CardTitle>

              <div className="flex gap-2">
                {isProfessional && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("gerenciar-agenda")}
                  >
                    Gerenciar Regras
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="flex justify-center">
              <CalendarWithDots
                mode="single"
                selected={selectedDate}
                onSelect={(d) => d && setSelectedDate(d)}
                locale={ptBR}
                dotModifiers={{
                  personalEvents: datesWithPersonalEvents,
                  appointments: datesWithAppointments,
                  blocked: blockedDates,
                }}
              />
            </CardContent>
          </Card>

          {/* FORMULÁRIO DE EVENTO / BLOQUEIO */}
          {showEventForm && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="shadow-card border-2" style={{ borderColor: formType === "evento" ? 'hsl(174, 58%, 56%)' : 'hsl(0, 0%, 60%)' }}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center mb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <span className="w-4 h-4 rounded-full" style={{ backgroundColor: formType === "evento" ? 'hsl(174, 58%, 56%)' : 'hsl(0, 0%, 60%)' }} />
                      {formType === "evento" ? "Novo Evento Pessoal" : "Bloquear Agenda"} — {format(selectedDate, "dd/MM", { locale: ptBR })}
                    </CardTitle>
                    {isProfessional && (
                      <div className="flex bg-muted p-1 rounded-md scale-90">
                        <Button
                          variant={formType === "evento" ? "default" : "ghost"}
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setFormType("evento")}
                        >
                          Evento
                        </Button>
                        <Button
                          variant={formType === "bloqueio" ? "default" : "ghost"}
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setFormType("bloqueio")}
                        >
                          Bloqueio
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formType === "evento" ? (
                    <>
                      <div>
                        <Label>Título *</Label>
                        <Input
                          value={eventTitle}
                          onChange={(e) => setEventTitle(e.target.value)}
                          placeholder="Ex: Consulta médica, Reunião pessoal..."
                        />
                      </div>
                      <div>
                        <Label>Descrição (opcional)</Label>
                        <Textarea
                          value={eventDescription}
                          onChange={(e) => setEventDescription(e.target.value)}
                          placeholder="Detalhes..."
                          rows={2}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label>Tipo de Bloqueio</Label>
                        <div className="flex gap-2">
                          <Button
                            variant={blockType === "dia" ? "default" : "outline"}
                            className="flex-1"
                            onClick={() => setBlockType("dia")}
                          >
                            Dia Inteiro
                          </Button>
                          <Button
                            variant={blockType === "periodo" ? "default" : "outline"}
                            className="flex-1"
                            onClick={() => setBlockType("periodo")}
                          >
                            Período Específico
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label>Motivo (opcional)</Label>
                        <Input
                          value={eventDescription}
                          onChange={(e) => setEventDescription(e.target.value)}
                          placeholder="Ex: Folga, Curso, Viagem..."
                        />
                      </div>
                    </>
                  )}

                  {(formType === "evento" || blockType === "periodo") && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Hora início</Label>
                        <Input
                          type="time"
                          value={eventStartTime}
                          onChange={(e) => setEventStartTime(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Hora fim</Label>
                        <Input
                          type="time"
                          value={eventEndTime}
                          onChange={(e) => setEventEndTime(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  <Button
                    className="w-full"
                    onClick={handleCreateEvent}
                    style={{ backgroundColor: formType === "evento" ? 'hsl(174, 58%, 56%)' : 'hsl(0, 0%, 60%)' }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {formType === "evento" ? "Criar Evento Pessoal" : "Confirmar Bloqueio"}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* LISTA DO DIA */}
          <Card className="shadow-card border-0">
            <CardHeader>
              <CardTitle>
                Compromissos — {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {appointmentsForDate.length === 0 && personalEventsForDate.length === 0 && blocksForSelectedDate.length === 0 && (
                <p className="text-muted-foreground text-center py-4">Nenhum compromisso neste dia</p>
              )}

              {/* BLOQUEIOS */}
              {blocksForSelectedDate.map((b) => (
                <div key={b.id} className="flex gap-4 p-4 rounded-lg border" style={{ borderColor: 'hsl(0, 0%, 60%, 0.3)', backgroundColor: 'hsl(0, 0%, 60%, 0.05)' }}>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'hsl(0, 0%, 60%, 0.15)' }}>
                    <Lock className="h-5 w-5" style={{ color: 'hsl(0, 0%, 60%)' }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(0, 0%, 60%)' }} />
                      <strong>Bloqueado</strong>
                      <Badge variant="outline" className="text-xs">
                        {isClient ? getProfessionalName(b.profissionalId) : b.tipo === "dia" ? "Dia" : "Período"}
                      </Badge>
                    </div>
                    {b.faixasHorario?.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Clock className="h-4 w-4" />
                        {b.faixasHorario.map((f) => `${f.horaInicio} – ${f.horaFim}`).join(", ")}
                      </div>
                    )}
                    {b.motivo && <p className="text-sm text-muted-foreground mt-1">Motivo: {b.motivo}</p>}
                  </div>
                </div>
              ))}

              {/* AGENDAMENTOS */}
              {appointmentsForDate.map((apt) => (
                <div key={apt.id} className="flex gap-4 p-4 rounded-lg border" style={{ borderColor: 'hsl(245, 74%, 60%, 0.3)', backgroundColor: 'hsl(245, 74%, 60%, 0.05)' }}>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'hsl(245, 74%, 60%, 0.15)' }}>
                    {isClient ? <User className="h-5 w-5" style={{ color: 'hsl(245, 74%, 60%)' }} /> : <UserCheck className="h-5 w-5" style={{ color: 'hsl(245, 74%, 60%)' }} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(245, 74%, 60%)' }} />
                      <strong>
                        {isClient ? `Consulta com ${getProfessionalName(apt.profissionalId)}` : getClientName(apt)}
                      </strong>
                      <Badge variant="secondary">Agendamento</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Clock className="h-4 w-4" />
                      {apt.hora}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => cancelAppointment(apt.id)}>
                    <Trash2 className="text-destructive h-4 w-4" />
                  </Button>
                </div>
              ))}

              {/* EVENTOS PESSOAIS */}
              {personalEventsForDate.map((event) => (
                <div key={event.id} className="flex gap-4 p-4 rounded-lg border" style={{ borderColor: 'hsl(174, 58%, 56%, 0.3)', backgroundColor: 'hsl(174, 58%, 56%, 0.05)' }}>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'hsl(174, 58%, 56%, 0.15)' }}>
                    <CalendarDays className="h-5 w-5" style={{ color: 'hsl(174, 58%, 56%)' }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(174, 58%, 56%)' }} />
                      <strong>{event.titulo}</strong>
                      <Badge variant="outline" className="text-xs">Evento pessoal</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Clock className="h-4 w-4" />
                      {event.horaInicio} – {event.horaFim}
                    </div>
                    {event.descricao && <p className="text-sm text-muted-foreground mt-1">{event.descricao}</p>}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removePersonalEvent(event.id)}>
                    <Trash2 className="text-destructive h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
