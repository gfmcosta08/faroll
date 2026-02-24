"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Patient = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  birth_date: string | null;
  cpf: string | null;
  address: string | null;
  health_insurance: string | null;
  status: string;
};

export function PacientesClient({
  clinicId,
  initialPatients,
}: {
  clinicId: string;
  initialPatients: Patient[];
}) {
  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [search, setSearch] = useState("");
  const supabase = createClient();

  useEffect(() => {
    const sub = supabase
      .channel("patients")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "patients" },
        () => {
          supabase.from("patients").select("*").order("name").then(({ data }) => {
            if (data) setPatients(data);
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(sub);
    };
  }, [supabase]);

  const filtered = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.phone || "").includes(search) ||
      (p.email || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Pacientes</h1>

      <div className="flex flex-wrap gap-4 items-center mb-6">
        <input
          type="text"
          placeholder="Buscar por nome, telefone ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2 rounded-lg border border-slate-300"
        />
        <button
          onClick={() => {
            setEditing(null);
            setShowModal(true);
          }}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700"
        >
          Novo paciente
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            Nenhum paciente cadastrado.
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                  Nome
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                  Telefone
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                  Email
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                  Status
                </th>
                <th className="w-24 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {p.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.phone || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{p.email || "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-sm px-2 py-1 rounded ${
                        p.status === "ativo"
                          ? "bg-green-100 text-green-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        setEditing(p);
                        setShowModal(true);
                      }}
                      className="text-indigo-600 hover:underline text-sm"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <PatientModal
          clinicId={clinicId}
          patient={editing}
          onClose={() => {
            setShowModal(false);
            setEditing(null);
          }}
          onSaved={() => {
            setShowModal(false);
            setEditing(null);
            supabase.from("patients").select("*").order("name").then(({ data }) => {
              if (data) setPatients(data);
            });
          }}
        />
      )}
    </div>
  );
}

function PatientModal({
  clinicId,
  patient,
  onClose,
  onSaved,
}: {
  clinicId: string;
  patient: Patient | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(patient?.name || "");
  const [phone, setPhone] = useState(patient?.phone || "");
  const [email, setEmail] = useState(patient?.email || "");
  const [birthDate, setBirthDate] = useState(patient?.birth_date || "");
  const [cpf, setCpf] = useState(patient?.cpf || "");
  const [address, setAddress] = useState(patient?.address || "");
  const [healthInsurance, setHealthInsurance] = useState(
    patient?.health_insurance || ""
  );
  const [status, setStatus] = useState(patient?.status || "ativo");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!clinicId) {
      setError("Clínica não encontrada.");
      setLoading(false);
      return;
    }

    const payload = {
      clinic_id: clinicId,
      name: name.trim(),
      phone: phone.trim() || null,
      email: email.trim() || null,
      birth_date: birthDate || null,
      cpf: cpf.trim() || null,
      address: address.trim() || null,
      health_insurance: healthInsurance.trim() || null,
      status: status,
    };

    if (patient) {
      const { error: err } = await supabase
        .from("patients")
        .update(payload)
        .eq("id", patient.id);
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
    } else {
      const { error: err } = await supabase.from("patients").insert(payload);
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
    }
    onSaved();
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            {patient ? "Editar paciente" : "Novo paciente"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nome *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg border border-slate-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Telefone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Data de nascimento
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                CPF
              </label>
              <input
                type="text"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-300"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Endereço
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Convênio
            </label>
            <input
              type="text"
              value={healthInsurance}
              onChange={(e) => setHealthInsurance(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300"
            >
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
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
              {loading ? "Salvando..." : patient ? "Atualizar" : "Cadastrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
