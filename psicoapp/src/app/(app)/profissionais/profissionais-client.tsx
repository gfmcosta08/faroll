"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const DIAS = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda" },
  { value: 2, label: "Terça" },
  { value: 3, label: "Quarta" },
  { value: 4, label: "Quinta" },
  { value: 5, label: "Sexta" },
  { value: 6, label: "Sábado" },
];

type ProfessionalRow = {
  id: string;
  name: string;
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

function getSpecialtyName(s: unknown): string {
  if (!s) return "";
  const o = Array.isArray(s) ? s[0] : s;
  return (o as { name?: string })?.name || "";
}

export function ProfissionaisClient({
  professionals,
  schedules,
  specialties,
}: {
  professionals: ProfessionalRow[];
  schedules: ScheduleRow[];
  specialties: { id: string; name: string }[];
}) {
  const [selectedPro, setSelectedPro] = useState<string | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const supabase = createClient();

  const proSchedules = schedules.filter((s) => s.professional_id === selectedPro);
  const selectedProData = professionals.find((p) => p.id === selectedPro);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">
        Profissionais e horários
      </h1>

      <div className="flex gap-6">
        <div className="w-64 shrink-0">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 font-medium text-slate-700">
              Profissionais
            </div>
            <ul>
              {professionals.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => setSelectedPro(p.id)}
                    className={`w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 ${
                      selectedPro === p.id ? "bg-indigo-50 border-l-4 border-l-indigo-600" : ""
                    }`}
                  >
                    <div className="font-medium text-slate-900">{p.name}</div>
                    <div className="text-xs text-slate-500">
                      {getSpecialtyName(p.specialty)} · {p.default_consultation_duration_minutes} min
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex-1">
          {selectedPro ? (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                <h2 className="font-semibold">
                  Horários de atendimento — {selectedProData?.name}
                </h2>
                <button
                  onClick={() => setShowScheduleModal(true)}
                  className="text-sm px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  + Adicionar horário
                </button>
              </div>
              <div className="p-4">
                {proSchedules.length === 0 ? (
                  <p className="text-slate-500 text-sm">
                    Nenhum horário configurado. Adicione os dias e horários em que este profissional atende.
                  </p>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-slate-600">
                        <th className="pb-2">Dia</th>
                        <th className="pb-2">Início</th>
                        <th className="pb-2">Fim</th>
                        <th className="pb-2 w-20" />
                      </tr>
                    </thead>
                    <tbody>
                      {proSchedules
                        .sort((a, b) => a.day_of_week - b.day_of_week)
                        .map((s) => (
                          <tr key={s.id} className="border-t border-slate-100">
                            <td className="py-2">
                              {DIAS.find((d) => d.value === s.day_of_week)?.label || s.day_of_week}
                            </td>
                            <td className="py-2">{s.start_time.slice(0, 5)}</td>
                            <td className="py-2">{s.end_time.slice(0, 5)}</td>
                            <td className="py-2">
                              <button
                                onClick={async () => {
                                  await supabase
                                    .from("professional_schedules")
                                    .delete()
                                    .eq("id", s.id);
                                  window.location.reload();
                                }}
                                className="text-red-600 text-sm hover:underline"
                              >
                                Remover
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
              Selecione um profissional para configurar os horários.
            </div>
          )}
        </div>
      </div>

      {showScheduleModal && selectedPro && (
        <ScheduleModal
          professionalId={selectedPro}
          existingDays={proSchedules.map((s) => s.day_of_week)}
          onClose={() => setShowScheduleModal(false)}
          onSaved={() => {
            setShowScheduleModal(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}

function ScheduleModal({
  professionalId,
  existingDays,
  onClose,
  onSaved,
}: {
  professionalId: string;
  existingDays: number[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("18:00");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  const availableDays = DIAS.filter((d) => !existingDays.includes(d.value));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: err } = await supabase.from("professional_schedules").insert({
      professional_id: professionalId,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
    });
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    onSaved();
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Adicionar horário</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Dia</label>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(Number(e.target.value))}
              required
              className="w-full px-4 py-2 rounded-lg border border-slate-300"
            >
              {availableDays.length === 0 ? (
                <option value="">Todos os dias já configurados</option>
              ) : (
                availableDays.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))
              )}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Início</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fim</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-300"
              />
            </div>
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-slate-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || availableDays.length === 0}
              className="flex-1 py-2 rounded-lg bg-indigo-600 text-white font-medium disabled:opacity-50"
            >
              Adicionar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
