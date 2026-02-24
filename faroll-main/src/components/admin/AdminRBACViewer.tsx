import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Shield, 
  Check,
  X,
  Eye,
  Edit,
  Trash,
  Calendar,
  MessageSquare,
  Coins,
  FileText,
  Users
} from 'lucide-react';

interface Permission {
  action: string;
  allowed: boolean;
}

interface RolePermissions {
  role: string;
  label: string;
  description: string;
  permissions: Permission[];
}

const rolePermissions: RolePermissions[] = [
  {
    role: 'admin',
    label: 'Administrador',
    description: 'Acesso total ao sistema (exceto dados clínicos)',
    permissions: [
      { action: 'Ver Dashboard', allowed: true },
      { action: 'Gerenciar Usuários', allowed: true },
      { action: 'Ver Logs', allowed: true },
      { action: 'Auditar Gcoins', allowed: true },
      { action: 'Configurar Sistema', allowed: true },
      { action: 'Ver Chat', allowed: false },
      { action: 'Ver Dados Clínicos', allowed: false },
      { action: 'Agendar Consultas', allowed: false },
    ],
  },
  {
    role: 'profissional',
    label: 'Profissional',
    description: 'Gerencia agenda, clientes e conteúdo clínico',
    permissions: [
      { action: 'Ver Galeria', allowed: true },
      { action: 'Gerenciar Agenda', allowed: true },
      { action: 'Ver Chat', allowed: true },
      { action: 'Criar Propostas', allowed: true },
      { action: 'Ver Dados Clínicos', allowed: true },
      { action: 'Liberar Gcoins', allowed: true },
      { action: 'Agendar Consultas', allowed: false },
      { action: 'Ver Dashboard Admin', allowed: false },
    ],
  },
  {
    role: 'cliente',
    label: 'Cliente',
    description: 'Agenda consultas e gerencia seus Gcoins',
    permissions: [
      { action: 'Ver Galeria', allowed: true },
      { action: 'Agendar Consultas', allowed: true },
      { action: 'Ver Chat', allowed: true },
      { action: 'Aceitar Propostas', allowed: true },
      { action: 'Usar Gcoins', allowed: true },
      { action: 'Gerenciar Dependentes', allowed: true },
      { action: 'Ver Dados Clínicos', allowed: false },
      { action: 'Ver Dashboard Admin', allowed: false },
    ],
  },
  {
    role: 'secretaria',
    label: 'Secretária',
    description: 'Auxilia profissional em tarefas administrativas',
    permissions: [
      { action: 'Gerenciar Agenda', allowed: true },
      { action: 'Negociar Propostas', allowed: true },
      { action: 'Liberar Gcoins', allowed: true },
      { action: 'Acesso Financeiro', allowed: true },
      { action: 'Ver Chat', allowed: false },
      { action: 'Ver Dados Clínicos', allowed: false },
      { action: 'Agendar Consultas', allowed: false },
      { action: 'Ver Dashboard Admin', allowed: false },
    ],
  },
  {
    role: 'dependente',
    label: 'Dependente',
    description: 'Acesso limitado vinculado a um responsável',
    permissions: [
      { action: 'Ver Calendário', allowed: true },
      { action: 'Ver Compromissos', allowed: true },
      { action: 'Ver Chat (leitura)', allowed: true },
      { action: 'Agendar Consultas', allowed: false },
      { action: 'Usar Gcoins', allowed: false },
      { action: 'Negociar Propostas', allowed: false },
      { action: 'Enviar Arquivos', allowed: false },
      { action: 'Ver Dashboard Admin', allowed: false },
    ],
  },
];

export function AdminRBACViewer() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Papéis e Permissões (RBAC)
        </CardTitle>
        <CardDescription>
          Visualização das permissões por papel no sistema (somente leitura)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {rolePermissions.map((role) => (
          <div key={role.role} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  <Badge 
                    variant={
                      role.role === 'admin' ? 'destructive' : 
                      role.role === 'profissional' ? 'default' : 
                      'secondary'
                    }
                  >
                    {role.label}
                  </Badge>
                </h3>
                <p className="text-sm text-muted-foreground mt-1">{role.description}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {role.permissions.map((perm, i) => (
                <div 
                  key={i}
                  className={`flex items-center gap-2 p-2 rounded text-sm ${
                    perm.allowed 
                      ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400' 
                      : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400'
                  }`}
                >
                  {perm.allowed ? (
                    <Check className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <X className="h-4 w-4 flex-shrink-0" />
                  )}
                  <span className="truncate">{perm.action}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Nota de segurança */}
        <div className="bg-muted/50 rounded-lg p-4 text-sm">
          <p className="font-medium mb-2">⚠️ Nota de Segurança</p>
          <ul className="space-y-1 text-muted-foreground">
            <li>• A promoção para Admin só pode ser feita via banco de dados (função <code>promote_user_to_admin</code>)</li>
            <li>• Admins não podem criar outros admins pelo frontend</li>
            <li>• Alterações de papéis são registradas nos logs de auditoria</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
