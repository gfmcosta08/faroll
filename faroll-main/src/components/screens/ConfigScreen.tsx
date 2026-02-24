import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useAuthContext } from "@/contexts/AuthContext";
import { Save, Loader2, X, Plus, Minus, Search, ArrowLeft, UserPlus, ChevronRight, User, Shield, Bell, Calendar } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ImageUpload } from "@/components/ImageUpload";
import { Header } from "@/components/layout/Header";
import { Navigation } from "@/components/layout/Navigation";
import { Separator } from "@/components/ui/separator";
import { useApp } from "@/contexts/AppContext";

interface Profession {
  id: string;
  nome: string;
  registro_tipo: string;
}

interface Specialization {
  id: string;
  nome: string;
  profession_id: string;
}

interface TargetAudience {
  id: string;
  nome: string;
}

export function ConfigScreen() {
  const { user, session } = useAuthContext();
  const app = useApp();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState<'cliente' | 'profissional'>('cliente');

  const [professions, setProfessions] = useState<Profession[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [targetAudiences, setTargetAudiences] = useState<TargetAudience[]>([]);
  const [showOtherProfession, setShowOtherProfession] = useState(false);
  const [showOtherSpecialization, setShowOtherSpecialization] = useState(false);
  const [showOtherTargetAudience, setShowOtherTargetAudience] = useState(false);
  const [professionSearch, setProfessionSearch] = useState("");
  const [openProfessionPicker, setOpenProfessionPicker] = useState(false);

  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    cpf: "",
    telefone: "",
    pais: "Brasil",
    estado: "",
    cidade: "",
    avatar_url: "",
    // Campos profissional
    profession_id: "",
    newProfessionName: "",
    newProfessionRegistro: "",
    specialization_ids: [] as string[],
    newSpecializationName: "",
    target_audience_ids: [] as string[],
    newTargetAudienceName: "",
    tipoAtendimento: "",
    descricao: "",
    registro: "",
    antecedenciaAgendamento: 1440, // 24h em minutos
    antecedenciaCancelamento: 2880, // 48h em minutos
  });

  useEffect(() => {
    if (user) {
      fetchProfileData();
      fetchUserRole();
      loadProfessions();
      loadTargetAudiences();
    }
  }, [user]);

  useEffect(() => {
    if (formData.profession_id) {
      loadSpecializations(formData.profession_id);
    }
  }, [formData.profession_id]);

  const fetchUserRole = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (data?.some(r => r.role === 'profissional')) {
      setUserRole('profissional');
    }
  };

  const fetchProfileData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData(prev => ({
          ...prev,
          nome: data.nome || "",
          email: data.email || "",
          cpf: data.cpf || "",
          telefone: data.telefone || "",
          pais: data.pais || "Brasil",
          estado: data.estado || "",
          cidade: data.cidade || "",
          avatar_url: data.avatar_url || "",
          profession_id: data.profession_id || "",
          specialization_ids: data.specialization_ids || [],
          target_audience_ids: data.target_audience_ids || [],
          tipoAtendimento: data.tipo_atendimento || "",
          descricao: data.descricao || "",
          registro: data.registro || "",
          antecedenciaAgendamento: data.antecedencia_agendamento || 1440,
          antecedenciaCancelamento: data.antecedencia_cancelamento || 2880,
        }));
      }
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
      toast.error("Erro ao carregar dados do perfil");
    } finally {
      setLoading(false);
    }
  };

  const loadProfessions = async () => {
    const { data, error } = await supabase.from("professions").select("*").eq("ativa", true).order("nome");
    if (!error && data) {
      setProfessions(data);
    }
  };

  const loadSpecializations = async (professionId: string) => {
    const { data, error } = await supabase
      .from("specializations")
      .select("*")
      .eq("profession_id", professionId)
      .eq("ativa", true)
      .order("nome");
    if (!error && data) {
      setSpecializations(data);
    }
  };

  const loadTargetAudiences = async () => {
    const { data, error } = await supabase.from("target_audiences").select("*").eq("ativa", true).order("ordem");
    if (!error && data) {
      setTargetAudiences(data);
    }
  };

  const handleAddNewProfession = async () => {
    if (!formData.newProfessionName.trim()) {
      toast.error("Digite o nome da profissão");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("professions")
        .insert({
          nome: formData.newProfessionName,
          registro_tipo: formData.newProfessionRegistro || null,
        })
        .select()
        .single();

      if (error) {
        toast.error("Erro ao adicionar profissão");
      } else if (data) {
        setProfessions((prev) => [...prev, data]);
        setFormData((prev) => ({
          ...prev,
          profession_id: data.id,
          newProfessionName: "",
          newProfessionRegistro: "",
        }));
        setShowOtherProfession(false);
        toast.success("Profissão adicionada com sucesso!");
      }
    } catch (error) {
      toast.error("Erro ao adicionar profissão");
    }
  };

  const handleAddNewSpecialization = async () => {
    if (!formData.newSpecializationName.trim()) {
      toast.error("Digite o nome da especialidade");
      return;
    }

    if (!formData.profession_id) {
      toast.error("Selecione uma profissão primeiro");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("specializations")
        .insert({
          nome: formData.newSpecializationName,
          profession_id: formData.profession_id,
        })
        .select()
        .single();

      if (error) {
        toast.error("Erro ao adicionar especialidade");
      } else if (data) {
        setSpecializations((prev) => [...prev, data]);
        setFormData((prev) => ({
          ...prev,
          specialization_ids: [...prev.specialization_ids, data.id],
          newSpecializationName: "",
        }));
        setShowOtherSpecialization(false);
        toast.success("Especialidade adicionada com sucesso!");
      }
    } catch (error) {
      toast.error("Erro ao adicionar especialidade");
    }
  };

  const handleAddNewTargetAudience = async () => {
    if (!formData.newTargetAudienceName.trim()) {
      toast.error("Digite o nome do público-alvo");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("target_audiences")
        .insert({
          nome: formData.newTargetAudienceName,
        })
        .select()
        .single();

      if (error) {
        toast.error("Erro ao adicionar público-alvo");
      } else if (data) {
        setTargetAudiences((prev) => [...prev, data]);
        setFormData((prev) => ({
          ...prev,
          target_audience_ids: [...prev.target_audience_ids, data.id],
          newTargetAudienceName: "",
        }));
        setShowOtherTargetAudience(false);
        toast.success("Público-alvo adicionado com sucesso!");
      }
    } catch (error) {
      toast.error("Erro ao adicionar público-alvo");
    }
  };

  const toggleSpecialization = (specializationId: string) => {
    setFormData((prev) => {
      const isSelected = prev.specialization_ids.includes(specializationId);
      return {
        ...prev,
        specialization_ids: isSelected
          ? prev.specialization_ids.filter((id) => id !== specializationId)
          : [...prev.specialization_ids, specializationId],
      };
    });
  };

  const toggleTargetAudience = (audienceId: string) => {
    setFormData((prev) => {
      const isSelected = prev.target_audience_ids.includes(audienceId);
      return {
        ...prev,
        target_audience_ids: isSelected
          ? prev.target_audience_ids.filter((id) => id !== audienceId)
          : [...prev.target_audience_ids, audienceId],
      };
    });
  };

  const adjustTime = (field: "antecedenciaAgendamento" | "antecedenciaCancelamento", increment: boolean) => {
    setFormData((prev) => {
      const current = prev[field];
      const step = 30; // 30 minutos por clique
      const newValue = increment ? current + step : Math.max(step, current - step);
      return { ...prev, [field]: newValue };
    });
  };

  // Formato HH:mm (ex: 00:30, 01:00, 01:30, 24:00)
  const formatMinutesToHHmm = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const filteredProfessions = useMemo(() => {
    if (!professionSearch) return professions;
    return professions.filter((p) => p.nome.toLowerCase().includes(professionSearch.toLowerCase()));
  }, [professions, professionSearch]);

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (url: string) => {
    setFormData((prev) => ({ ...prev, avatar_url: url }));
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setSaving(true);

      // Campos que podem ser atualizados (excluindo nome, cpf e registro - imutáveis)
      const updateData: Record<string, any> = {
        telefone: formData.telefone,
        pais: formData.pais,
        estado: formData.estado,
        cidade: formData.cidade,
        avatar_url: formData.avatar_url || null,
      };

      // Se profissional, incluir campos extras (exceto registro - imutável)
      if (userRole === 'profissional') {
        updateData.profession_id = formData.profession_id || null;
        updateData.specialization_ids = formData.specialization_ids;
        updateData.target_audience_ids = formData.target_audience_ids;
        updateData.tipo_atendimento = formData.tipoAtendimento || null;
        updateData.descricao = formData.descricao || null;
        updateData.antecedencia_agendamento = formData.antecedenciaAgendamento;
        updateData.antecedencia_cancelamento = formData.antecedenciaCancelamento;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Dados salvos com sucesso!');
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar alterações");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />

      <main className="p-4 max-w-2xl mx-auto space-y-4 pb-24">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <Card className="shadow-card border-0">
            <CardHeader>
              <CardTitle className="font-display">Configurações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Upload de Foto */}
              <div className="flex justify-center pb-4">
                {user?.id && (
                  <ImageUpload
                    currentImage={formData.avatar_url}
                    onImageChange={handleImageChange}
                    userId={user.id}
                    saveToDatabase={true}
                  />
                )}
              </div>

              {/* Dados Pessoais */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Dados Pessoais</h3>

                <div className="space-y-2">
                  <Label htmlFor="nome">Nome completo *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">O nome não pode ser alterado</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      placeholder="000.000.000-00"
                      value={formData.cpf}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">O CPF não pode ser alterado</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      placeholder="(00) 00000-0000"
                      value={formData.telefone}
                      onChange={(e) => updateField("telefone", e.target.value)}
                      disabled={saving}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="pais">País</Label>
                    <Input
                      id="pais"
                      value={formData.pais}
                      onChange={(e) => updateField("pais", e.target.value)}
                      disabled={saving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado</Label>
                    <Input
                      id="estado"
                      placeholder="SP"
                      value={formData.estado}
                      onChange={(e) => updateField("estado", e.target.value)}
                      disabled={saving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input
                      id="cidade"
                      placeholder="São Paulo"
                      value={formData.cidade}
                      onChange={(e) => updateField("cidade", e.target.value)}
                      disabled={saving}
                    />
                  </div>
                </div>
              </div>

              {/* Campos Específicos para Profissional */}
              {userRole === "profissional" && (
                <div className="space-y-4 border-t pt-6">
                  <h3 className="font-semibold text-lg">Informações Profissionais</h3>

                  {/* Profissão com busca */}
                  <div className="space-y-2">
                    <Label>Profissão *</Label>
                    <Popover open={openProfessionPicker} onOpenChange={setOpenProfessionPicker}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="w-full justify-between" disabled={saving}>
                          {formData.profession_id
                            ? professions.find((p) => p.id === formData.profession_id)?.nome
                            : "Selecione uma profissão..."}
                          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput
                            placeholder="Buscar profissão..."
                            value={professionSearch}
                            onValueChange={setProfessionSearch}
                          />
                          <CommandEmpty>Nenhuma profissão encontrada.</CommandEmpty>
                          <CommandGroup className="max-h-64 overflow-auto">
                            {filteredProfessions.map((profession) => (
                              <CommandItem
                                key={profession.id}
                                value={profession.nome}
                                onSelect={() => {
                                  updateField("profession_id", profession.id);
                                  updateField("registro", "");
                                  setOpenProfessionPicker(false);
                                }}
                              >
                                {profession.nome}
                                {profession.registro_tipo && (
                                  <span className="ml-2 text-xs text-muted-foreground">
                                    ({profession.registro_tipo})
                                  </span>
                                )}
                              </CommandItem>
                            ))}
                            <CommandItem
                              onSelect={() => {
                                setShowOtherProfession(true);
                                setOpenProfessionPicker(false);
                              }}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Outros (adicionar nova profissão)
                            </CommandItem>
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Campo "Outros" para Profissão */}
                  {showOtherProfession && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-3 p-4 border rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center justify-between">
                        <Label>Adicionar Nova Profissão</Label>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setShowOtherProfession(false)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <Input
                        placeholder="Nome da profissão"
                        value={formData.newProfessionName}
                        onChange={(e) => updateField("newProfessionName", e.target.value)}
                      />
                      <Input
                        placeholder="Tipo de registro (ex: CRP, CRM...)"
                        value={formData.newProfessionRegistro}
                        onChange={(e) => updateField("newProfessionRegistro", e.target.value)}
                      />
                      <Button type="button" onClick={handleAddNewProfession} size="sm" className="w-full">
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar
                      </Button>
                    </motion.div>
                  )}

                  {/* Número de Registro */}
                  {formData.profession_id && (
                    <div className="space-y-2">
                      <Label htmlFor="registro">
                        Número do Registro{" "}
                        {professions.find((p) => p.id === formData.profession_id)?.registro_tipo &&
                          `(${professions.find((p) => p.id === formData.profession_id)?.registro_tipo})`}
                      </Label>
                      <Input
                        id="registro"
                        placeholder="Ex: 06/12345"
                        value={formData.registro}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">O registro profissional não pode ser alterado</p>
                    </div>
                  )}

                  {/* Especialidades (Múltipla escolha) */}
                  {formData.profession_id && specializations.length > 0 && (
                    <div className="space-y-3">
                      <Label>Especialidades * (selecione uma ou mais)</Label>
                      <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto border rounded-lg p-3">
                        {specializations.map((spec) => {
                          const isSelected = formData.specialization_ids.includes(spec.id);
                          return (
                            <div key={spec.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`spec-${spec.id}`}
                                checked={isSelected}
                                onCheckedChange={() => toggleSpecialization(spec.id)}
                                disabled={saving}
                              />
                              <Label htmlFor={`spec-${spec.id}`} className="text-sm font-normal cursor-pointer">
                                {spec.nome}
                              </Label>
                            </div>
                          );
                        })}
                      </div>

                      {/* Mostrar especialidades selecionadas */}
                      {formData.specialization_ids.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {formData.specialization_ids.map((id) => {
                            const spec = specializations.find((s) => s.id === id);
                            return spec ? (
                              <Badge key={id} variant="default" className="gap-1">
                                {spec.nome}
                                <button
                                  type="button"
                                  onClick={() => toggleSpecialization(id)}
                                  className="ml-1 hover:bg-white/20 rounded-full"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      )}

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowOtherSpecialization(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar outra especialidade
                      </Button>
                    </div>
                  )}

                  {/* Campo "Outros" para Especialidade */}
                  {showOtherSpecialization && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-3 p-4 border rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center justify-between">
                        <Label>Adicionar Nova Especialidade</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowOtherSpecialization(false)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <Input
                        placeholder="Nome da especialidade"
                        value={formData.newSpecializationName}
                        onChange={(e) => updateField("newSpecializationName", e.target.value)}
                      />
                      <Button type="button" onClick={handleAddNewSpecialization} size="sm" className="w-full">
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar
                      </Button>
                    </motion.div>
                  )}

                  {/* Público-Alvo (Múltipla escolha) */}
                  <div className="space-y-3">
                    <Label>Público-Alvo * (selecione um ou mais)</Label>
                    <div className="grid grid-cols-2 gap-2 border rounded-lg p-3">
                      {targetAudiences.map((audience) => {
                        const isSelected = formData.target_audience_ids.includes(audience.id);
                        return (
                          <div key={audience.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`audience-${audience.id}`}
                              checked={isSelected}
                              onCheckedChange={() => toggleTargetAudience(audience.id)}
                              disabled={saving}
                            />
                            <Label htmlFor={`audience-${audience.id}`} className="text-sm font-normal cursor-pointer">
                              {audience.nome}
                            </Label>
                          </div>
                        );
                      })}
                    </div>

                    {/* Mostrar público-alvo selecionado */}
                    {formData.target_audience_ids.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.target_audience_ids.map((id) => {
                          const audience = targetAudiences.find((a) => a.id === id);
                          return audience ? (
                            <Badge key={id} variant="secondary" className="gap-1">
                              {audience.nome}
                              <button
                                type="button"
                                onClick={() => toggleTargetAudience(id)}
                                className="ml-1 hover:bg-white/20 rounded-full"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    )}

                    <Button type="button" variant="outline" size="sm" onClick={() => setShowOtherTargetAudience(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar outro público-alvo
                    </Button>
                  </div>

                  {/* Campo "Outros" para Público-Alvo */}
                  {showOtherTargetAudience && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-3 p-4 border rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center justify-between">
                        <Label>Adicionar Novo Público-Alvo</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowOtherTargetAudience(false)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <Input
                        placeholder="Nome do público-alvo"
                        value={formData.newTargetAudienceName}
                        onChange={(e) => updateField("newTargetAudienceName", e.target.value)}
                      />
                      <Button type="button" onClick={handleAddNewTargetAudience} size="sm" className="w-full">
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar
                      </Button>
                    </motion.div>
                  )}

                  {/* Tipo de Atendimento */}
                  <div className="space-y-2">
                    <Label htmlFor="tipoAtendimento">Tipo de Atendimento</Label>
                    <Select
                      value={formData.tipoAtendimento}
                      onValueChange={(v) => updateField("tipoAtendimento", v)}
                      disabled={saving}
                    >
                      <SelectTrigger id="tipoAtendimento">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="presencial">Presencial</SelectItem>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="hibrido">Híbrido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Descrição */}
                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descrição / Currículo</Label>
                    <Textarea
                      id="descricao"
                      placeholder="Fale sobre você, sua experiência, formação, abordagem..."
                      value={formData.descricao}
                      onChange={(e) => updateField("descricao", e.target.value)}
                      disabled={saving}
                      rows={6}
                    />
                  </div>

                  {/* Antecedência de Agendamento */}
                  <div className="space-y-2">
                    <Label>Antecedência mínima para agendamento</Label>
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => adjustTime("antecedenciaAgendamento", false)}
                        disabled={saving || formData.antecedenciaAgendamento <= 30}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <div className="flex-1 text-center font-semibold text-lg">
                        {formatMinutesToHHmm(formData.antecedenciaAgendamento)}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => adjustTime("antecedenciaAgendamento", true)}
                        disabled={saving}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Clientes devem agendar com essa antecedência (formato HH:mm)</p>
                  </div>

                  {/* Antecedência de Cancelamento */}
                  <div className="space-y-2">
                    <Label>Antecedência mínima para cancelamento</Label>
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => adjustTime("antecedenciaCancelamento", false)}
                        disabled={saving || formData.antecedenciaCancelamento <= 30}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <div className="flex-1 text-center font-semibold text-lg">
                        {formatMinutesToHHmm(formData.antecedenciaCancelamento)}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => adjustTime("antecedenciaCancelamento", true)}
                        disabled={saving}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Cancelamentos dentro desse prazo podem ter penalidade (formato HH:mm)</p>
                  </div>
                </div>
              )}

              {/* Botão Salvar */}
              <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Salvar
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Seção de Integrações */}
        {app && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 }}>
            <Card className="shadow-card border-0">
              <CardHeader>
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Integrações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="space-y-0.5">
                    <p className="font-medium">Google Calendar</p>
                    <p className="text-xs text-muted-foreground">
                      Sincronize sua agenda pessoal com o FarollBr
                    </p>
                  </div>
                  <Switch
                    checked={app.isGoogleSyncEnabled}
                    onCheckedChange={app.toggleGoogleSync}
                  />
                </div>
                {app.isGoogleSyncEnabled && (
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                      onClick={async () => {
                        setSaving(true);
                        await app.syncWithGoogle();
                        setSaving(false);
                      }}
                      disabled={saving}
                    >
                      <Loader2 className={`h-4 w-4 ${saving ? 'animate-spin' : ''}`} />
                      Sincronizar Agora
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => app.toggleGoogleSync(false)}
                      disabled={saving}
                    >
                      Desconectar Google
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Seção de Notificações */}
        {app && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
            <Card className="shadow-card border-0">
              <CardContent className="p-4">
                <Button
                  variant="outline"
                  className="w-full gap-2 justify-between"
                  onClick={() => app.navigate("notificacoes")}
                >
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Notificações
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Seção de Dependentes */}
        {app && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}>
            <Card className="shadow-card border-0">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="font-display">Dependentes</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => app.navigate("novo-dependente")} className="gap-1">
                  <UserPlus className="h-4 w-4" />
                  Adicionar
                </Button>
              </CardHeader>
              <CardContent>
                {(!app.dependents || app.dependents.length === 0) ? (
                  <p className="text-center text-muted-foreground py-4">Nenhum dependente cadastrado</p>
                ) : (
                  <div className="space-y-2">
                    {app.dependents.map((dep, index) => (
                      <motion.div
                        key={dep.id}
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <button
                          onClick={() => app.selectDependent(dep)}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                        >
                          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                            <User className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{dep.nome}</p>
                            <div className="flex items-center gap-2">
                              <p className="text-sm text-muted-foreground capitalize">
                                {dep.tipo === "menor" ? "Dependente" : "Secretária"}
                              </p>
                              <Badge variant="outline" className="text-xs gap-1">
                                <Shield className="h-3 w-3" />
                                {Object.values(dep.permissions).filter(Boolean).length} permissões
                              </Badge>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </button>
                        {index < app.dependents.length - 1 && <Separator className="mt-2" />}
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>
    </div>
  );
}
