import { AdminPanel } from '@/components/admin/AdminPanel';

/**
 * Página Admin - Apenas renderiza o AdminPanel.
 * 
 * A validação de sessão e role admin é feita internamente pelo AdminGuard.
 * Isso evita duplicação de lógica e race conditions.
 */
export default function Admin() {
  return <AdminPanel />;
}
