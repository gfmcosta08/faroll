import { createClient } from "@/lib/supabase/server";
import { FinanceiroClient } from "./financeiro-client";

export default async function FinanceiroPage() {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("clinic_id")
    .single();

  const { data: payments } = await supabase
    .from("payments")
    .select(
      `
      id, amount, paid, payment_method, paid_at, created_at,
      appointment:appointments(scheduled_at, patient:patients(name))
    `
    )
    .eq("clinic_id", profile?.clinic_id || "")
    .order("created_at", { ascending: false })
    .limit(100);

  const { data: receitaMensal } = await supabase
    .from("v_receita_mensal")
    .select("*")
    .eq("clinic_id", profile?.clinic_id || "")
    .order("mes", { ascending: false })
    .limit(12);

  const { data: prices } = await supabase
    .from("consultation_prices")
    .select("id, price, professional_id, specialty_id, professional:professionals(name), specialty:specialties(name)")
    .eq("clinic_id", profile?.clinic_id || "")
    .is("effective_to", null);

  const { data: appointments } = await supabase
    .from("appointments")
    .select("id, scheduled_at, professional:professionals(name), patient:patients(id, name)")
    .eq("clinic_id", profile?.clinic_id || "")
    .in("status", ["agendado", "confirmado", "realizado", "reagendado"])
    .gte("scheduled_at", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
    .order("scheduled_at", { ascending: false })
    .limit(50);

  return (
    <FinanceiroClient
      clinicId={profile?.clinic_id || ""}
      payments={(payments || []) as unknown as PaymentRow[]}
      receitaMensal={(receitaMensal || []) as unknown as ReceitaRow[]}
      prices={(prices || []) as unknown as PriceRow[]}
      appointments={(appointments || []) as unknown as AppointmentRow[]}
      professionals={await supabase.from("professionals").select("id, name").eq("clinic_id", profile?.clinic_id || "").then((r) => r.data || [])}
      specialties={await supabase.from("specialties").select("id, name").then((r) => r.data || [])}
    />
  );
}

type PriceRow = { id: string; price: number; professional_id: string | null; specialty_id: string | null; professional: unknown; specialty: unknown };
type AppointmentRow = { id: string; scheduled_at: string; professional: unknown; patient: unknown };

type PaymentRow = {
  id: string;
  amount: number;
  paid: boolean;
  payment_method: string | null;
  paid_at: string | null;
  created_at: string;
  appointment: {
    scheduled_at: string;
    patient: { name: string };
  } | null;
};

type ReceitaRow = {
  clinic_id: string;
  mes: string;
  receita: number;
  total_pagamentos: number;
};
