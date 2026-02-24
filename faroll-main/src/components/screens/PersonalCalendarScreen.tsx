import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Header } from "@/components/layout/Header";
import { Navigation } from "@/components/layout/Navigation";
import { CalendarDays, Plus, Trash2, ArrowLeft, CalendarPlus, Clock } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useApp } from "@/contexts/AppContext";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";

export function PersonalCalendarScreen() {
  const { navigate, getPersonalEvents, addPersonalEvent, removePersonalEvent, user, addNotification, isGoogleSyncEnabled } = useApp();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [horaInicio, setHoraInicio] = useState("09:00");
  const [horaFim, setHoraFim] = useState("10:00");

  // 🔑 eventos SOMENTE do usuário logado (cliente OU profissional)
  const events = getPersonalEvents().filter((e) => e.userId === user?.id);

  const eventsForDate = events.filter((e) => isSameDay(new Date(e.data), selectedDate));

  const datesWithEvents = events.map((e) => new Date(e.data));

  const handleAddEvent = () => {
    if (!titulo.trim()) {
      toast.error("Digite um título para o evento");
      return;
    }

    addPersonalEvent({
      titulo,
      descricao: descricao || undefined,
      data: selectedDate,
      horaInicio,
      horaFim,
      tipo: "evento",
    });

    if (user?.notificacoes?.eventoCalendarioPessoal && user?.id) {
      addNotification({
        userId: user.id,
        tipo: "lembrete",
        titulo: "Evento Pessoal Criado",
        descricao: `${titulo} - ${format(selectedDate, "dd/MM/yyyy", { locale: ptBR })} às ${horaInicio}`,
      });
    }

    setTitulo("");
    setDescricao("");
    setHoraInicio("09:00");
    setHoraFim("10:00");

    toast.success("Evento pessoal criado com sucesso!");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />

      <main className="p-4 max-w-4xl mx-auto space-y-4">
        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("calendario")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Calendário Pessoal</h1>
            {isGoogleSyncEnabled && (
              <Badge variant="outline" className="ml-auto gap-1 text-primary border-primary/20 bg-primary/5">
                <CheckCircle2 className="h-3 w-3" />
                Google Sync Ativo
              </Badge>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Calendário */}
            <Card className="shadow-card border-0">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  Calendário
                </CardTitle>
              </CardHeader>

              <CardContent className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  locale={ptBR}
                  modifiers={{ hasEvent: datesWithEvents }}
                  modifiersClassNames={{
                    hasEvent: "bg-primary/20 text-primary font-bold",
                  }}
                />
              </CardContent>
            </Card>

            {/* Criar evento */}
            <Card className="shadow-card border-0">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Plus className="h-5 w-5 text-primary" />
                  Novo Evento —{" "}
                  {format(selectedDate, "dd/MM", {
                    locale: ptBR,
                  })}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <Label>Título *</Label>
                  <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
                </div>

                <div>
                  <Label>Descrição (opcional)</Label>
                  <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={2} />
                </div>

                {/* ⏰ HORÁRIO – agora para cliente e profissional */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Hora início</Label>
                    <Input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} />
                  </div>
                  <div>
                    <Label>Hora fim</Label>
                    <Input type="time" value={horaFim} onChange={(e) => setHoraFim(e.target.value)} />
                  </div>
                </div>

                <Button className="w-full" onClick={handleAddEvent}>
                  <CalendarPlus className="h-4 w-4 mr-2" />
                  Criar Evento
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Eventos do dia */}
          <Card className="shadow-card border-0 mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">
                Eventos de {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
              </CardTitle>
            </CardHeader>

            <CardContent>
              {eventsForDate.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Nenhum evento pessoal neste dia</p>
              ) : (
                <div className="space-y-2">
                  {eventsForDate.map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <div className="flex items-center gap-2">
                          <strong>{event.titulo}</strong>
                          <Badge variant="outline">Evento pessoal</Badge>
                        </div>

                        <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {event.horaInicio} – {event.horaFim}
                        </div>

                        {event.descricao && <p className="text-sm text-muted-foreground mt-1">{event.descricao}</p>}
                      </div>

                      {/* 🗑️ excluir – agora funciona para profissional */}
                      <Button variant="ghost" size="icon" onClick={() => removePersonalEvent(event.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
