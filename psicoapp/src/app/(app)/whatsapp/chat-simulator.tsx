"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

type ConversationRow = {
  id: string;
  phone: string;
  status: string;
  started_at: string;
  drop_reason: string | null;
  specialty: unknown;
};

type Message = { id: string; direction: string; content: string; created_at: string };

export function ChatSimulator({
  clinicId,
  initialConversations,
}: {
  clinicId: string;
  initialConversations: ConversationRow[];
}) {
  const [conversations, setConversations] = useState<ConversationRow[]>(initialConversations);
  const [selected, setSelected] = useState<ConversationRow | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!selected) return;
    supabase
      .from("conversation_messages")
      .select("id, direction, content, created_at")
      .eq("conversation_id", selected.id)
      .order("created_at")
      .then(({ data }) => setMessages((data as Message[]) || []));
  }, [selected, supabase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView();
  }, [messages]);

  async function handleNewConversation() {
    const phone = prompt("Número (ex: 5511999999999):");
    if (!phone?.trim()) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("conversations")
      .insert({
        clinic_id: clinicId,
        phone: phone.trim(),
        status: "em_conversa",
      })
      .select()
      .single();
    if (!error && data) {
      setConversations([data as ConversationRow, ...conversations]);
      setSelected(data as ConversationRow);
    }
    setLoading(false);
  }

  async function handleSend() {
    if (!input.trim() || !selected) return;
    setLoading(true);
    await supabase.from("conversation_messages").insert({
      conversation_id: selected.id,
      direction: "out",
      content: input.trim(),
    });
    await supabase
      .from("conversations")
      .update({
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", selected.id);
    const { data } = await supabase
      .from("conversation_messages")
      .select("id, direction, content, created_at")
      .eq("conversation_id", selected.id)
      .order("created_at");
    setMessages((data as Message[]) || []);
    setInput("");
    setLoading(false);
  }

  async function simulateIncoming() {
    if (!selected) return;
    const msg = prompt("Mensagem simulada (entrada):");
    if (!msg?.trim()) return;
    setLoading(true);
    await supabase.from("conversation_messages").insert({
      conversation_id: selected.id,
      direction: "in",
      content: msg.trim(),
    });
    await supabase
      .from("conversations")
      .update({
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", selected.id);
    const { data } = await supabase
      .from("conversation_messages")
      .select("id, direction, content, created_at")
      .eq("conversation_id", selected.id)
      .order("created_at");
    setMessages((data as Message[]) || []);
    setLoading(false);
  }

  const statusLabels: Record<string, string> = {
    em_conversa: "Em conversa",
    agendou: "Agendou",
    nao_agendou: "Não agendou",
    abandonou: "Abandonou",
    aguardando_humano: "Aguardando humano",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-4">
        Chat simulado (WhatsApp)
      </h1>
      <p className="text-slate-600 mb-6">
        Simule conversas para testar o fluxo do bot antes de conectar o Uazapi.
      </p>

      <div className="flex gap-4 h-[600px] border border-slate-200 rounded-xl overflow-hidden bg-white">
        <div className="w-80 border-r border-slate-200 flex flex-col">
          <button
            onClick={handleNewConversation}
            disabled={loading}
            className="m-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700"
          >
            + Nova conversa
          </button>
          <div className="flex-1 overflow-y-auto">
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c)}
                className={`w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 ${
                  selected?.id === c.id ? "bg-indigo-50" : ""
                }`}
              >
                <div className="font-medium text-slate-900">{c.phone}</div>
                <div className="text-xs text-slate-500">
                  {statusLabels[c.status] || c.status}
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 flex flex-col">
          {selected ? (
            <>
              <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                <span className="font-medium">{selected.phone}</span>
                <button
                  onClick={simulateIncoming}
                  className="text-sm text-indigo-600 hover:underline"
                >
                  Simular mensagem recebida
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.direction === "out" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                        m.direction === "out"
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-200 text-slate-900"
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <div className="p-4 border-t border-slate-200 flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Digite a mensagem..."
                  className="flex-1 px-4 py-2 rounded-lg border border-slate-300"
                />
                <button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  Enviar
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500">
              Selecione uma conversa ou crie uma nova
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
