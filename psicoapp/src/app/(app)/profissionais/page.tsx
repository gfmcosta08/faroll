import { createClient } from "@/lib/supabase/server";
import { ProfissionaisClient } from "./profissionais-client";

export default async function ProfissionaisPage() {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("clinic_id")
    .single();
  const { data: professionals } = await supabase
    .from("professionals")
    .select("id, name, email, phone, default_consultation_duration_minutes, active, specialty:specialties(name)")
    .eq("clinic_id", profile?.clinic_id || "")
    .order("name");
  const { data: schedules } = await supabase
    .from("professional_schedules")
    .select("*");
  const { data: specialties } = await supabase
    .from("specialties")
    .select("id, name");

  return (
    <ProfissionaisClient
      professionals={(professionals || []) as ProfessionalRow[]}
      schedules={(schedules || []) as ScheduleRow[]}
      specialties={(specialties || []) as { id: string; name: string }[]}
    />
  );
}

type ProfessionalRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  default_consultation_duration_minutes: number;
  active: boolean;
  specialty: unknown;
};

type ScheduleRow = {
  id: string;
  professional_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
};
