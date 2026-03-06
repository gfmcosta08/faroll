/**
 * Página /app/real-estate — FarolBR
 *
 * Exibe o Agente Comercial SaaS embutido via iframe com SSO automático.
 * O usuário logado no FarolBR não precisa fazer segundo login.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { getSaasEmbedUrl } from "@/utils/ssoToken";
import { Loader2, AlertCircle } from "lucide-react";

export default function RealEstatePage() {
  const { user, loading: authLoading } = useAuthContext();
  const navigate = useNavigate();
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Aguardar o auth carregar antes de verificar
    if (authLoading) return;

    // Se não estiver logado, redirecionar para login
    if (!user) {
      navigate("/?login=true");
      return;
    }

    // Gerar URL do SaaS com token SSO
    getSaasEmbedUrl(user)
      .then((url) => {
        setIframeUrl(url);
        setLoading(false);
      })
      .catch((err) => {
        console.error("[SSO] Erro ao gerar token:", err);
        setError("Não foi possível carregar o sistema. Tente novamente.");
        setLoading(false);
      });
  }, [user, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          flexDirection: "column",
          gap: "12px",
          color: "#6b7280",
        }}
      >
        <Loader2 style={{ width: 32, height: 32, animation: "spin 1s linear infinite" }} />
        <p style={{ fontSize: 14 }}>Carregando Agente Comercial...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          flexDirection: "column",
          gap: "12px",
          color: "#ef4444",
        }}
      >
        <AlertCircle style={{ width: 32, height: 32 }} />
        <p style={{ fontSize: 14 }}>{error}</p>
        <button
          onClick={() => window.location.reload()}
          style={{ fontSize: 12, textDecoration: "underline", color: "#6b7280", background: "none", border: "none", cursor: "pointer" }}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <iframe
      src={iframeUrl!}
      style={{ width: "100%", height: "100vh", border: "none", display: "block" }}
      title="Agente Comercial FarolBR"
      allow="clipboard-write; microphone"
    />
  );
}
