import React, { Component, ErrorInfo, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";

interface Props {
  children: ReactNode;
  title?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary global para evitar “tela branca” em produção.
 * Não altera regra de negócio: apenas captura erros de render/runtime e mostra fallback amigável.
 */
export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[GlobalErrorBoundary] Uncaught error:", error, errorInfo);
    
    // Recuperação automática para erros de DOM causados por extensões de navegador
    // (tradutores, Grammarly, bloqueadores de anúncio, etc.)
    if (error.message?.includes('removeChild') || error.message?.includes('insertBefore') || error.message?.includes('appendChild')) {
      console.warn("[GlobalErrorBoundary] Erro de DOM detectado (provável extensão de navegador) - tentando recuperar silenciosamente");
      setTimeout(() => {
        this.setState({ hasError: false, error: null });
      }, 100);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleBackToHome = () => {
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                {this.props.title || "Ocorreu um erro"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Tivemos um problema ao carregar esta tela. Você pode tentar novamente ou voltar ao início.
              </p>

              {this.state.error?.message ? (
                <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-40">
                  {this.state.error.message}
                </pre>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button onClick={this.handleRetry} size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Tentar novamente
                </Button>
                <Button onClick={this.handleBackToHome} variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar ao início
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
