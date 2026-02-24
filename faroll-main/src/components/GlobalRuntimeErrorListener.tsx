import { useEffect } from "react";
import { toast } from "sonner";

/**
 * Captura erros que NÃO são pegos por ErrorBoundary (ex.: event handlers, promises).
 * Objetivo: evitar “silêncio” no domínio público e facilitar diagnóstico.
 * Não altera regra de negócio.
 */
export function GlobalRuntimeErrorListener() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      const message = event.error?.message || event.message || "Erro inesperado";
      // Mantém log técnico no console
      // eslint-disable-next-line no-console
      console.error("[runtime] window.error:", event.error || event);
      toast.error("Ocorreu um erro ao executar esta ação.", {
        description: message,
      });
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason as any;
      const message = reason?.message || String(reason) || "Erro inesperado";
      // eslint-disable-next-line no-console
      console.error("[runtime] unhandledrejection:", reason);
      toast.error("Ocorreu um erro ao executar esta ação.", {
        description: message,
      });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}
