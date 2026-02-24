import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Coins, ArrowDownCircle, ArrowUpCircle, RotateCcw, History } from 'lucide-react';
import { useGcoinHistory, GcoinTransaction, GcoinTransactionType } from '@/hooks/useGcoinHistory';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface GcoinHistoryCardProps {
  professionalId: string;
  maxHeight?: string;
}

const transactionConfig: Record<GcoinTransactionType, {
  icon: typeof Coins;
  label: string;
  colorClass: string;
  sign: string;
}> = {
  liberacao: {
    icon: ArrowDownCircle,
    label: 'Liberação',
    colorClass: 'text-green-600 bg-green-100 dark:bg-green-900/30',
    sign: '+',
  },
  consumo: {
    icon: ArrowUpCircle,
    label: 'Consumo',
    colorClass: 'text-red-600 bg-red-100 dark:bg-red-900/30',
    sign: '-',
  },
  extorno: {
    icon: RotateCcw,
    label: 'Extorno',
    colorClass: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
    sign: '+',
  },
};

function TransactionItem({ transaction }: { transaction: GcoinTransaction }) {
  const config = transactionConfig[transaction.tipo];
  const Icon = config.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 py-3 border-b border-border/50 last:border-0"
    >
      <div className={`p-2 rounded-full ${config.colorClass}`}>
        <Icon className="h-4 w-4" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {config.label}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {format(transaction.data, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </span>
        </div>
        <p className="text-sm text-foreground truncate mt-1">
          {transaction.descricao}
        </p>
      </div>
      
      <div className={`font-semibold ${transaction.tipo === 'consumo' ? 'text-destructive' : 'text-green-600'}`}>
        {config.sign}{transaction.quantidade}
      </div>
    </motion.div>
  );
}

export function GcoinHistoryCard({ professionalId, maxHeight = '400px' }: GcoinHistoryCardProps) {
  const { data: history, isLoading, error } = useGcoinHistory(professionalId);
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-destructive">
          Erro ao carregar histórico de Gcoins
        </CardContent>
      </Card>
    );
  }
  
  if (!history || history.transactions.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5 text-primary" />
            Histórico de Gcoins
          </CardTitle>
        </CardHeader>
        <CardContent className="py-6 text-center text-muted-foreground">
          Nenhuma transação de Gcoins encontrada para este vínculo.
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="h-5 w-5 text-primary" />
          Histórico de Gcoins
        </CardTitle>
        
        {/* Resumo do saldo */}
        <div className="flex items-center gap-4 mt-3 p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Saldo Atual</p>
              <p className="font-bold text-lg text-foreground">{history.saldoAtual}</p>
            </div>
          </div>
          
          <div className="h-8 w-px bg-border" />
          
          <div>
            <p className="text-xs text-muted-foreground">Liberados</p>
            <p className="font-semibold text-green-600">+{history.totalLiberado}</p>
          </div>
          
          <div>
            <p className="text-xs text-muted-foreground">Consumidos</p>
            <p className="font-semibold text-destructive">-{history.totalConsumido}</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <ScrollArea style={{ maxHeight }} className="pr-4">
          <div className="space-y-1">
            {history.transactions.map((transaction) => (
              <TransactionItem key={transaction.id} transaction={transaction} />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
