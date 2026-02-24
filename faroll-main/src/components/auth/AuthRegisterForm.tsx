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
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Loader2, UserPlus, X, Plus, Minus, Search, Calendar } from "lucide-react";
import { toast } from "sonner";
import { PasswordFieldsWithValidation } from "./PasswordFieldsWithValidation";
import { supabase } from "@/integrations/supabase/client";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ImageUpload } from "@/components/ImageUpload";

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

interface AuthRegisterFormProps {
  onSwitchToLogin: () => void;
}

export function AuthRegisterForm({ onSwitchToLogin }: AuthRegisterFormProps) {
  const { signUp, signIn, loading } = useAuthContext();
  const [professions, setProfessions] = useState<Profession[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [targetAudiences, setTargetAudiences] = useState<TargetAudience[]>([]);
  const [showOtherProfession, setShowOtherProfession] = useState(false);
  const [showOtherSpecialization, setShowOtherSpecialization] = useState(false);
  const [showOtherTargetAudience, setShowOtherTargetAudience] = useState(false);
  const [openProfessionPicker, setOpenProfessionPicker] = useState(false);
  const [openSpecializationPicker, setOpenSpecializationPicker] = useState(false);
  const [professionSearch, setProfessionSearch] = useState("");
  const [specializationSearch, setSpecializationSearch] = useState("");
  const [localLoading, setLocalLoading] = useState(false);

  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    password: "",
    confirmPassword: "",
    cpf: "",
    telefone: "",
    pais: "Brasil",
    estado: "",
    cidade: "",
    role: "cliente" as "cliente" | "profissional",
    profession_ids: [] as string[], // Alterado de profession_id para plural (array)
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
    avatar_url: "",
    googleSyncEnabled: false,
    googleAccessToken: "",
    googleRefreshToken: "",
  });

  useEffect(() => {
    loadProfessions();
    loadTargetAudiences();
  }, []);

  useEffect(() => {
    if (formData.profession_ids.length > 0) {
      loadSpecializations(formData.profession_ids);
    } else {
      setSpecializations([]);
      setFormData((prev) => ({ ...prev, specialization_ids: [] }));
    }
  }, [formData.profession_ids]);

  const filteredSpecializations = useMemo(() => {
    return specializations.filter((s) =>
      s.nome.toLowerCase().includes(specializationSearch.toLowerCase())
    );
  }, [specializations, specializationSearch]);

  const loadProfessions = async () => {
    const { data, error } = await supabase.from("professions").select("*").eq("ativa", true).order("nome");

    if (error) {
      console.error("Erro ao carregar profissões:", error);
      toast.error("Erro ao carregar profissões");
    } else if (data) {
      setProfessions(data);
    }
  };

  const loadSpecializations = async (professionIds: string[]) => {
    const { data, error } = await supabase
      .from("specializations")
      .select("*")
      .in("profession_id", professionIds)
      .eq("ativa", true)
      .order("nome");

    if (error) {
      console.error("Erro ao carregar especialidades:", error);
      toast.error(`Erro: ${error.message}`);
    } else if (data) {
      setSpecializations(data);
    }
  };

  const loadTargetAudiences = async () => {
    const { data, error } = await supabase.from("target_audiences").select("*").eq("ativa", true).order("ordem");

    if (error) {
      console.error("Erro ao carregar público-alvo:", error);
      toast.error("Erro ao carregar público-alvo");
    } else if (data) {
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
        console.error("Erro ao adicionar profissão:", error);
        toast.error("Erro ao adicionar profissão");
      } else if (data) {
        setProfessions((prev) => [...prev, data]);
        setFormData((prev) => ({
          ...prev,
          profession_ids: [...prev.profession_ids, data.id],
          newProfessionName: "",
          newProfessionRegistro: "",
        }));
        setShowOtherProfession(false);
        toast.success("Profissão adicionada e selecionada!");
      }
    } catch (error) {
      console.error("Erro ao adicionar profissão:", error);
      toast.error("Erro ao adicionar profissão");
    }
  };

  const handleAddNewSpecialization = async () => {
    if (!formData.newSpecializationName.trim()) {
      toast.error("Digite o nome da especialidade");
      return;
    }

    if (!formData.profession_ids.length) {
      toast.error("Selecione pelo menos uma profissão primeiro");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("specializations")
        .insert({
          nome: formData.newSpecializationName,
          profession_id: formData.profession_ids[0], // Vincula à primeira selecionada por padrão
        })
        .select()
        .single();

      if (error) {
        console.error("Erro ao adicionar especialidade:", error);
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
      console.error("Erro ao adicionar especialidade:", error);
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
        console.error("Erro ao adicionar público-alvo:", error);
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
      console.error("Erro ao adicionar público-alvo:", error);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome.trim() || !formData.email.trim() || !formData.password.trim()) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (formData.role === "profissional") {
      if (formData.profession_ids.length === 0) {
        toast.error("Selecione pelo menos uma profissão");
        return;
      }
      if (formData.target_audience_ids.length === 0) {
        toast.error("Selecione pelo menos um público-alvo");
        return;
      }
    }

    const additionalData: Record<string, unknown> = {
      cpf: formData.cpf,
      telefone: formData.telefone,
      pais: formData.pais,
      estado: formData.estado,
      cidade: formData.cidade,
      avatar_url: formData.avatar_url,
    };

    if (formData.role === "profissional") {
      additionalData.profession_ids = formData.profession_ids;
      additionalData.specialization_ids = formData.specialization_ids;
      additionalData.target_audience_ids = formData.target_audience_ids;
      additionalData.tipo_atendimento = formData.tipoAtendimento;
      additionalData.descricao = formData.descricao;
      additionalData.registro = formData.registro;
      additionalData.antecedencia_agendamento = formData.antecedenciaAgendamento;
      additionalData.antecedencia_cancelamento = formData.antecedenciaCancelamento;
    }

    const result = await signUp(formData.email, formData.password, formData.nome, formData.role, additionalData);

    if (result.success) {
      // Salvar configurações de sincronização se habilitado
      if (formData.googleSyncEnabled && result.userId) {
        // @ts-ignore - Tabela nova ainda não presente nos tipos gerados
        await (supabase.from("google_sync_settings" as any)).insert({
          user_id: result.userId,
          access_token: formData.googleAccessToken,
          refresh_token: formData.googleRefreshToken,
          sync_enabled: true
        });
      }

      // Se tiver avatar_url, atualizar o perfil recém-criado
      if (formData.avatar_url && result.userId) {
        await supabase
          .from("profiles")
          .update({ avatar_url: formData.avatar_url })
          .eq("user_id", result.userId);
      }

      const loginResult = await signIn(formData.email, formData.password);
      if (loginResult.success) {
        toast.success("Cadastro realizado! Entrando...");
        window.location.href = "/";
        return;
      }

      toast.success("Cadastro realizado com sucesso! Você já pode fazer login.");
      onSwitchToLogin();
    } else {
      toast.error(result.error || "Erro ao cadastrar");
    }
  };

  const handleConnectGoogle = () => {
    // Simulação de fluxo OAuth
    setLocalLoading(true);
    setTimeout(() => {
      updateField("googleSyncEnabled", true);
      updateField("googleAccessToken", "mock_access_token_" + Date.now());
      updateField("googleRefreshToken", "mock_refresh_token_" + Date.now());
      setLocalLoading(false);
      toast.success("Google Calendar conectado com sucesso!");
    }, 1500);
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen gradient-health-soft p-4 py-8">
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="max-w-2xl mx-auto pb-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white shadow-soft mb-4 overflow-hidden border-2 border-primary/10 mx-auto">
            <img src="/logo-farollbr.jpeg" alt="Farollbr" className="h-full w-full object-cover" />
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground">
            Farollbr
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">
            Sua jornada segura para o cuidado profissional
          </p>
        </div>

        <Button variant="ghost" onClick={onSwitchToLogin} className="mb-4" disabled={loading}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="font-display text-2xl">Crie sua conta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <ImageUpload
                currentImage={formData.avatar_url}
                onImageChange={(url) => updateField("avatar_url", url)}
                userId="temp-registration"
                saveToDatabase={false}
              />
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dados Básicos */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Dados Pessoais</h3>

                <div className="space-y-2">
                  <Label htmlFor="nome">Nome completo *</Label>
                  <Input
                    id="nome"
                    placeholder="Seu nome completo"
                    value={formData.nome}
                    onChange={(e) => updateField("nome", e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    disabled={loading}
                  />
                </div>

                <PasswordFieldsWithValidation
                  password={formData.password}
                  confirmPassword={formData.confirmPassword}
                  onPasswordChange={(v) => updateField("password", v)}
                  onConfirmPasswordChange={(v) => updateField("confirmPassword", v)}
                  disabled={loading}
                />

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      placeholder="000.000.000-00"
                      value={formData.cpf}
                      onChange={(e) => updateField("cpf", e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      placeholder="(00) 00000-0000"
                      value={formData.telefone}
                      onChange={(e) => updateField("telefone", e.target.value)}
                      disabled={loading}
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
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado</Label>
                    <Input
                      id="estado"
                      placeholder="SP"
                      value={formData.estado}
                      onChange={(e) => updateField("estado", e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input
                      id="cidade"
                      placeholder="São Paulo"
                      value={formData.cidade}
                      onChange={(e) => updateField("cidade", e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* Tipo de Usuário */}
              <div className="space-y-3">
                <Label>Tipo de cadastro *</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant={formData.role === "cliente" ? "default" : "outline"}
                    onClick={() => updateField("role", "cliente")}
                    disabled={loading}
                    className="h-20"
                  >
                    <div className="text-center">
                      <div className="font-semibold">Cliente</div>
                      <div className="text-xs opacity-80">Busco profissionais</div>
                    </div>
                  </Button>
                  <Button
                    type="button"
                    variant={formData.role === "profissional" ? "default" : "outline"}
                    onClick={() => updateField("role", "profissional")}
                    disabled={loading}
                    className="h-20"
                  >
                    <div className="text-center">
                      <div className="font-semibold">Profissional</div>
                      <div className="text-xs opacity-80">Ofereço serviços</div>
                    </div>
                  </Button>
                </div>
              </div>

              {/* Campos Específicos para Profissional */}
              {formData.role === "profissional" && (
                <div className="space-y-4 border-t pt-6">
                  <h3 className="font-semibold text-lg">Informações Profissionais</h3>

                  {/* Profissões (Múltipla escolha) */}
                  <div className="space-y-2">
                    <Label>Profissões * (selecione uma ou mais)</Label>
                    <Popover open={openProfessionPicker} onOpenChange={setOpenProfessionPicker}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="w-full justify-between" disabled={loading}>
                          {formData.profession_ids.length > 0
                            ? `${formData.profession_ids.length} selecionada(s)`
                            : "Selecione suas profissões..."}
                          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput
                            placeholder="Buscar profissão..."
                            value={professionSearch}
                            onValueChange={setProfessionSearch}
                          />
                          <CommandList>
                            <CommandEmpty>
                              <p className="p-4 text-sm text-center">Nenhuma profissão encontrada.</p>
                              <Button
                                type="button"
                                variant="ghost"
                                className="w-full border-t rounded-none text-primary"
                                onClick={() => {
                                  setShowOtherProfession(true);
                                  setOpenProfessionPicker(false);
                                }}
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Adicionar nova: "{professionSearch}"
                              </Button>
                            </CommandEmpty>
                            <CommandGroup className="max-h-64 overflow-auto">
                              {professions
                                .filter((p) => p.nome.toLowerCase().includes(professionSearch.toLowerCase()))
                                .map((profession) => {
                                  const isSelected = formData.profession_ids.includes(profession.id);
                                  return (
                                    <CommandItem
                                      key={profession.id}
                                      value={profession.nome}
                                      onSelect={() => {
                                        setFormData(prev => ({
                                          ...prev,
                                          profession_ids: isSelected
                                            ? prev.profession_ids.filter(id => id !== profession.id)
                                            : [...prev.profession_ids, profession.id]
                                        }));
                                      }}
                                    >
                                      <div className="flex items-center w-full">
                                        <Checkbox checked={isSelected} className="mr-2" />
                                        {profession.nome}
                                        {profession.registro_tipo && (
                                          <span className="ml-2 text-xs text-muted-foreground">
                                            ({profession.registro_tipo})
                                          </span>
                                        )}
                                      </div>
                                    </CommandItem>
                                  );
                                })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    {/* Badges de profissões selecionadas */}
                    {formData.profession_ids.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.profession_ids.map((id) => {
                          const prof = professions.find((p) => p.id === id);
                          if (!prof) return null;
                          return (
                            <Badge key={id} variant="secondary" className="gap-1">
                              {prof.nome}
                              <button
                                type="button"
                                onClick={() => setFormData(prev => ({
                                  ...prev,
                                  profession_ids: prev.profession_ids.filter(pid => pid !== id)
                                }))}
                                className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Especialidades (Opcional) - Com Dropdown de Busca */}
                  {formData.profession_ids.length > 0 && (
                    <div className="space-y-3 p-4 border rounded-lg bg-primary/5 shadow-inner">
                      <Label className="text-base font-semibold text-primary">Especialidades (Opcional)</Label>

                      <Popover open={openSpecializationPicker} onOpenChange={setOpenSpecializationPicker}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between bg-white hover:bg-neutral-50 shadow-sm border-primary/20"
                            disabled={loading}
                          >
                            {formData.specialization_ids.length > 0
                              ? `${formData.specialization_ids.length} especialidade(s) selecionada(s)`
                              : "Selecione ou busque especialidades..."}
                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command>
                            <CommandInput
                              placeholder="Buscar especialidade..."
                              value={specializationSearch}
                              onValueChange={setSpecializationSearch}
                            />
                            <CommandList>
                              <CommandEmpty>
                                <p className="p-4 text-sm text-center">Não encontrou sua especialidade?</p>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  className="w-full border-t rounded-none text-primary font-medium"
                                  onClick={() => {
                                    setShowOtherSpecialization(true);
                                    setOpenSpecializationPicker(false);
                                  }}
                                >
                                  <Plus className="mr-2 h-4 w-4" />
                                  Cadastrar: "{specializationSearch}"
                                </Button>
                              </CommandEmpty>
                              <CommandGroup className="max-h-64 overflow-auto">
                                {filteredSpecializations.map((spec) => {
                                  const isSelected = formData.specialization_ids.includes(spec.id);
                                  return (
                                    <CommandItem
                                      key={spec.id}
                                      value={spec.nome}
                                      onSelect={() => toggleSpecialization(spec.id)}
                                    >
                                      <div className="flex items-center w-full">
                                        <Checkbox checked={isSelected} className="mr-2" />
                                        {spec.nome}
                                      </div>
                                    </CommandItem>
                                  );
                                })}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>

                      {/* Badges de especialidades selecionadas */}
                      {formData.specialization_ids.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {formData.specialization_ids.map((id) => {
                            const spec = specializations.find((s) => s.id === id);
                            if (!spec) return null;
                            return (
                              <Badge key={id} variant="default" className="gap-1 bg-primary text-white hover:bg-primary/90 transition-all shadow-sm">
                                {spec.nome}
                                <button
                                  type="button"
                                  onClick={() => toggleSpecialization(id)}
                                  className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

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

                  {/* Especialidades (Opcional) */}


                  {/* Número de Registro */}
                  {formData.profession_ids.length > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="registro">
                        Número do Registro (Opcional)
                        <span className="text-xs text-muted-foreground ml-1">
                          (CRP, CRM, etc.)
                        </span>
                      </Label>
                      <Input
                        id="registro"
                        placeholder="Ex: 06/12345"
                        value={formData.registro}
                        onChange={(e) => updateField("registro", e.target.value)}
                        disabled={loading}
                      />
                    </div>
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
                              disabled={loading}
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
                          if (!audience) return null;
                          return (
                            <Badge key={id} variant="secondary" className="gap-1">
                              {audience.nome}
                              <button
                                type="button"
                                onClick={() => toggleTargetAudience(id)}
                                className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          );
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
                      disabled={loading}
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
                      disabled={loading}
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
                        disabled={loading || formData.antecedenciaAgendamento <= 30}
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
                        disabled={loading}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Clientes devem agendar com essa antecedência</p>
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
                        disabled={loading || formData.antecedenciaCancelamento <= 30}
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
                        disabled={loading}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Clientes devem cancelar com essa antecedência</p>
                  </div>
                </div>
              )}

              {/* Sincronização Google Calendar */}
              <div className="space-y-4 border-t pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      Sincronização
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Conecte sua agenda ao Google Calendar
                    </p>
                  </div>
                  <Switch
                    checked={formData.googleSyncEnabled}
                    onCheckedChange={(checked) => {
                      if (checked) handleConnectGoogle();
                      else updateField("googleSyncEnabled", false);
                    }}
                    disabled={loading || localLoading}
                  />
                </div>

                {formData.googleSyncEnabled ? (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Google Calendar Conectado</p>
                      <p className="text-xs text-muted-foreground">Seus eventos serão sincronizados automaticamente.</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => updateField("googleSyncEnabled", false)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      Desconectar
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2 border-primary/20 hover:border-primary/50"
                    onClick={handleConnectGoogle}
                    disabled={loading}
                  >
                    <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                    Conectar Google Calendar
                  </Button>
                )}
                <p className="text-[10px] text-center text-muted-foreground px-4">
                  Ao conectar, o Farollbr importará seus compromissos para evitar conflitos de horários e exportará seus agendamentos para sua conta Google.
                </p>
              </div>

              {/* Botão de Submit */}
              <Button type="submit" className="w-full h-12" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Cadastrando...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Criar Conta
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
