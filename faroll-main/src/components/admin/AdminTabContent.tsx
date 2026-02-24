import React, { ReactNode, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminErrorBoundary } from './AdminErrorBoundary';

interface AdminTabContentProps {
  children: ReactNode;
  loading?: boolean;
  fallbackTitle?: string;
}

function TabLoadingFallback() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64 mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="space-y-3">
          {Array(5).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Wrapper para conteúdo de abas do Admin.
 * Garante:
 * 1. ErrorBoundary para capturar erros e evitar tela branca
 * 2. Loading state enquanto dados carregam
 * 3. Suspense para lazy loading futuro
 */
export function AdminTabContent({ 
  children, 
  loading = false,
  fallbackTitle 
}: AdminTabContentProps) {
  if (loading) {
    return <TabLoadingFallback />;
  }

  return (
    <AdminErrorBoundary fallbackTitle={fallbackTitle}>
      <Suspense fallback={<TabLoadingFallback />}>
        {children}
      </Suspense>
    </AdminErrorBoundary>
  );
}
