import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Coins, 
  Search, 
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Link2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface GcoinRecord {
  id: string;
  professional_id: string;
  professional_nome: string;
  client_id: string;
  client_nome: string;
  quantidade: number;
  consumido: number;
  disponivel: number;
  data_liberacao: string;
}

interface ClientProfessionalLink {
  id: string;
  professional_id: string;
  professional_nome: string;
  client_id: string;
  client_nome: string;
  gcoins_liberados: boolean;
  proposta_aceita: boolean;
  data_vinculo: string;
}

export function AdminGcoinAudit() {
  const { toast } = useToast();
  const [gcoins, setGcoins] = useState<GcoinRecord[]>([]);
  const [links, setLinks] = useState<ClientProfessionalLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'gcoins' | 'vinculos'>('gcoins');

  const fetchData = async () => {
    setLoading(true);
    try {
      // Buscar Gcoins
      const { data: gcoinsData, error: gcoinsError } = await supabase
        .from('gcoins')
        .select('id, professional_id, client_id, quantidade, consumido, disponivel, data_liberacao')
        .order('data_liberacao', { ascending: false });

      if (gcoinsError) throw gcoinsError;

      // Buscar vínculos
      const { data: linksData, error: linksError } = await supabase
        .from('professional_client_links')
        .select('id, professional_id, client_id, gcoins_liberados, proposta_aceita, data_vinculo')
        .order('data_vinculo', { ascending: false });

      if (linksError) throw linksError;

      // Coletar todos os IDs de perfis únicos
      const profileIds = new Set<string>();
      gcoinsData?.forEach(g => {
        profileIds.add(g.professional_id);
        profileIds.add(g.client_id);
      });
      linksData?.forEach(l => {
        profileIds.add(l.professional_id);
        profileIds.add(l.client_id);
      });

      // Buscar nomes dos perfis
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nome')
        .in('id', Array.from(profileIds));

      const profileMap = new Map(profiles?.map(p => [p.id, p.nome]) || []);

      // Processar Gcoins
      const processedGcoins: GcoinRecord[] = (gcoinsData || []).map(g => ({
        id: g.id,
        professional_id: g.professional_id,
        professional_nome: profileMap.get(g.professional_id) || 'Desconhecido',
        client_id: g.client_id,
        client_nome: profileMap.get(g.client_id) || 'Desconhecido',
        quantidade: g.quantidade,
        consumido: g.consumido,
        disponivel: g.disponivel || 0,
        data_liberacao: g.data_liberacao,
      }));

      // Processar vínculos
      const processedLinks: ClientProfessionalLink[] = (linksData || []).map(l => ({
        id: l.id,
        professional_id: l.professional_id,
        professional_nome: profileMap.get(l.professional_id) || 'Desconhecido',
        client_id: l.client_id,
        client_nome: profileMap.get(l.client_id) || 'Desconhecido',
        gcoins_liberados: l.gcoins_liberados || false,
        proposta_aceita: l.proposta_aceita || false,
        data_vinculo: l.data_vinculo,
      }));

      setGcoins(processedGcoins);
      setLinks(processedLinks);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados de Gcoins.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtrar dados
  const filteredGcoins = gcoins.filter(g => {
    const matchesSearch = 
      g.professional_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.client_nome.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredLinks = links.filter(l => {
    const matchesSearch = 
      l.professional_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.client_nome.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  // Calcular totais
  const totalEmitidos = gcoins.reduce((sum, g) => sum + g.quantidade, 0);
  const totalConsumidos = gcoins.reduce((sum, g) => sum + g.consumido, 0);
  const totalDisponiveis = gcoins.reduce((sum, g) => sum + g.disponivel, 0);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Auditoria de Gcoins</CardTitle>
          <CardDescription>Histórico de emissões, consumos e vínculos</CardDescription>
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
          <Coins className="h-5 w-5" />
          Auditoria de Gcoins
        </CardTitle>
        <CardDescription>
          Histórico completo de transações e vínculos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resumo */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-lg font-bold text-green-700 dark:text-green-400">{totalEmitidos}</span>
            </div>
            <p className="text-xs text-green-600 dark:text-green-500">Emitidos</p>
          </div>
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <span className="text-lg font-bold text-red-700 dark:text-red-400">{totalConsumidos}</span>
            </div>
            <p className="text-xs text-red-600 dark:text-red-500">Consumidos</p>
          </div>
          <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-yellow-600" />
              <span className="text-lg font-bold text-yellow-700 dark:text-yellow-400">{totalDisponiveis}</span>
            </div>
            <p className="text-xs text-yellow-600 dark:text-yellow-500">Disponíveis</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setActiveTab('gcoins')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'gcoins' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Coins className="h-4 w-4 inline mr-2" />
            Histórico ({gcoins.length})
          </button>
          <button
            onClick={() => setActiveTab('vinculos')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'vinculos' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Link2 className="h-4 w-4 inline mr-2" />
            Vínculos ({links.length})
          </button>
        </div>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por profissional ou cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Conteúdo */}
        {activeTab === 'gcoins' ? (
          filteredGcoins.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Coins className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum registro de Gcoin encontrado</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Profissional</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-center">Emitidos</TableHead>
                    <TableHead className="text-center">Consumidos</TableHead>
                    <TableHead className="text-center">Disponíveis</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGcoins.map((g) => (
                    <TableRow key={g.id}>
                      <TableCell className="font-medium">{g.professional_nome}</TableCell>
                      <TableCell>{g.client_nome}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          +{g.quantidade}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-red-50 text-red-700">
                          -{g.consumido}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                          {g.disponivel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(g.data_liberacao)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )
        ) : (
          filteredLinks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Link2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum vínculo encontrado</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Profissional</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-center">Proposta</TableHead>
                    <TableHead className="text-center">Gcoins</TableHead>
                    <TableHead>Data Vínculo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLinks.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium">{l.professional_nome}</TableCell>
                      <TableCell>{l.client_nome}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={l.proposta_aceita ? 'default' : 'secondary'}>
                          {l.proposta_aceita ? 'Aceita' : 'Pendente'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={l.gcoins_liberados ? 'default' : 'outline'}>
                          {l.gcoins_liberados ? 'Liberados' : 'Não liberados'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(l.data_vinculo)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )
        )}
      </CardContent>
    </Card>
  );
}
