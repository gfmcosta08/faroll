/**
 * Utilitário SSO — FarolBR → Agente Comercial SaaS
 *
 * Gera um token JWT assinado com HMAC-SHA256 para autenticação
 * automática no SaaS sem segundo login.
 */

import { SignJWT } from "jose";
import type { AuthUser } from "@/hooks/useAuth";

const SSO_SECRET = import.meta.env.VITE_SSO_SECRET as string;
const SAAS_URL = import.meta.env.VITE_SAAS_URL as string;

/**
 * Gera o token JWT para o usuário atual do FarolBR.
 * Válido por 5 minutos (tempo suficiente para abrir o iframe).
 */
export async function generateSSOToken(user: AuthUser): Promise<string> {
  if (!SSO_SECRET) {
    throw new Error("[SSO] VITE_SSO_SECRET não configurado.");
  }

  const secret = new TextEncoder().encode(SSO_SECRET);

  const token = await new SignJWT({
    sub: user.id,
    email: user.email ?? "",
    name: user.nome ?? user.email ?? "Usuário",
    role: "tenant_admin",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(secret);

  return token;
}

/**
 * Retorna a URL completa do SaaS com o token SSO embutido.
 * Use esta URL como `src` do iframe.
 */
export async function getSaasEmbedUrl(user: AuthUser): Promise<string> {
  if (!SAAS_URL) {
    throw new Error("[SSO] VITE_SAAS_URL não configurado.");
  }
  const token = await generateSSOToken(user);
  return `${SAAS_URL}/sso?token=${token}&embed=true`;
}
