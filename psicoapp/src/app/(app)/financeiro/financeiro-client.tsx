"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type PaymentRow = {
  id: string;
  amount: number;
  paid: boolean;
  payment_method: string | null;
  paid_at: string | null;
  created_at: string;
  appointment: unknown;
};

type ReceitaRow = { clinic_id: string; mes: string; receita: number; total_pagamentos: number };

function getName(o: unknown): string {
  if (!o) return "—";
  const x = Array.isArray(o) ? o[0] : o;
  return (x as { name?: string })?.name || "—";
}

export function FinanceiroClient({
  clinicId,
  payments,
  receitaMensal,
  prices,
  appointments,
  professionals,
  specialties,
}: {
  clinicId: string;
  payments: PaymentRow[];
  receitaMensal: ReceitaRow[];
  prices: { id: string; price: number; professional_id: string | null; specialty_id: string | null; professional: unknown; specialty: unknown }[];
  appointments: { id: string; scheduled_at: string; professional: unknown; patient: unknown }[];
  professionals: { id: string; name: string }[];
  specialties: { id: string; name: string }[];
}) {
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const supabase = createClient();
  const totalReceita = receitaMensal.reduce((s, r) => s + Number(r.receita), 0);
  const receitaMesAtual =
    receitaMensal.length > 0 ? Number(receitaMensal[0].receita) : 0;

  const formatBRL = (n: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(n);

  const formatDate = (s: string | null) =>
    s ? new Date(s).toLocaleDateString("pt-BR") : "—";

  const getPatientName = (apt: unknown): string => {
    if (!apt) return "—";
    const o = Array.isArray(apt) ? apt[0] : apt;
    const p = (o as { patient?: { name: string } })?.patient;
    return (Array.isArray(p) ? p[0] : p)?.name || "—";
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Financeiro</h1>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setShowPriceModal(true)}
          className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50"
        >
          + Valor por consulta
        </button>
        <button
          onClick={() => setShowPaymentModal(true)}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700"
        >
          + Registrar pagamento
        </button>
      </div>

      {prices.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-8">
          <h2 className="px-4 py-3 font-semibold text-slate-900 border-b border-slate-200">
            Valores por consulta
          </h2>
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Profissional</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Especialidade</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Valor</th>
              </tr>
            </thead>
            <tbody>
              {prices.map((p) => (
                <tr key={p.id} className="border-b border-slate-100">
                  <td className="px-4 py-3">{getName(p.professional)}</td>
                  <td className="px-4 py-3">{getName(p.specialty)}</td>
                  <td className="px-4 py-3 font-medium">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(p.price))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500">Receita do mês</p>
          <p className="text-2xl font-bold text-green-600">
            {formatBRL(receitaMesAtual)}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500">Total (últimos 12 meses)</p>
          <p className="text-2xl font-bold text-indigo-600">
            {formatBRL(totalReceita)}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500">Pagamentos pendentes</p>
          <p className="text-2xl font-bold text-amber-600">
            {payments.filter((p) => !p.paid).length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <h2 className="px-4 py-3 font-semibold text-slate-900 border-b border-slate-200">
          Últimos pagamentos
        </h2>
        {payments.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            Nenhum pagamento cadastrado.
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                  Data
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                  Paciente
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                  Valor
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-4 py-3 text-slate-600">
                    {formatDate(p.paid_at || p.created_at)}
                  </td>
                  <td className="px-4 py-3">{getPatientName(p.appointment)}</td>
                  <td className="px-4 py-3 font-medium">
                    {formatBRL(Number(p.amount))}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-sm px-2 py-1 rounded ${
                        p.paid ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {p.paid ? "Pago" : "Pendente"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showPriceModal && (
        <PriceModal
          clinicId={clinicId}
          professionals={professionals}
          specialties={specialties}
          onClose={() => setShowPriceModal(false)}
          onSaved={() => { setShowPriceModal(false); window.location.reload(); }}
        />
      )}
      {showPaymentModal && (
        <PaymentModal
          clinicId={clinicId}
          appointments={appointments}
          professionals={professionals}
          onClose={() => setShowPaymentModal(false)}
          onSaved={() => { setShowPaymentModal(false); window.location.reload(); }}
        />
      )}
    </div>
  );
}

function PriceModal({
  clinicId,
  professionals,
  specialties,
  onClose,
  onSaved,
}: {
  clinicId: string;
  professionals: { id: string; name: string }[];
  specialties: { id: string; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [professionalId, setProfessionalId] = useState(professionals[0]?.id || "");
  const [specialtyId, setSpecialtyId] = useState(specialties[0]?.id || "");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await supabase.from("consultation_prices").insert({
      clinic_id: clinicId,
      professional_id: professionalId || null,
      specialty_id: specialtyId || null,
      price: parseFloat(price.replace(",", ".")),
    });
    onSaved();
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Valor por consulta</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Profissional</label>
            <select value={professionalId} onChange={(e) => setProfessionalId(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-slate-300">
              {professionals.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Especialidade</label>
            <select value={specialtyId} onChange={(e) => setSpecialtyId(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-slate-300">
              {specialties.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Valor (R$)</label>
            <input type="text" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0,00" required className="w-full px-4 py-2 rounded-lg border border-slate-300" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-slate-300">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 rounded-lg bg-indigo-600 text-white font-medium disabled:opacity-50">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PaymentModal({
  clinicId,
  appointments,
  professionals,
  onClose,
  onSaved,
}: {
  clinicId: string;
  appointments: { id: string; scheduled_at: string; professional: unknown; patient: unknown }[];
  professionals: { id: string; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [appointmentId, setAppointmentId] = useState("");
  const [professionalId, setProfessionalId] = useState(professionals[0]?.id || "");
  const [amount, setAmount] = useState("");
  const [paid, setPaid] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const apt = appointments.find((a) => a.id === appointmentId);
  const patientId = apt?.patient ? (Array.isArray(apt.patient) ? (apt.patient as { id?: string }[])[0]?.id : (apt.patient as { id?: string })?.id) : undefined;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await supabase.from("payments").insert({
      clinic_id: clinicId,
      appointment_id: appointmentId || null,
      professional_id: professionalId || null,
      patient_id: patientId || null,
      amount: parseFloat(amount.replace(",", ".")),
      paid,
      payment_method: paymentMethod,
      paid_at: paid ? new Date().toISOString() : null,
    });
    onSaved();
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Registrar pagamento</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Consulta (opcional)</label>
            <select value={appointmentId} onChange={(e) => setAppointmentId(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-slate-300">
              <option value="">Manual</option>
              {appointments.map((a) => (
                <option key={a.id} value={a.id}>
                  {new Date(a.scheduled_at).toLocaleString("pt-BR")} — {getName(a.patient)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Profissional</label>
            <select value={professionalId} onChange={(e) => setProfessionalId(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-slate-300">
              {professionals.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Valor (R$) *</label>
            <input type="text" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" required className="w-full px-4 py-2 rounded-lg border border-slate-300" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Forma de pagamento</label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-slate-300">
              <option value="pix">PIX</option>
              <option value="dinheiro">Dinheiro</option>
              <option value="cartao_credito">Cartão crédito</option>
              <option value="cartao_debito">Cartão débito</option>
              <option value="convenio">Convênio</option>
              <option value="transferencia">Transferência</option>
              <option value="outro">Outro</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="paid" checked={paid} onChange={(e) => setPaid(e.target.checked)} />
            <label htmlFor="paid" className="text-sm">Já foi pago</label>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-slate-300">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 rounded-lg bg-indigo-600 text-white font-medium disabled:opacity-50">Registrar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
