import { createClient } from "@/lib/supabase/server";
import { PacientesClient } from "./pacientes-client";

export default async function PacientesPage() {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("clinic_id")
    .single();
  const { data: patients } = await supabase
    .from("patients")
    .select("*")
    .order("name");

  return (
    <PacientesClient
      clinicId={profile?.clinic_id || ""}
      initialPatients={patients || []}
    />
  );
}
