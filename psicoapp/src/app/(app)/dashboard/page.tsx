import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("clinic_id, role, professional_id")
    .single();
  const clinicId = profile?.clinic_id || "";
  const role = (profile?.role as string) || "dono_clinica";
  const professionalId = profile?.professional_id;

  const today = new Date().toISOString().slice(0, 10);
  const startOfToday = `${today}T00:00:00`;
  const endOfToday = `${today}T23:59:59`;

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  let consultasHojeQuery = supabase
    .from("appointments")
    .select("*", { count: "exact", head: true })
    .eq("clinic_id", clinicId)
    .gte("scheduled_at", startOfToday)
    .lte("scheduled_at", endOfToday)
    .neq("status", "cancelado");
  if (role === "profissional" && professionalId) {
    consultasHojeQuery = consultasHojeQuery.eq("professional_id", professionalId);
  }
  const { count: consultasHoje } = await consultasHojeQuery;

  let consultasMesQuery = supabase
    .from("appointments")
    .select("*", { count: "exact", head: true })
    .eq("clinic_id", clinicId)
    .gte("scheduled_at", monthStart.toISOString())
    .neq("status", "cancelado");
  if (role === "profissional" && professionalId) {
    consultasMesQuery = consultasMesQuery.eq("professional_id", professionalId);
  }
  const { count: consultasMes } = await consultasMesQuery;

  const { count: pacientesAtivos } = await supabase
    .from("patients")
    .select("*", { count: "exact", head: true })
    .eq("clinic_id", clinicId)
    .eq("status", "ativo");

  let paymentsQuery = supabase
    .from("payments")
    .select("amount")
    .eq("clinic_id", clinicId)
    .eq("paid", true)
    .gte("paid_at", monthStart.toISOString());
  if (role === "profissional" && professionalId) {
    paymentsQuery = paymentsQuery.eq("professional_id", professionalId);
  }
  const { data: receitaMes } = await paymentsQuery;
  const receitaValor = receitaMes?.reduce((s, r) => s + Number(r.amount), 0) ?? 0;

  const { data: conversion } =
    role === "dono_clinica"
      ? await supabase
          .from("v_conversation_conversion")
          .select("total_conversas, total_nao_agendaram, taxa_conversao_pct")
          .eq("clinic_id", clinicId)
          .single()
      : { data: null };

  const { count: listaEspera } = await supabase
    .from("waitlist")
    .select("*", { count: "exact", head: true })
    .eq("clinic_id", clinicId)
    .eq("status", "aguardando");

  const formatBRL = (n: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">
        {role === "dono_clinica"
          ? "Visão geral"
          : role === "profissional"
            ? "Meu dashboard"
            : "Operacional"}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link href="/agenda">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:border-indigo-300 transition cursor-pointer">
            <p className="text-sm text-slate-500">Consultas hoje</p>
            <p className="text-2xl font-bold text-indigo-600">{consultasHoje ?? 0}</p>
          </div>
        </Link>
        <Link href="/agenda">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:border-indigo-300 transition cursor-pointer">
            <p className="text-sm text-slate-500">Consultas do mês</p>
            <p className="text-2xl font-bold text-indigo-600">{consultasMes ?? 0}</p>
          </div>
        </Link>
        {role !== "profissional" && (
          <Link href="/pacientes">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:border-indigo-300 transition cursor-pointer">
              <p className="text-sm text-slate-500">Pacientes ativos</p>
              <p className="text-2xl font-bold text-indigo-600">{pacientesAtivos ?? 0}</p>
            </div>
          </Link>
        )}
        <Link href="/financeiro">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:border-indigo-300 transition cursor-pointer">
            <p className="text-sm text-slate-500">
              {role === "profissional" ? "Minha receita do mês" : "Receita do mês"}
            </p>
            <p className="text-2xl font-bold text-indigo-600">{formatBRL(receitaValor)}</p>
          </div>
        </Link>
      </div>

      {role === "dono_clinica" && conversion && (
        <Link href="/leads">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:border-indigo-300 transition cursor-pointer mb-8">
            <h3 className="font-semibold text-slate-900 mb-2">Leads (WhatsApp)</h3>
            <div className="flex gap-6 text-sm">
              <span>{conversion.total_conversas} conversas</span>
              <span className="text-amber-600">{conversion.total_nao_agendaram} não agendaram</span>
              <span className="text-indigo-600">Taxa conversão: {conversion.taxa_conversao_pct ?? 0}%</span>
            </div>
          </div>
        </Link>
      )}

      {role === "secretaria" && (listaEspera ?? 0) > 0 && (
        <Link href="/lista-espera">
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 cursor-pointer mb-8">
            <p className="font-medium text-amber-800">{listaEspera ?? 0} na lista de espera</p>
            <p className="text-sm text-amber-700">Clique para ver e dar follow-up</p>
          </div>
        </Link>
      )}
    </div>
  );
}
