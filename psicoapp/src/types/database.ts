export type UserRole = "dono_clinica" | "profissional" | "secretaria" | "paciente";

export interface Profile {
  id: string;
  user_id: string;
  role: UserRole;
  clinic_id: string | null;
  professional_id: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
}
