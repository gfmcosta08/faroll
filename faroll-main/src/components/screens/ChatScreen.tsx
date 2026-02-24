import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { Send, Paperclip, FileText, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Navigation } from '@/components/layout/Navigation';
import { toast } from 'sonner';
import { useChatMessages, useSendChatMessage } from '@/hooks/useChatMessages';

export function ChatScreen() {
  const { selectedProfessional, canSendMessage, canSendFiles, navigate } = useApp();
  const { user } = useAuthContext();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // IDs para a conversa
  const professionalId = selectedProfessional?.id;
  const clientId = user?.profileId;
  const senderId = user?.profileId;

  // Buscar mensagens do banco de dados
  const { data: messages = [], isLoading, error } = useChatMessages(professionalId, clientId);
  
  // Mutation para enviar mensagem
  const sendMessageMutation = useSendChatMessage();

  const userCanSend = canSendMessage();
  const userCanSendFiles = canSendFiles();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || !selectedProfessional || !userCanSend || !clientId || !senderId) {
      return;
    }

    try {
      await sendMessageMutation.mutateAsync({
        professionalId: selectedProfessional.id,
        clientId: clientId,
        senderId: senderId,
        content: message.trim(),
      });
      setMessage('');
    } catch (err) {
      toast.error('Erro ao enviar mensagem');
    }
  };

  const handleAttachment = () => {
    if (!userCanSendFiles) {
      toast.error('Você não tem permissão para enviar arquivos');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedProfessional && clientId && senderId) {
      try {
        const attachmentName = `anexo_${Date.now()}_${file.name}`;
        await sendMessageMutation.mutateAsync({
          professionalId: selectedProfessional.id,
          clientId: clientId,
          senderId: senderId,
          content: `[Anexo: ${file.name}]`,
          attachment: attachmentName,
        });
        toast.success('Arquivo anexado');
      } catch (err) {
        toast.error('Erro ao enviar anexo');
      }
    }
    e.target.value = '';
  };

  // Função para determinar o nome do remetente
  const getSenderName = (senderIdMsg: string) => {
    if (senderIdMsg === user?.profileId) {
      return 'Você';
    }
    return selectedProfessional?.nome || 'Profissional';
  };

  if (!selectedProfessional) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />
      
      <main className="p-4 max-w-2xl mx-auto space-y-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <Card className="shadow-card border-0">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-lg">
                Chat com {selectedProfessional.nome}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-48 overflow-y-auto border border-border rounded-lg p-3 bg-muted/30">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : error ? (
                  <p className="text-center text-destructive text-sm py-8">
                    Erro ao carregar mensagens
                  </p>
                ) : messages.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-8">
                    Nenhuma mensagem ainda. Inicie a conversa!
                  </p>
                ) : (
                  messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-2 last:mb-0"
                    >
                      <span className="font-medium text-primary">
                        {getSenderName(msg.sender_id)}:{' '}
                      </span>
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
                  placeholder={userCanSend ? "Digite sua mensagem..." : "Sem permissão para enviar mensagens"}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !sendMessageMutation.isPending && handleSend()}
                  className="flex-1"
                  disabled={!userCanSend || sendMessageMutation.isPending}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleAttachment} 
                  disabled={!userCanSendFiles || sendMessageMutation.isPending}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button 
                  onClick={handleSend} 
                  size="icon" 
                  disabled={!userCanSend || sendMessageMutation.isPending}
                >
                  {sendMessageMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="shadow-card border-0">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Proposta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate('proposta')} 
                className="w-full gap-2"
              >
                <FileText className="h-4 w-4" />
                Abrir Proposta
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
