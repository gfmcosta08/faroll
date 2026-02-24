import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function SetupLayout({
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

  if (profile?.clinic_id) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
