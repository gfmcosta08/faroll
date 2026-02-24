import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Briefcase, 
  Search, 
  MapPin,
  Users,
  Calendar,
  Coins
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProfessionalWithMetrics {
  id: string;
  user_id: string;
  nome: string;
  email: string | null;
  profissao: string | null;
  especialidades: string[] | null;
  cidade: string | null;
  estado: string | null;
  ativo_galeria: boolean;
  total_clientes: number;
  total_agendamentos: number;
  total_gcoins: number;
}

export function AdminProfessionalManagement() {
  const { toast } = useToast();
  const [professionals, setProfessionals] = useState<ProfessionalWithMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchProfessionals = async () => {
    setLoading(true);
    try {
      // Buscar usuários com role profissional
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'profissional');

      if (rolesError) throw rolesError;

      if (!roles || roles.length === 0) {
        setProfessionals([]);
        setLoading(false);
        return;
      }

      const userIds = roles.map(r => r.user_id);

      // Buscar perfis dos profissionais
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, user_id, nome, email, profissao, especialidades, cidade, estado')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      if (!profiles || profiles.length === 0) {
        setProfessionals([]);
        setLoading(false);
        return;
      }

      const profileIds = profiles.map(p => p.id);

      // Buscar métricas em paralelo
      const [linksRes, eventsRes, gcoinsRes] = await Promise.all([
        // Total de clientes vinculados
        supabase
          .from('professional_client_links')
          .select('professional_id, client_id')
          .in('professional_id', profileIds),
        
        // Total de agendamentos
        supabase
          .from('calendar_events')
          .select('professional_id')
          .eq('tipo', 'agendamento')
          .in('professional_id', profileIds),
        
        // Total de Gcoins emitidos
        supabase
          .from('gcoins')
          .select('professional_id, quantidade')
          .in('professional_id', profileIds),
      ]);

      // Processar métricas
      const professionalsWithMetrics: ProfessionalWithMetrics[] = profiles.map(p => {
        const clientLinks = linksRes.data?.filter(l => l.professional_id === p.id) || [];
        const events = eventsRes.data?.filter(e => e.professional_id === p.id) || [];
        const gcoins = gcoinsRes.data?.filter(g => g.professional_id === p.id) || [];

        return {
          id: p.id,
          user_id: p.user_id,
          nome: p.nome,
          email: p.email,
          profissao: p.profissao,
          especialidades: p.especialidades,
          cidade: p.cidade,
          estado: p.estado,
          ativo_galeria: true, // Por enquanto assumimos ativo
          total_clientes: clientLinks.length,
          total_agendamentos: events.length,
          total_gcoins: gcoins.reduce((sum, g) => sum + (g.quantidade || 0), 0),
        };
      });

      setProfessionals(professionalsWithMetrics);
    } catch (error) {
      console.error('Erro ao buscar profissionais:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a lista de profissionais.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfessionals();
  }, []);

  // Filtrar profissionais
  const filteredProfessionals = professionals.filter(prof => {
    const matchesSearch = 
      prof.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (prof.profissao?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (prof.cidade?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    return matchesSearch;
  });

  const handleToggleGallery = async (prof: ProfessionalWithMetrics) => {
    const newStatus = !prof.ativo_galeria;
    
    try {
      await supabase.from('audit_logs').insert({
        user_id: prof.id,
        user_nome: prof.nome,
        user_role: 'profissional',
        acao: newStatus ? 'ativar_galeria' : 'desativar_galeria',
        descricao: `Profissional ${prof.nome} foi ${newStatus ? 'ativado' : 'desativado'} na galeria`,
        entidade_tipo: 'profile',
        entidade_id: prof.id,
      });

      toast({
        title: newStatus ? 'Ativado na galeria' : 'Desativado da galeria',
        description: `${prof.nome} foi ${newStatus ? 'ativado' : 'removido'} da galeria.`,
      });

      setProfessionals(prev => prev.map(p => 
        p.id === prof.id ? { ...p, ativo_galeria: newStatus } : p
      ));
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar o status.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gestão de Profissionais</CardTitle>
          <CardDescription>Gerenciar profissionais e visibilidade na galeria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="space-y-3">
              {Array(5).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
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
          <Briefcase className="h-5 w-5" />
          Gestão de Profissionais
        </CardTitle>
        <CardDescription>
          {filteredProfessionals.length} profissional(is) cadastrado(s)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, profissão ou cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Tabela */}
        {filteredProfessionals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum profissional encontrado</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Profissão</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead className="text-center">Clientes</TableHead>
                  <TableHead className="text-center">Agendamentos</TableHead>
                  <TableHead className="text-center">Gcoins</TableHead>
                  <TableHead className="text-center">Galeria</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfessionals.map((prof) => (
                  <TableRow key={prof.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{prof.nome}</div>
                        <div className="text-sm text-muted-foreground">{prof.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div>{prof.profissao || '-'}</div>
                        {prof.especialidades && prof.especialidades.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {prof.especialidades.slice(0, 2).map((esp, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {esp}
                              </Badge>
                            ))}
                            {prof.especialidades.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{prof.especialidades.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {prof.cidade || prof.estado ? (
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3" />
                          {[prof.cidade, prof.estado].filter(Boolean).join(', ')}
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {prof.total_clientes}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {prof.total_agendamentos}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Coins className="h-4 w-4 text-yellow-500" />
                        {prof.total_gcoins}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={prof.ativo_galeria}
                        onCheckedChange={() => handleToggleGallery(prof)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
