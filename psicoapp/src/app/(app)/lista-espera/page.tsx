import { createClient } from "@/lib/supabase/server";
import { ListaEsperaClient } from "./lista-espera-client";

export default async function ListaEsperaPage() {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("clinic_id")
    .single();
  const { data: waitlist } = await supabase
    .from("waitlist")
    .select(
      `
      id, patient_phone, preferred_date_start, preferred_date_end, status, created_at,
      patient:patients(name, phone),
      specialty:specialties(name),
      professional:professionals(name)
    `
    )
    .eq("clinic_id", profile?.clinic_id || "")
    .order("created_at", { ascending: false });
  const { data: patients } = await supabase
    .from("patients")
    .select("id, name, phone")
    .eq("clinic_id", profile?.clinic_id || "")
    .eq("status", "ativo");
  const { data: professionals } = await supabase
    .from("professionals")
    .select("id, name")
    .eq("clinic_id", profile?.clinic_id || "")
    .eq("active", true);
  const { data: specialties } = await supabase
    .from("specialties")
    .select("id, name");

  return (
    <ListaEsperaClient
      clinicId={profile?.clinic_id || ""}
      waitlist={(waitlist || []) as unknown as WaitlistRow[]}
      patients={patients || []}
      professionals={professionals || []}
      specialties={specialties || []}
    />
  );
}

type WaitlistRow = {
  id: string;
  patient_phone: string | null;
  preferred_date_start: string | null;
  preferred_date_end: string | null;
  status: string;
  created_at: string;
  patient: unknown;
  specialty: unknown;
  professional: unknown;
};
