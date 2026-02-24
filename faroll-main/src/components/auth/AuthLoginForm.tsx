import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAuthContext } from '@/contexts/AuthContext';
import { LogIn, UserPlus, Loader2, Mail, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface AuthLoginFormProps {
  onSwitchToRegister: () => void;
}

export function AuthLoginForm({ onSwitchToRegister }: AuthLoginFormProps) {
  const { signIn, resetPassword, loading, error, clearLocalAuth } = useAuthContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.error('Preencha todos os campos');
      return;
    }

    const result = await signIn(email, password);

    if (!result.success) {
      toast.error(result.error || 'Erro ao fazer login');
      return;
    }

    // ✅ Login bem-sucedido: onAuthStateChange cuida da transição automaticamente
    // Não usar window.location.href pois causa reload e pode perder a sessão
    toast.success('Login realizado com sucesso!');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resetEmail.trim()) {
      toast.error('Informe seu email');
      return;
    }

    setResetLoading(true);
    const result = await resetPassword(resetEmail);
    setResetLoading(false);

    if (result.success) {
      toast.success('Email de recuperação enviado! Verifique sua caixa de entrada.');
      setShowForgotPassword(false);
      setResetEmail('');
    } else {
      toast.error(result.error || 'Erro ao enviar email de recuperação');
    }
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen gradient-health-soft flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 20 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-card border-0">
            <CardHeader>
              <CardTitle className="text-center font-display">Recuperar Senha</CardTitle>
              <CardDescription className="text-center">
                Digite seu email para receber um link de recuperação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="h-12"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 gap-2"
                  disabled={resetLoading}
                >
                  {resetLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                  Enviar Email
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setShowForgotPassword(false)}
                >
                  Voltar ao login
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

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
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white shadow-soft mb-4 overflow-hidden border-2 border-primary/10"
          >
            <img src="/logo-farollbr.jpeg" alt="Farollbr" className="h-full w-full object-cover" />
          </motion.div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground">
            Farollbr
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">
            Seu sinal seguro para o cuidado que você merece
          </p>
        </div>

        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="text-center font-display">Entrar</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 pr-10"
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    variant="link"
                    className="px-0 text-sm text-muted-foreground"
                    onClick={() => setShowForgotPassword(true)}
                  >
                    Esqueceu a senha?
                  </Button>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full text-[10px] h-7 text-muted-foreground/60 border-dashed hover:text-primary transition-all"
                  onClick={() => {
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.reload();
                  }}
                >
                  O botão não funciona? Clique aqui para Reparar a Conexão
                </Button>
              </div>

              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  className="flex-1 h-12 gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogIn className="h-4 w-4" />
                  )}
                  Entrar
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onSwitchToRegister}
                  className="flex-1 h-12 gap-2"
                  disabled={loading}
                >
                  <UserPlus className="h-4 w-4" />
                  Cadastrar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
