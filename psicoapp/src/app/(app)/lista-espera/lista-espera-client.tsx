"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

function getName(o: unknown): string {
  if (!o) return "—";
  const x = Array.isArray(o) ? o[0] : o;
  return (x as { name?: string })?.name || "—";
}

export function ListaEsperaClient({
  clinicId,
  waitlist,
  patients,
  professionals,
  specialties,
}: {
  clinicId: string;
  waitlist: {
    id: string;
    patient_phone: string | null;
    preferred_date_start: string | null;
    preferred_date_end: string | null;
    status: string;
    created_at: string;
    patient: unknown;
    specialty: unknown;
    professional: unknown;
  }[];
  patients: { id: string; name: string; phone: string | null }[];
  professionals: { id: string; name: string }[];
  specialties: { id: string; name: string }[];
}) {
  const [showModal, setShowModal] = useState(false);
  const supabase = createClient();

  const statusLabels: Record<string, string> = {
    aguardando: "Aguardando",
    notificado: "Notificado",
    agendou: "Agendou",
    desistiu: "Desistiu",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Lista de espera</h1>

      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700"
        >
          + Adicionar à lista
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {waitlist.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            Nenhuma pessoa na lista de espera.
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                  Paciente
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                  Especialidade
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                  Período preferido
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {waitlist.map((w) => (
                <tr key={w.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    {getName(w.patient) !== "—" ? getName(w.patient) : w.patient_phone || "—"}
                  </td>
                  <td className="px-4 py-3">{getName(w.specialty)}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {w.preferred_date_start && w.preferred_date_end
                      ? `${new Date(w.preferred_date_start).toLocaleDateString("pt-BR")} a ${new Date(w.preferred_date_end).toLocaleDateString("pt-BR")}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-sm px-2 py-1 rounded ${
                        w.status === "aguardando"
                          ? "bg-amber-100 text-amber-800"
                          : w.status === "agendou"
                            ? "bg-green-100 text-green-800"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {statusLabels[w.status] || w.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <AddWaitlistModal
          clinicId={clinicId}
          patients={patients}
          professionals={professionals}
          specialties={specialties}
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

function AddWaitlistModal({
  clinicId,
  patients,
  professionals,
  specialties,
  onClose,
  onSaved,
}: {
  clinicId: string;
  patients: { id: string; name: string; phone: string | null }[];
  professionals: { id: string; name: string }[];
  specialties: { id: string; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [patientId, setPatientId] = useState("");
  const [specialtyId, setSpecialtyId] = useState(specialties[0]?.id || "");
  const [professionalId, setProfessionalId] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const patient = patients.find((p) => p.id === patientId);
    await supabase.from("waitlist").insert({
      clinic_id: clinicId,
      patient_id: patientId,
      patient_phone: patient?.phone || null,
      specialty_id: specialtyId,
      professional_id: professionalId || null,
      preferred_date_start: dateStart || null,
      preferred_date_end: dateEnd || null,
      status: "aguardando",
    });
    onSaved();
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Adicionar à lista de espera</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Paciente *</label>
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Especialidade *</label>
            <select
              value={specialtyId}
              onChange={(e) => setSpecialtyId(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg border border-slate-300"
            >
              {specialties.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Profissional (opcional)</label>
            <select
              value={professionalId}
              onChange={(e) => setProfessionalId(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300"
            >
              <option value="">Qualquer</option>
              {professionals.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Período início</label>
              <input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-slate-300" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Período fim</label>
              <input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-slate-300" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-slate-300">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 rounded-lg bg-indigo-600 text-white font-medium disabled:opacity-50">Adicionar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
