import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { Send, HeadphonesIcon, Paperclip } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Navigation } from '@/components/layout/Navigation';
import { toast } from 'sonner';

export function SupportScreen() {
  // GUARD DEFENSIVO: Não destructure diretamente; validar contexto primeiro
  const app = useApp();
  
  // TODOS OS HOOKS devem vir ANTES de qualquer return condicional (Rules of Hooks)
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Extrair valores do app com fallbacks seguros (hooks já foram declarados)
  const user = app?.user;
  const supportChats = app?.supportChats || {};
  const sendSupportMessage = app?.sendSupportMessage;

  const chatKey = `${user?.nome || 'anon'}|${user?.role || 'guest'}`;
  const messages = supportChats[chatKey] || [];

  // useEffect DEVE vir antes de returns condicionais
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // GUARD: Se contexto não está pronto, mostra loading
  if (!app) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando suporte...</p>
      </div>
    );
  }

  const handleSend = () => {
    if (message.trim() && sendSupportMessage) {
      sendSupportMessage(message);
      setMessage('');
    }
  };

  const handleAttachment = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && sendSupportMessage) {
      const attachmentName = `suporte_anexo_${Date.now()}_${file.name}`;
      sendSupportMessage(`[Anexo: ${file.name}]`, attachmentName);
      toast.success('Arquivo anexado ao suporte (simulado)');
    }
    e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />
      
      <main className="p-4 max-w-2xl mx-auto">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <Card className="shadow-card border-0">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <HeadphonesIcon className="h-5 w-5 text-primary" />
                Suporte
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-64 overflow-y-auto border border-border rounded-lg p-4 bg-muted/30">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <HeadphonesIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-muted-foreground text-sm">
                      Como podemos ajudar você?
                    </p>
                    <p className="text-muted-foreground text-xs mt-1">
                      Envie uma mensagem para nossa equipe de suporte.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-3 last:mb-0"
                    >
                      <span className="font-medium text-primary">{msg.sender}: </span>
                      <span className="text-foreground">{msg.content}</span>
                      {msg.attachment && (
                        <span className="text-xs text-muted-foreground ml-2">📎</span>
                      )}
                    </motion.div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Digite sua mensagem..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  className="flex-1"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button variant="ghost" size="icon" onClick={handleAttachment}>
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button onClick={handleSend} size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
