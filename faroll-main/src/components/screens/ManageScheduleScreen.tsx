import { useState } from "react";
import { motion } from "framer-motion";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";

import { Header } from "@/components/layout/Header";
import { Navigation } from "@/components/layout/Navigation";

import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Trash2, CalendarDays, Clock, ArrowLeft, Plus, Lock, RefreshCw, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { useApp } from "@/contexts/AppContext";
import { BlockType } from "@/types";

export function ManageScheduleScreen() {
  // All hooks must be called before any conditional returns
  const {
    user,
    goBack,
    scheduleBlocks,
    getPersonalEvents,
    addScheduleBlock,
    removeScheduleBlock,
    addPersonalEvent,
    removePersonalEvent,
    canManageSchedule,
    isGoogleSyncEnabled,
    syncWithGoogle,
    toggleGoogleSync,
  } = useApp();

  // Block creation state
  const [blockType, setBlockType] = useState<BlockType>("dia");
  const [singleDate, setSingleDate] = useState<Date>(new Date());
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 6),
  });
  const [timeRanges, setTimeRanges] = useState([{ horaInicio: "08:00", horaFim: "12:00" }]);
  const [note, setNote] = useState("");

  // Personal event creation state
  const [eventDate, setEventDate] = useState<Date>(new Date());
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventStartTime, setEventStartTime] = useState("09:00");
  const [eventEndTime, setEventEndTime] = useState("10:00");

  // Sync state
  const [syncing, setSyncing] = useState(false);

  // Guard clause after all hooks
  if (user?.role !== "profissional" || !canManageSchedule()) {
    return null;
  }

  const handleSync = async () => {
    setSyncing(true);
    await syncWithGoogle();
    setSyncing(false);
  };

  const userPersonalEvents = getPersonalEvents().filter(e => e.userId === user?.id);

  const addTimeRange = () => {
    setTimeRanges([...timeRanges, { horaInicio: "14:00", horaFim: "18:00" }]);
  };

  const removeTimeRange = (index: number) => {
    if (timeRanges.length > 1) {
      setTimeRanges(timeRanges.filter((_, i) => i !== index));
    }
  };

  const updateTimeRange = (index: number, field: "horaInicio" | "horaFim", value: string) => {
    const updated = [...timeRanges];
    updated[index][field] = value;
    setTimeRanges(updated);
  };


  const handleSaveBlock = () => {
    const validRanges = timeRanges.filter((f) => f.horaInicio && f.horaFim);

    if (validRanges.length === 0) {
      toast.error("Adicione pelo menos uma faixa de horário");
      return;
    }

    const startDate = blockType === "dia" ? singleDate : (dateRange?.from || new Date());
    const endDate = blockType === "dia" ? singleDate : (dateRange?.to || startDate);

    addScheduleBlock({
      profissionalId: user.id || user.nome,
      tipo: blockType,
      dataInicio: startDate,
      dataFim: endDate,
      faixasHorario: validRanges,
      motivo: note || undefined,
    });

    toast.success(`Bloqueio de ${blockType} criado com sucesso!`);
    setNote("");
    setTimeRanges([{ horaInicio: "08:00", horaFim: "12:00" }]);
  };

  const handleSaveEvent = () => {
    if (!eventTitle.trim()) {
      toast.error("Digite um título para o evento");
      return;
    }

    addPersonalEvent({
      titulo: eventTitle,
      descricao: eventDescription || undefined,
      data: eventDate,
      horaInicio: eventStartTime,
      horaFim: eventEndTime,
      tipo: "evento",
    });

    toast.success("Evento pessoal criado com sucesso!");
    setEventTitle("");
    setEventDescription("");
    setEventStartTime("09:00");
    setEventEndTime("10:00");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Header com botão voltar */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={goBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Gerenciar Calendário</h1>
          </div>

          {/* Indicador de Sincronização Google */}
          {!isGoogleSyncEnabled ? (
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex items-center justify-between p-4 rounded-xl bg-white border border-blue-100 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                  <CalendarDays className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Sincronização com Google</p>
                  <p className="text-xs text-muted-foreground font-medium">Bloqueie horários ocupados no seu Google Calendar</p>
                </div>
              </div>
              <Button
                onClick={() => toggleGoogleSync(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all active:scale-95"
              >
                Conectar Agora
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/10"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Sincronização Ativa</p>
                  <p className="text-xs text-muted-foreground italic">Google Calendar vinculado</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-primary hover:text-primary hover:bg-primary/10"
                  onClick={handleSync}
                  disabled={syncing}
                >
                  <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                  Sincronizar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => toggleGoogleSync(false)}
                >
                  Desconectar
                </Button>
              </div>
            </motion.div>
          )}

          {/* Tabs para separar Bloqueios e Eventos */}
          <Tabs defaultValue="bloqueios" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="bloqueios" className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(0, 84%, 60%)' }} />
                Bloqueios
              </TabsTrigger>
              <TabsTrigger value="eventos" className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(142, 71%, 45%)' }} />
                Eventos Pessoais
              </TabsTrigger>
            </TabsList>

            {/* ==================== ABA BLOQUEIOS ==================== */}
            <TabsContent value="bloqueios" className="space-y-4">
              {/* Card de Criação de Bloqueio */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" style={{ color: 'hsl(0, 84%, 60%)' }} />
                    Criar Bloqueio
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Tipo de Bloqueio */}
                  <div>
                    <Label className="mb-2 block">Tipo de Bloqueio</Label>
                    <Select value={blockType} onValueChange={(v) => setBlockType(v as BlockType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dia">Dia específico</SelectItem>
                        <SelectItem value="periodo">Período (intervalo de datas)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Calendário - Modo único para DIA */}
                  {blockType === "dia" && (
                    <div className="flex justify-center border rounded-lg p-4">
                      <Calendar
                        mode="single"
                        selected={singleDate}
                        onSelect={(date) => date && setSingleDate(date)}
                        locale={ptBR}
                        disabled={(date) => date < new Date()}
                      />
                    </div>
                  )}

                  {/* Calendário - Modo range para PERÍODO */}
                  {blockType === "periodo" && (
                    <div className="flex justify-center border rounded-lg p-4">
                      <Calendar
                        mode="range"
                        selected={dateRange}
                        onSelect={setDateRange}
                        locale={ptBR}
                        disabled={(date) => date < new Date()}
                        numberOfMonths={1}
                      />
                    </div>
                  )}

                  {/* Resumo da seleção */}
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-sm">
                      <strong>Período selecionado:</strong>{" "}
                      {blockType === "dia"
                        ? format(singleDate, "dd/MM/yyyy", { locale: ptBR })
                        : dateRange?.from && dateRange?.to
                          ? `${format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} → ${format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}`
                          : "Selecione o período"
                      }
                    </p>
                  </div>

                  {/* Faixas de Horário */}
                  <div>
                    <Label className="mb-2 block">Faixas de Horário a Bloquear</Label>
                    {timeRanges.map((range, index) => (
                      <div key={index} className="flex gap-2 mb-2 items-center">
                        <div className="flex items-center gap-2 flex-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <Input
                            type="time"
                            value={range.horaInicio}
                            onChange={(e) => updateTimeRange(index, "horaInicio", e.target.value)}
                            className="flex-1"
                          />
                          <span className="text-muted-foreground">até</span>
                          <Input
                            type="time"
                            value={range.horaFim}
                            onChange={(e) => updateTimeRange(index, "horaFim", e.target.value)}
                            className="flex-1"
                          />
                        </div>
                        {timeRanges.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeTimeRange(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addTimeRange} className="mt-2">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar faixa
                    </Button>
                  </div>

                  {/* Observação */}
                  <div>
                    <Label className="mb-2 block">Motivo (opcional)</Label>
                    <Input
                      placeholder="Ex: Férias, Curso, Dia pessoal..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </div>

                  <Button onClick={handleSaveBlock} className="w-full" style={{ backgroundColor: 'hsl(0, 84%, 60%)' }}>
                    <Lock className="h-4 w-4 mr-2" />
                    Salvar Bloqueio
                  </Button>
                </CardContent>
              </Card>

              {/* Lista de Bloqueios Existentes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-primary" />
                    Bloqueios Ativos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {scheduleBlocks.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">Nenhum bloqueio cadastrado</p>
                  ) : (
                    scheduleBlocks.map((b) => (
                      <Alert key={b.id} className="border" style={{ borderColor: 'hsl(0, 84%, 60%, 0.3)' }}>
                        <AlertDescription className="flex justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(0, 84%, 60%)' }} />
                              <Badge variant="outline" style={{ borderColor: 'hsl(0, 84%, 60%)', color: 'hsl(0, 84%, 50%)' }}>
                                {b.tipo === "dia" ? "DIA" : "PERÍODO"}
                              </Badge>
                              <span className="font-medium">
                                {format(new Date(b.dataInicio), "dd/MM/yyyy")}
                                {b.dataFim && new Date(b.dataFim).getTime() !== new Date(b.dataInicio).getTime() &&
                                  ` → ${format(new Date(b.dataFim), "dd/MM/yyyy")}`}
                              </span>
                            </div>
                            {b.faixasHorario?.length > 0 && (
                              <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {b.faixasHorario.map((f) => `${f.horaInicio}–${f.horaFim}`).join(", ")}
                              </div>
                            )}
                            {b.motivo && (
                              <p className="text-sm text-muted-foreground mt-1">Motivo: {b.motivo}</p>
                            )}
                          </div>
                          <Button size="icon" variant="ghost" onClick={() => removeScheduleBlock(b.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDescription>
                      </Alert>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ==================== ABA EVENTOS PESSOAIS ==================== */}
            <TabsContent value="eventos" className="space-y-4">
              {/* Card de Criação de Evento Pessoal */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: 'hsl(142, 71%, 45%, 0.2)' }}>
                      <CalendarDays className="h-4 w-4" style={{ color: 'hsl(142, 71%, 45%)' }} />
                    </span>
                    Criar Evento Pessoal
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Calendário para selecionar data */}
                  <div className="flex justify-center border rounded-lg p-4">
                    <Calendar
                      mode="single"
                      selected={eventDate}
                      onSelect={(date) => date && setEventDate(date)}
                      locale={ptBR}
                    />
                  </div>

                  {/* Resumo da seleção */}
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-sm">
                      <strong>Data selecionada:</strong> {format(eventDate, "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>

                  <div>
                    <Label className="mb-2 block">Título *</Label>
                    <Input
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      placeholder="Ex: Reunião, Lembrete..."
                    />
                  </div>

                  <div>
                    <Label className="mb-2 block">Descrição (opcional)</Label>
                    <Textarea
                      value={eventDescription}
                      onChange={(e) => setEventDescription(e.target.value)}
                      placeholder="Detalhes do evento..."
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="mb-2 block">Hora início *</Label>
                      <Input
                        type="time"
                        value={eventStartTime}
                        onChange={(e) => setEventStartTime(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="mb-2 block">Hora fim *</Label>
                      <Input
                        type="time"
                        value={eventEndTime}
                        onChange={(e) => setEventEndTime(e.target.value)}
                      />
                    </div>
                  </div>

                  <Button onClick={handleSaveEvent} className="w-full" style={{ backgroundColor: 'hsl(142, 71%, 45%)' }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Evento Pessoal
                  </Button>
                </CardContent>
              </Card>

              {/* Lista de Eventos Pessoais */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5" style={{ color: 'hsl(142, 71%, 45%)' }} />
                    Meus Eventos Pessoais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {userPersonalEvents.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">Nenhum evento pessoal cadastrado</p>
                  ) : (
                    userPersonalEvents.map((e) => (
                      <Alert key={e.id} className="border" style={{ borderColor: 'hsl(142, 71%, 45%, 0.3)' }}>
                        <AlertDescription className="flex justify-between items-center">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(142, 71%, 45%)' }} />
                              <strong>{e.titulo}</strong>
                              <span className="text-muted-foreground">
                                {format(new Date(e.data), "dd/MM/yyyy")}
                              </span>
                            </div>
                            {e.horaInicio && e.horaFim && (
                              <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {e.horaInicio} – {e.horaFim}
                              </div>
                            )}
                            {e.descricao && (
                              <p className="text-sm text-muted-foreground mt-1">{e.descricao}</p>
                            )}
                          </div>
                          <Button size="icon" variant="ghost" onClick={() => removePersonalEvent(e.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDescription>
                      </Alert>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
}
