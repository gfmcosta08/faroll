import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("clinic_id")
    .eq("user_id", (data.claims as { sub?: string }).sub)
    .single();

  if (!profile?.clinic_id) {
    redirect("/setup");
  }

  const nav = [
    { href: "/dashboard", label: "Visão geral" },
    { href: "/agenda", label: "Agenda" },
    { href: "/pacientes", label: "Pacientes" },
    { href: "/profissionais", label: "Profissionais" },
    { href: "/whatsapp", label: "WhatsApp" },
    { href: "/financeiro", label: "Financeiro" },
    { href: "/lista-espera", label: "Lista de espera" },
    { href: "/leads", label: "Leads" },
  ];

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 bg-slate-900 text-white flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <Link href="/dashboard" className="font-bold text-lg">
            Health-App
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-700">
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 p-6 bg-slate-50 overflow-auto">{children}</main>
    </div>
  );
}
