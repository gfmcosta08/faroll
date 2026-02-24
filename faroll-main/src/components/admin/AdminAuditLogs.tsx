import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  FileText, 
  Search, 
  Filter,
  LogIn,
  LogOut,
  AlertTriangle,
  Clock,
  Shield
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface AuditLog {
  id: string;
  user_id: string | null;
  user_nome: string | null;
  user_role: string | null;
  acao: string;
  descricao: string | null;
  entidade_tipo: string | null;
  entidade_id: string | null;
  ip_address: string | null;
  created_at: string;
}

type ActionFilter = 'todos' | 'login' | 'logout' | 'cancelamento' | 'suspensao' | 'erro';

const actionIcons: Record<string, React.ReactNode> = {
  login: <LogIn className="h-4 w-4 text-green-500" />,
  logout: <LogOut className="h-4 w-4 text-blue-500" />,
  falha_login: <Shield className="h-4 w-4 text-red-500" />,
  cancelamento_tardio: <Clock className="h-4 w-4 text-orange-500" />,
  erro_sistema: <AlertTriangle className="h-4 w-4 text-red-500" />,
  suspensao_usuario: <Shield className="h-4 w-4 text-yellow-500" />,
  ativacao_usuario: <Shield className="h-4 w-4 text-green-500" />,
  force_logout: <LogOut className="h-4 w-4 text-red-500" />,
};

const getActionBadgeVariant = (acao: string) => {
  if (acao.includes('erro') || acao.includes('falha')) return 'destructive' as const;
  if (acao.includes('cancelamento') || acao.includes('suspensao')) return 'outline' as const;
  if (acao.includes('login') || acao.includes('ativacao')) return 'default' as const;
  return 'secondary' as const;
};

export function AdminAuditLogs() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<ActionFilter>('todos');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;

      setLogs(data || []);
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os logs de auditoria.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Filtrar logs
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      (log.user_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (log.acao?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (log.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    let matchesAction = true;
    if (actionFilter !== 'todos') {
      switch (actionFilter) {
        case 'login':
          matchesAction = log.acao.includes('login') && !log.acao.includes('falha');
          break;
        case 'logout':
          matchesAction = log.acao.includes('logout');
          break;
        case 'cancelamento':
          matchesAction = log.acao.includes('cancelamento');
          break;
        case 'suspensao':
          matchesAction = log.acao.includes('suspensao') || log.acao.includes('ativacao');
          break;
        case 'erro':
          matchesAction = log.acao.includes('erro') || log.acao.includes('falha');
          break;
      }
    }
    
    return matchesSearch && matchesAction;
  });

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Logs de Auditoria</CardTitle>
          <CardDescription>Histórico de ações e eventos do sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="space-y-3">
              {Array(5).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Logs de Auditoria
        </CardTitle>
        <CardDescription>
          {filteredLogs.length} registro(s) encontrado(s) (somente leitura)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por usuário, ação ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={actionFilter} onValueChange={(v) => setActionFilter(v as ActionFilter)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Tipo de ação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas as ações</SelectItem>
              <SelectItem value="login">Login</SelectItem>
              <SelectItem value="logout">Logout</SelectItem>
              <SelectItem value="cancelamento">Cancelamentos</SelectItem>
              <SelectItem value="suspensao">Suspensões</SelectItem>
              <SelectItem value="erro">Erros/Falhas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabela */}
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum log encontrado</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Data/Hora</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {actionIcons[log.acao] || <FileText className="h-4 w-4 text-muted-foreground" />}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{log.user_nome || 'Sistema'}</div>
                        {log.user_role && (
                          <Badge variant="outline" className="text-xs mt-1">
                            {log.user_role}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getActionBadgeVariant(log.acao)}>
                        {log.acao.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <p className="text-sm text-muted-foreground truncate">
                        {log.descricao || '-'}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
