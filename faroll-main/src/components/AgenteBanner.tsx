/**
 * Banner "Automatize sua Imobiliária" — FarolBR
 *
 * Exibir no perfil do usuário logado (profissional ou empresa).
 * Ao clicar em "Contratar", redireciona para /app/real-estate.
 *
 * Uso: <AgenteBanner />
 */

import { useNavigate } from "react-router-dom";

export default function AgenteBanner() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        borderRadius: 16,
        border: "1px solid #fde68a",
        background: "linear-gradient(135deg, #fffbeb 0%, #fff7ed 100%)",
        padding: 20,
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: "#f59e0b",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            fontSize: 20,
          }}
        >
          🤖
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#111827" }}>
            Automatize sua Imobiliária
          </h3>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>
            Agente IA que atende clientes 24h no WhatsApp
          </p>
        </div>
      </div>

      {/* Benefícios */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
        {[
          { icon: "🕐", label: "Atendimento 24h" },
          { icon: "⚡", label: "Resposta imediata" },
          { icon: "📈", label: "Mais conversões" },
        ].map(({ icon, label }) => (
          <div
            key={label}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              borderRadius: 8,
              background: "rgba(255,255,255,0.7)",
              padding: "8px 4px",
              textAlign: "center",
            }}
          >
            <span style={{ fontSize: 16 }}>{icon}</span>
            <span style={{ fontSize: 10, fontWeight: 500, color: "#4b5563", lineHeight: 1.2 }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => navigate("/app/real-estate")}
          style={{
            flex: 1,
            borderRadius: 8,
            background: "#f59e0b",
            border: "none",
            padding: "8px 12px",
            fontSize: 12,
            fontWeight: 600,
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Contratar agora
        </button>
        <button
          onClick={() => navigate("/app/real-estate")}
          style={{
            borderRadius: 8,
            border: "1px solid #fcd34d",
            background: "#fff",
            padding: "8px 12px",
            fontSize: 12,
            fontWeight: 500,
            color: "#b45309",
            cursor: "pointer",
          }}
        >
          Saiba mais
        </button>
      </div>
    </div>
  );
}
