import { createClient } from "@/lib/supabase/server";
import { AgendaClient } from "./agenda-client";

export default async function AgendaPage() {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("clinic_id")
    .single();
  const { data: professionals } = await supabase
    .from("professionals")
    .select("id, name, default_consultation_duration_minutes")
    .eq("active", true);
  const { data: patients } = await supabase
    .from("patients")
    .select("id, name, phone")
    .eq("status", "ativo")
    .order("name");
  const { data: specialties } = await supabase
    .from("specialties")
    .select("id, name");

  return (
    <AgendaClient
      clinicId={profile?.clinic_id || ""}
      professionals={professionals || []}
      patients={patients || []}
      specialties={specialties || []}
    />
  );
}
