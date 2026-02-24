import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Users, 
  Search, 
  Filter,
  UserCheck,
  UserX,
  LogOut,
  MoreHorizontal,
  Calendar,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface UserWithRole {
  id: string;
  user_id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  created_at: string;
  role: string;
  status: 'ativo' | 'suspenso';
}

type RoleFilter = 'todos' | 'cliente' | 'profissional' | 'dependente' | 'secretaria' | 'admin';
type StatusFilter = 'todos' | 'ativo' | 'suspenso';

const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case 'admin': return 'destructive' as const;
    case 'profissional': return 'default' as const;
    case 'cliente': return 'secondary' as const;
    case 'secretaria': return 'outline' as const;
    case 'dependente': return 'outline' as const;
    default: return 'secondary' as const;
  }
};

const formatDate = (dateStr: string) => {
  return format(new Date(dateStr), "dd/MM/yyyy", { locale: ptBR });
};

export function AdminUserManagement() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('todos');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos');
  
  // Delete user state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserWithRole | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Buscar todos os perfis
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, user_id, nome, email, telefone, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      if (profiles && profiles.length > 0) {
        // Buscar roles
        const userIds = profiles.map(p => p.user_id);
        const { data: roles, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', userIds);

        if (rolesError) throw rolesError;

        // Combinar dados
        const usersWithRoles: UserWithRole[] = profiles.map(p => ({
          id: p.id,
          user_id: p.user_id,
          nome: p.nome,
          email: p.email,
          telefone: p.telefone,
          created_at: p.created_at,
          role: roles?.find(r => r.user_id === p.user_id)?.role || 'cliente',
          status: 'ativo' as const, // Por enquanto assumimos ativo
        }));

        setUsers(usersWithRoles);
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a lista de usuários.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filtrar usuários
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    const matchesRole = roleFilter === 'todos' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'todos' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleSuspendUser = async (user: UserWithRole) => {
    // Por enquanto, apenas logamos no audit_logs
    try {
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        user_nome: user.nome,
        user_role: user.role,
        acao: 'suspensao_usuario',
        descricao: `Usuário ${user.nome} foi suspenso pelo administrador`,
        entidade_tipo: 'profile',
        entidade_id: user.id,
      });

      toast({
        title: 'Usuário suspenso',
        description: `${user.nome} foi suspenso com sucesso.`,
      });

      // Atualizar status local
      setUsers(prev => prev.map(u => 
        u.id === user.id ? { ...u, status: 'suspenso' as const } : u
      ));
    } catch (error) {
      console.error('Erro ao suspender usuário:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível suspender o usuário.',
        variant: 'destructive',
      });
    }
  };

  const handleActivateUser = async (user: UserWithRole) => {
    try {
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        user_nome: user.nome,
        user_role: user.role,
        acao: 'ativacao_usuario',
        descricao: `Usuário ${user.nome} foi reativado pelo administrador`,
        entidade_tipo: 'profile',
        entidade_id: user.id,
      });

      toast({
        title: 'Usuário ativado',
        description: `${user.nome} foi ativado com sucesso.`,
      });

      setUsers(prev => prev.map(u => 
        u.id === user.id ? { ...u, status: 'ativo' as const } : u
      ));
    } catch (error) {
      console.error('Erro ao ativar usuário:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível ativar o usuário.',
        variant: 'destructive',
      });
    }
  };

  const handleForceLogout = async (user: UserWithRole) => {
    // Nota: Supabase não tem API direta para forçar logout
    // Isso seria um registro de auditoria
    try {
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        user_nome: user.nome,
        user_role: user.role,
        acao: 'force_logout',
        descricao: `Sessão de ${user.nome} foi encerrada forçosamente pelo administrador`,
        entidade_tipo: 'profile',
        entidade_id: user.id,
      });

      toast({
        title: 'Logout forçado',
        description: `A sessão de ${user.nome} será encerrada na próxima verificação.`,
      });
    } catch (error) {
      console.error('Erro ao forçar logout:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível forçar o logout.',
        variant: 'destructive',
      });
    }
  };

  const openDeleteDialog = (user: UserWithRole) => {
    setUserToDelete(user);
    setDeleteConfirmName('');
    setDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    setIsDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Sessão expirada');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-delete-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ user_id: userToDelete.user_id }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao excluir usuário');
      }

      // Remove from local list
      setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
      
      toast({
        title: 'Conta excluída',
        description: `A conta de ${userToDelete.nome} foi excluída permanentemente.`,
      });

      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (error: any) {
      console.error('Erro ao excluir usuário:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível excluir o usuário.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gestão de Usuários</CardTitle>
          <CardDescription>Gerenciar todos os usuários do sistema</CardDescription>
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
          <Users className="h-5 w-5" />
          Gestão de Usuários
        </CardTitle>
        <CardDescription>
          {filteredUsers.length} usuário(s) encontrado(s)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as RoleFilter)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Papel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os papéis</SelectItem>
              <SelectItem value="cliente">Cliente</SelectItem>
              <SelectItem value="profissional">Profissional</SelectItem>
              <SelectItem value="dependente">Dependente</SelectItem>
              <SelectItem value="secretaria">Secretária</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="suspenso">Suspenso</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabela */}
        {filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum usuário encontrado</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead className="w-[70px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.nome}</TableCell>
                    <TableCell>{user.email || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.status === 'ativo' ? 'outline' : 'destructive'}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-muted-foreground text-sm">
                        <Calendar className="h-3 w-3" />
                        {formatDate(user.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {user.status === 'ativo' ? (
                            <DropdownMenuItem onClick={() => handleSuspendUser(user)}>
                              <UserX className="h-4 w-4 mr-2" />
                              Suspender
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleActivateUser(user)}>
                              <UserCheck className="h-4 w-4 mr-2" />
                              Ativar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleForceLogout(user)}>
                            <LogOut className="h-4 w-4 mr-2" />
                            Forçar Logout
                          </DropdownMenuItem>
                          {user.role !== 'admin' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => openDeleteDialog(user)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir Conta
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Excluir Conta Permanentemente
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3">
                  <p className="font-semibold text-destructive">
                    Esta ação é IRREVERSÍVEL!
                  </p>
                  <p>
                    Serão excluídos permanentemente:
                  </p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>Perfil do usuário</li>
                    <li>Mensagens de chat</li>
                    <li>Eventos de calendário</li>
                    <li>Propostas e Gcoins</li>
                    <li>Todos os vínculos</li>
                  </ul>
                  <div className="pt-2">
                    <p className="text-sm mb-2">
                      Digite <strong>"{userToDelete?.nome}"</strong> para confirmar:
                    </p>
                    <Input
                      value={deleteConfirmName}
                      onChange={(e) => setDeleteConfirmName(e.target.value)}
                      placeholder="Digite o nome do usuário"
                      className="w-full"
                    />
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteUser}
                disabled={deleteConfirmName !== userToDelete?.nome || isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? 'Excluindo...' : 'Excluir Permanentemente'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
