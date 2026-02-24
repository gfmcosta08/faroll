import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/contexts/AppContext';
import { ArrowLeft, Upload, UserPlus } from 'lucide-react';
import { Label } from '@/components/ui/label';

export function RegisterScreen() {
  const { login, navigate } = useApp();
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    telefone: '',
    email: '',
    pais: 'Brasil',
    estado: '',
    cidade: '',
    role: 'cliente' as 'cliente' | 'profissional',
    profissao: '',
    especialidades: ['', '', ''],
    tipoAtendimento: '',
    descricao: '',
    registro: '',
  });

  const handleSubmit = () => {
    if (formData.nome.trim()) {
      login(formData.nome, formData.role);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen gradient-health-soft p-4 py-8">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-lg mx-auto"
      >
        <Button 
          variant="ghost" 
          onClick={() => navigate('login')} 
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="font-display">Cadastrar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center gap-3 p-4 border-2 border-dashed border-border rounded-lg">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <Label className="text-sm text-muted-foreground cursor-pointer">
                Clique para adicionar foto
                <input type="file" accept="image/*" className="hidden" />
              </Label>
            </div>

            <Input
              placeholder="Nome completo"
              value={formData.nome}
              onChange={(e) => updateField('nome', e.target.value)}
            />
            <Input
              placeholder="CPF"
              value={formData.cpf}
              onChange={(e) => updateField('cpf', e.target.value)}
            />
            <Input
              placeholder="Telefone"
              value={formData.telefone}
              onChange={(e) => updateField('telefone', e.target.value)}
            />
            <Input
              placeholder="E-mail"
              type="email"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
            />
            
            <div className="grid grid-cols-3 gap-2">
              <Input
                placeholder="País"
                value={formData.pais}
                onChange={(e) => updateField('pais', e.target.value)}
              />
              <Input
                placeholder="Estado"
                value={formData.estado}
                onChange={(e) => updateField('estado', e.target.value)}
              />
              <Input
                placeholder="Cidade"
                value={formData.cidade}
                onChange={(e) => updateField('cidade', e.target.value)}
              />
            </div>

            <Select 
              value={formData.role} 
              onValueChange={(v) => updateField('role', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tipo de usuário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cliente">Cliente</SelectItem>
                <SelectItem value="profissional">Profissional</SelectItem>
              </SelectContent>
            </Select>

            {formData.role === 'profissional' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="space-y-4 pt-2"
              >
                <Input
                  placeholder="Profissão"
                  value={formData.profissao}
                  onChange={(e) => updateField('profissao', e.target.value)}
                />
                <Input
                  placeholder="Especialidade 1"
                  value={formData.especialidades[0]}
                  onChange={(e) => {
                    const newEsp = [...formData.especialidades];
                    newEsp[0] = e.target.value;
                    setFormData(prev => ({ ...prev, especialidades: newEsp }));
                  }}
                />
                <Input
                  placeholder="Especialidade 2"
                  value={formData.especialidades[1]}
                  onChange={(e) => {
                    const newEsp = [...formData.especialidades];
                    newEsp[1] = e.target.value;
                    setFormData(prev => ({ ...prev, especialidades: newEsp }));
                  }}
                />
                <Input
                  placeholder="Especialidade 3"
                  value={formData.especialidades[2]}
                  onChange={(e) => {
                    const newEsp = [...formData.especialidades];
                    newEsp[2] = e.target.value;
                    setFormData(prev => ({ ...prev, especialidades: newEsp }));
                  }}
                />
                <Input
                  placeholder="Tipo de atendimento"
                  value={formData.tipoAtendimento}
                  onChange={(e) => updateField('tipoAtendimento', e.target.value)}
                />
                <Textarea
                  placeholder="Descrição profissional"
                  value={formData.descricao}
                  onChange={(e) => updateField('descricao', e.target.value)}
                />
                <Input
                  placeholder="Número do conselho (CRP, CRM, etc.)"
                  value={formData.registro}
                  onChange={(e) => updateField('registro', e.target.value)}
                />
              </motion.div>
            )}

            <Button onClick={handleSubmit} className="w-full h-12 gap-2">
              <UserPlus className="h-4 w-4" />
              Cadastrar
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
