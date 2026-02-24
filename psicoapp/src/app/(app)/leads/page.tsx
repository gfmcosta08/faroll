import { createClient } from "@/lib/supabase/server";
import { LeadsClient } from "./leads-client";

export default async function LeadsPage() {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("clinic_id")
    .single();

  const { data: conversion } = await supabase
    .from("v_conversation_conversion")
    .select("*")
    .eq("clinic_id", profile?.clinic_id || "")
    .single();

  const { data: leadsNaoAgendaram } = await supabase
    .from("v_leads_nao_agendaram")
    .select("*")
    .eq("clinic_id", profile?.clinic_id || "")
    .order("started_at", { ascending: false })
    .limit(100);

  const { data: especialidadeProcurada } = await supabase
    .from("v_especialidade_mais_procurada")
    .select("*")
    .eq("clinic_id", profile?.clinic_id || "")
    .limit(10);

  return (
    <LeadsClient
      conversion={conversion as ConversionRow | null}
      leadsNaoAgendaram={(leadsNaoAgendaram || []) as unknown as LeadRow[]}
      especialidades={(especialidadeProcurada || []) as unknown as EspecialidadeRow[]}
    />
  );
}

type ConversionRow = {
  total_conversas: number;
  total_agendaram: number;
  total_nao_agendaram: number;
  fora_horario_comercial: number;
  agendaram_automatico: number;
  taxa_conversao_pct: number;
};

type LeadRow = {
  id: string;
  phone: string;
  patient_name: string | null;
  specialty_name: string | null;
  status: string;
  drop_reason: string | null;
  started_at: string;
};

type EspecialidadeRow = {
  specialty_name: string;
  total_conversas: number;
  agendaram: number;
};
