import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/contexts/AppContext';
import { Heart, LogIn, UserPlus } from 'lucide-react';

export function LoginScreen() {
  const { login, navigate } = useApp();
  const [nome, setNome] = useState('');
  const [role, setRole] = useState<'cliente' | 'profissional'>('cliente');

  const handleLogin = () => {
    if (nome.trim()) {
      login(nome, role);
    }
  };

  return (
    <div className="min-h-screen gradient-health-soft flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 20 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-health shadow-soft mb-4"
          >
            <Heart className="h-8 w-8 text-primary-foreground" />
          </motion.div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            AppSaúde
          </h1>
          <p className="text-muted-foreground mt-2">
            Conectando você à saúde mental
          </p>
        </div>

        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="text-center font-display">Entrar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Nome completo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="h-12"
            />
            
            <Select value={role} onValueChange={(v) => setRole(v as 'cliente' | 'profissional')}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Selecione seu perfil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cliente">Cliente</SelectItem>
                <SelectItem value="profissional">Profissional</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-3 pt-2">
              <Button onClick={handleLogin} className="flex-1 h-12 gap-2">
                <LogIn className="h-4 w-4" />
                Entrar
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => navigate('cadastro')} 
                className="flex-1 h-12 gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Cadastrar
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
