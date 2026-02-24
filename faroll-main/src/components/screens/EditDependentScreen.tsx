import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useApp, defaultDependentePermissions, defaultSecretariaPermissions } from '@/contexts/AppContext';
import { Upload, Save, Shield, Trash2, Lock, KeyRound, User, Phone, Mail, CreditCard } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Navigation } from '@/components/layout/Navigation';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DependentePermissions, SecretariaPermissions } from '@/types';
import { toast } from 'sonner';

// Labels para permissões de Dependente (menor)
const dependentePermissionLabels: Record<keyof DependentePermissions, { label: string; description: string; fixed: boolean }> = {
  chatComVinculados: { 
    label: 'Chat com Vinculados', 
    description: 'Conversar com profissionais vinculados',
    fixed: false
  },
  verCalendario: { 
    label: 'Ver Calendário', 
    description: 'Visualizar calendário de compromissos',
    fixed: false
  },
  verCompromissos: { 
    label: 'Ver Compromissos', 
    description: 'Acessar lista de compromissos',
    fixed: false
  },
  negociarProposta: { 
    label: 'Negociar Proposta', 
    description: 'Criar e negociar propostas de atendimento',
    fixed: true
  },
  enviarArquivos: { 
    label: 'Enviar Arquivos', 
    description: 'Anexar e enviar documentos',
    fixed: true
  },
  consumirGcoin: { 
    label: 'Consumir Gcoin', 
    description: 'Utilizar saldo de Gcoins',
    fixed: true
  },
  agendarCancelar: { 
    label: 'Agendar/Cancelar', 
    description: 'Agendar ou cancelar atendimentos',
    fixed: true
  },
};

// Labels para permissões de Secretária
const secretariaPermissionLabels: Record<keyof SecretariaPermissions, { label: string; description: string; fixed: boolean }> = {
  gerenciarAgenda: { 
    label: 'Gerenciar Agenda', 
    description: 'Administrar agenda do profissional',
    fixed: false
  },
  negociarProposta: { 
    label: 'Negociar Proposta', 
    description: 'Criar e negociar propostas',
    fixed: false
  },
  liberarGcoins: { 
    label: 'Liberar Gcoins', 
    description: 'Autorizar liberação de Gcoins',
    fixed: false
  },
  acessoFinanceiro: { 
    label: 'Acesso Financeiro', 
    description: 'Visualizar dados financeiros',
    fixed: false
  },
  acessoClinico: { 
    label: 'Acesso Clínico', 
    description: 'Acessar conteúdo clínico dos pacientes',
    fixed: true
  },
};

export function EditDependentScreen() {
  const { selectedDependent, updateDependent, removeDependent, navigate, user } = useApp();
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [tipo, setTipo] = useState<'menor' | 'secretaria'>('menor');
  const [dependentePermissions, setDependentePermissions] = useState<DependentePermissions>(defaultDependentePermissions);
  const [secretariaPermissions, setSecretariaPermissions] = useState<SecretariaPermissions>(defaultSecretariaPermissions);

  // Verifica se é o próprio dependente editando (pode alterar login/senha)
  const isDependentEditing = user?.role === 'dependente' || user?.role === 'secretaria';

  useEffect(() => {
    if (selectedDependent) {
      setNome(selectedDependent.nome);
      setTelefone(selectedDependent.telefone || '');
      setEmail(selectedDependent.email || '');
      setCpf(selectedDependent.cpf || '');
      setLogin(selectedDependent.login || '');
      setSenha(selectedDependent.senha || '');
      setTipo(selectedDependent.tipo);
      
      if (selectedDependent.tipo === 'menor') {
        setDependentePermissions(selectedDependent.permissions as DependentePermissions);
      } else {
        setSecretariaPermissions(selectedDependent.permissions as SecretariaPermissions);
      }
    }
  }, [selectedDependent]);

  const handleDependentePermissionChange = (key: keyof DependentePermissions, value: boolean) => {
    setDependentePermissions(prev => ({ ...prev, [key]: value }));
  };

  const handleSecretariaPermissionChange = (key: keyof SecretariaPermissions, value: boolean) => {
    setSecretariaPermissions(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    if (selectedDependent && nome.trim()) {
      const permissions = tipo === 'menor' ? dependentePermissions : secretariaPermissions;
      updateDependent(selectedDependent.id, { 
        nome: isDependentEditing ? selectedDependent.nome : nome, // Dependente não pode alterar nome
        tipo, 
        permissions,
        telefone: isDependentEditing ? selectedDependent.telefone : telefone,
        email: isDependentEditing ? selectedDependent.email : email,
        cpf: isDependentEditing ? selectedDependent.cpf : cpf,
        login,
        senha,
      });
      toast.success('Dependente atualizado com sucesso!');
    }
  };

  const handleDelete = () => {
    if (selectedDependent) {
      removeDependent(selectedDependent.id);
      navigate('config');
      toast.success('Dependente removido!');
    }
  };

  const renderDependentePermissions = () => (
    <>
      {Object.entries(dependentePermissionLabels).map(([key, { label, description, fixed }], index) => {
        const permKey = key as keyof DependentePermissions;
        const isEnabled = dependentePermissions[permKey];
        
        return (
          <div key={key}>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 flex-1">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">{label}</Label>
                  {fixed && <Lock className="h-3 w-3 text-muted-foreground" />}
                </div>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
              <Switch
                checked={isEnabled}
                onCheckedChange={(checked) => handleDependentePermissionChange(permKey, checked)}
                disabled={fixed || isDependentEditing}
                className={(fixed || isDependentEditing) ? 'opacity-50' : ''}
              />
            </div>
            {index < Object.entries(dependentePermissionLabels).length - 1 && (
              <Separator className="mt-4" />
            )}
          </div>
        );
      })}
    </>
  );

  const renderSecretariaPermissions = () => (
    <>
      {Object.entries(secretariaPermissionLabels).map(([key, { label, description, fixed }], index) => {
        const permKey = key as keyof SecretariaPermissions;
        const isEnabled = secretariaPermissions[permKey];
        
        return (
          <div key={key}>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 flex-1">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">{label}</Label>
                  {fixed && <Lock className="h-3 w-3 text-muted-foreground" />}
                </div>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
              <Switch
                checked={isEnabled}
                onCheckedChange={(checked) => handleSecretariaPermissionChange(permKey, checked)}
                disabled={fixed || isDependentEditing}
                className={(fixed || isDependentEditing) ? 'opacity-50' : ''}
              />
            </div>
            {index < Object.entries(secretariaPermissionLabels).length - 1 && (
              <Separator className="mt-4" />
            )}
          </div>
        );
      })}
    </>
  );

  if (!selectedDependent) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />
      
      <main className="p-4 max-w-lg mx-auto space-y-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <Card className="shadow-card border-0">
            <CardHeader>
              <CardTitle className="font-display">Editar Dependente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isDependentEditing && (
                <Alert>
                  <AlertDescription className="text-sm">
                    Você pode alterar apenas login e senha. Para alterar outros dados, contate o responsável.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-border rounded-lg">
                <Upload className="h-10 w-10 text-muted-foreground" />
                <Label className="text-sm text-muted-foreground cursor-pointer text-center">
                  Alterar foto
                  <input type="file" accept="image/*" className="hidden" />
                </Label>
              </div>

              <Select value={tipo} onValueChange={(v) => setTipo(v as 'menor' | 'secretaria')} disabled={isDependentEditing}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de dependente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="menor">Dependente</SelectItem>
                  <SelectItem value="secretaria">Secretária</SelectItem>
                </SelectContent>
              </Select>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nome {isDependentEditing && <Lock className="h-3 w-3" />}
                </Label>
                <Input
                  placeholder="Nome do dependente"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  disabled={isDependentEditing}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Telefone {isDependentEditing && <Lock className="h-3 w-3" />}
                </Label>
                <Input
                  placeholder="(00) 00000-0000"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  disabled={isDependentEditing}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  E-mail {isDependentEditing && <Lock className="h-3 w-3" />}
                </Label>
                <Input
                  type="email"
                  placeholder="email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isDependentEditing}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  CPF {isDependentEditing && <Lock className="h-3 w-3" />}
                </Label>
                <Input
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  disabled={isDependentEditing}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4" />
                  Login
                </Label>
                <Input
                  placeholder="Nome de usuário para login"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4" />
                  Senha
                </Label>
                <Input
                  type="password"
                  placeholder="Nova senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {!isDependentEditing && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="shadow-card border-0">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5 text-primary" />
                  Permissões de Acesso
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {tipo === 'menor' 
                    ? 'Configure as permissões do dependente. Itens com cadeado não podem ser alterados.'
                    : 'Configure as permissões da secretária. Itens com cadeado não podem ser alterados.'
                  }
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {tipo === 'menor' ? renderDependentePermissions() : renderSecretariaPermissions()}
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <Button onClick={handleSave} className="w-full h-12 gap-2">
            <Save className="h-4 w-4" />
            Salvar Alterações
          </Button>
          {!isDependentEditing && (
            <Button 
              onClick={handleDelete} 
              variant="destructive" 
              className="w-full h-12 gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Remover Dependente
            </Button>
          )}
        </motion.div>
      </main>
    </div>
  );
}
