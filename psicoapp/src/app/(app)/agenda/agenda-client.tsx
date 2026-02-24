"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Professional = { id: string; name: string; default_consultation_duration_minutes: number };
type Patient = { id: string; name: string; phone: string | null };
type Specialty = { id: string; name: string };

type Appointment = {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  patient: unknown;
  specialty: unknown;
  patient_id?: string;
  specialty_id?: string;
};

function getPatientName(p: unknown): string {
  if (!p) return "—";
  const o = Array.isArray(p) ? p[0] : p;
  return (o as { name?: string })?.name || "—";
}
function getSpecialtyName(s: unknown): string {
  if (!s) return "";
  const o = Array.isArray(s) ? s[0] : s;
  return (o as { name?: string })?.name || "";
}

export function AgendaClient({
  clinicId,
  professionals,
  patients,
  specialties,
}: {
  clinicId: string;
  professionals: Professional[];
  patients: Patient[];
  specialties: Specialty[];
}) {
  const [selectedPro, setSelectedPro] = useState<string>(
    professionals[0]?.id || ""
  );
  const [date, setDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showReagendarModal, setShowReagendarModal] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!selectedPro) return;
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("appointments")
        .select(
          `
          id, scheduled_at, duration_minutes, status,
          patient:patients(name),
          specialty:specialties(name)
        `
        )
        .eq("professional_id", selectedPro)
        .gte("scheduled_at", start.toISOString())
        .lte("scheduled_at", end.toISOString())
        .neq("status", "cancelado")
        .order("scheduled_at");
      setAppointments((data as unknown as Appointment[]) || []);
      setLoading(false);
    })();
  }, [selectedPro, date, supabase]);

  const prevDay = () => {
    const d = new Date(date);
    d.setDate(d.getDate() - 1);
    setDate(d.toISOString().slice(0, 10));
  };
  const nextDay = () => {
    const d = new Date(date);
    d.setDate(d.getDate() + 1);
    setDate(d.toISOString().slice(0, 10));
  };
  const today = () => setDate(new Date().toISOString().slice(0, 10));

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Agenda</h1>

      <div className="flex flex-wrap gap-4 items-center mb-6">
        <select
          value={selectedPro}
          onChange={(e) => setSelectedPro(e.target.value)}
          className="px-4 py-2 rounded-lg border border-slate-300"
        >
          {professionals.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <button
            onClick={prevDay}
            className="px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-100"
          >
            ←
          </button>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-4 py-2 rounded-lg border border-slate-300"
          />
          <button
            onClick={nextDay}
            className="px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-100"
          >
            →
          </button>
          <button
            onClick={today}
            className="px-3 py-2 rounded-lg bg-slate-200 hover:bg-slate-300"
          >
            Hoje
          </button>
        </div>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setShowBlockModal(true)}
            className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100"
          >
            Bloquear horário
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700"
          >
            Novo agendamento
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Carregando...</div>
        ) : appointments.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            Nenhuma consulta neste dia.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {appointments.map((apt) => (
              <li
                key={apt.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 gap-4"
              >
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-slate-900">
                    {formatTime(apt.scheduled_at)}
                  </span>
                  <span className="mx-2 text-slate-400">–</span>
                  <span>{getPatientName(apt.patient)}</span>
                  <span className="ml-2 text-sm text-slate-500">
                    {getSpecialtyName(apt.specialty)} · {apt.duration_minutes} min
                  </span>
                </div>
                <span
                  className={`text-sm px-2 py-1 rounded shrink-0 ${
                    apt.status === "confirmado"
                      ? "bg-green-100 text-green-800"
                      : apt.status === "realizado"
                        ? "bg-slate-100 text-slate-700"
                        : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {apt.status}
                </span>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => setShowReagendarModal(apt)}
                    className="text-xs px-2 py-1 rounded border border-slate-300 hover:bg-slate-100"
                  >
                    Reagendar
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm("Cancelar esta consulta?")) {
                        await supabase
                          .from("appointments")
                          .update({ status: "cancelado" })
                          .eq("id", apt.id);
                        window.location.reload();
                      }
                    }}
                    className="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50"
                  >
                    Cancelar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showBlockModal && (
        <BlockSlotModal
          professionalId={selectedPro}
          date={date}
          onClose={() => setShowBlockModal(false)}
          onSaved={() => {
            setShowBlockModal(false);
            window.location.reload();
          }}
        />
      )}
      {showReagendarModal && (
        <ReagendarModal
          appointment={showReagendarModal}
          professionals={professionals}
          patients={patients}
          specialties={specialties}
          onClose={() => setShowReagendarModal(null)}
          onSaved={() => {
            setShowReagendarModal(null);
            window.location.reload();
          }}
        />
      )}
      {showModal && (
        <AgendaModal
          clinicId={clinicId}
          professionals={professionals}
          patients={patients}
          specialties={specialties}
          defaultPro={selectedPro}
          defaultDate={date}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}

function BlockSlotModal({
  professionalId,
  date,
  onClose,
  onSaved,
}: {
  professionalId: string;
  date: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("12:00");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const startAt = new Date(`${date}T${startTime}:00`);
    const endAt = new Date(`${date}T${endTime}:00`);
    await supabase.from("blocked_slots").insert({
      professional_id: professionalId,
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
      reason: reason || null,
    });
    onSaved();
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Bloquear horário</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-slate-600">Data: {new Date(date).toLocaleDateString("pt-BR")}</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Início</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-slate-300" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fim</label>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-slate-300" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Motivo (opcional)</label>
            <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex: Almoço" className="w-full px-4 py-2 rounded-lg border border-slate-300" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-slate-300">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 rounded-lg bg-indigo-600 text-white font-medium disabled:opacity-50">Bloquear</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ReagendarModal({
  appointment,
  professionals,
  patients,
  specialties,
  onClose,
  onSaved,
}: {
  appointment: Appointment;
  professionals: Professional[];
  patients: Patient[];
  specialties: Specialty[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [scheduledDate, setScheduledDate] = useState(() => appointment.scheduled_at.slice(0, 10));
  const [scheduledTime, setScheduledTime] = useState(() => appointment.scheduled_at.slice(11, 16));
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}:00`);
    await supabase
      .from("appointments")
      .update({
        scheduled_at: scheduledAt.toISOString(),
        status: "reagendado",
      })
      .eq("id", appointment.id);
    onSaved();
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Reagendar consulta</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-slate-600">{getPatientName(appointment.patient)}</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nova data</label>
              <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} required className="w-full px-4 py-2 rounded-lg border border-slate-300" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nova hora</label>
              <input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} required className="w-full px-4 py-2 rounded-lg border border-slate-300" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-slate-300">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 rounded-lg bg-indigo-600 text-white font-medium disabled:opacity-50">Reagendar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AgendaModal({
  clinicId,
  professionals,
  patients,
  specialties,
  defaultPro,
  defaultDate,
  onClose,
  onSaved,
}: {
  clinicId: string;
  professionals: Professional[];
  patients: Patient[];
  specialties: Specialty[];
  defaultPro: string;
  defaultDate: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [patientId, setPatientId] = useState("");
  const [professionalId, setProfessionalId] = useState(defaultPro);
  const [scheduledDate, setScheduledDate] = useState(defaultDate);
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [duration, setDuration] = useState(50);
  const [specialtyId, setSpecialtyId] = useState(specialties[0]?.id || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  const pro = professionals.find((p) => p.id === professionalId);
  useEffect(() => {
    if (pro) setDuration(pro.default_consultation_duration_minutes);
  }, [professionalId, pro]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}:00`);
    if (!clinicId) {
      setError("Clínica não encontrada.");
      setLoading(false);
      return;
    }

    const { error: err } = await supabase.from("appointments").insert({
      clinic_id: clinicId,
      professional_id: professionalId,
      patient_id: patientId,
      specialty_id: specialtyId,
      scheduled_at: scheduledAt.toISOString(),
      duration_minutes: duration,
      status: "agendado",
      source: "manual",
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
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Novo agendamento</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Profissional
            </label>
            <select
              value={professionalId}
              onChange={(e) => setProfessionalId(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg border border-slate-300"
            >
              {professionals.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Paciente
            </label>
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg border border-slate-300"
            >
              <option value="">Selecione...</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.phone ? `(${p.phone})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Data e hora
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                required
                className="flex-1 px-4 py-2 rounded-lg border border-slate-300"
              />
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                required
                className="w-28 px-4 py-2 rounded-lg border border-slate-300"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Duração (min)
            </label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              min={15}
              step={5}
              className="w-full px-4 py-2 rounded-lg border border-slate-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Especialidade
            </label>
            <select
              value={specialtyId}
              onChange={(e) => setSpecialtyId(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg border border-slate-300"
            >
              {specialties.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
          )}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-slate-300 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Agendar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
