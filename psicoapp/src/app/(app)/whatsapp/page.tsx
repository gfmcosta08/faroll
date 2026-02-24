import { createClient } from "@/lib/supabase/server";
import { ChatSimulator } from "./chat-simulator";

export default async function WhatsAppPage() {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("clinic_id")
    .single();
  const { data: conversations } = await supabase
    .from("conversations")
    .select(
      `
      id, phone, status, started_at, drop_reason,
      specialty:specialties(name)
    `
    )
    .eq("clinic_id", profile?.clinic_id || "")
    .order("last_message_at", { ascending: false })
    .limit(50);

  return (
    <ChatSimulator
      clinicId={profile?.clinic_id || ""}
      initialConversations={(conversations || []) as unknown as ConversationRow[]}
    />
  );
}

export type ConversationRow = {
  id: string;
  phone: string;
  status: string;
  started_at: string;
  drop_reason: string | null;
  specialty: unknown;
};
