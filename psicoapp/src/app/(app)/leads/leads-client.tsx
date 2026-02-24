"use client";

const DROP_LABELS: Record<string, string> = {
  valor: "Valor",
  horario_indisponivel: "Horário indisponível",
  convenio_nao_aceito: "Convênio não aceito",
  parou_responder: "Parou de responder",
  pediu_info_sumiu: "Pediu informação e sumiu",
  outro: "Outro",
  nao_informado: "Não informado",
};

export function LeadsClient({
  conversion,
  leadsNaoAgendaram,
  especialidades,
}: {
  conversion: {
    total_conversas: number;
    total_agendaram: number;
    total_nao_agendaram: number;
    fora_horario_comercial: number;
    agendaram_automatico: number;
    taxa_conversao_pct: number;
  } | null;
  leadsNaoAgendaram: {
    id: string;
    phone: string;
    patient_name: string | null;
    specialty_name: string | null;
    status: string;
    drop_reason: string | null;
    started_at: string;
  }[];
  especialidades: { specialty_name: string; total_conversas: number; agendaram: number }[];
}) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">
        Métricas de Leads
      </h1>

      {conversion && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <p className="text-sm text-slate-500">Total de conversas</p>
            <p className="text-2xl font-bold text-slate-900">
              {conversion.total_conversas}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <p className="text-sm text-slate-500">Agendaram</p>
            <p className="text-2xl font-bold text-green-600">
              {conversion.total_agendaram}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <p className="text-sm text-slate-500">Não agendaram</p>
            <p className="text-2xl font-bold text-amber-600">
              {conversion.total_nao_agendaram}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <p className="text-sm text-slate-500">Taxa de conversão</p>
            <p className="text-2xl font-bold text-indigo-600">
              {conversion.taxa_conversao_pct ?? 0}%
            </p>
          </div>
        </div>
      )}

      {conversion && (conversion.fora_horario_comercial > 0 || conversion.agendaram_automatico > 0) && (
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <p className="text-sm text-slate-500">Contato fora do horário comercial</p>
            <p className="text-xl font-semibold">{conversion.fora_horario_comercial}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <p className="text-sm text-slate-500">Agendaram automaticamente</p>
            <p className="text-xl font-semibold">{conversion.agendaram_automatico}</p>
          </div>
        </div>
      )}

      {especialidades.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-8">
          <h2 className="px-4 py-3 font-semibold text-slate-900 border-b border-slate-200">
            Especialidade mais procurada
          </h2>
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Especialidade</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Conversas</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Agendaram</th>
              </tr>
            </thead>
            <tbody>
              {especialidades.map((e, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="px-4 py-3">{e.specialty_name}</td>
                  <td className="px-4 py-3">{e.total_conversas}</td>
                  <td className="px-4 py-3">{e.agendaram}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <h2 className="px-4 py-3 font-semibold text-slate-900 border-b border-slate-200">
          Leads que não agendaram (nome e telefone)
        </h2>
        {leadsNaoAgendaram.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            Nenhum lead com status "não agendou" ou "abandonou".
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Nome</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Telefone</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Especialidade</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Motivo provável</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Data contato</th>
              </tr>
            </thead>
            <tbody>
              {leadsNaoAgendaram.map((l) => (
                <tr key={l.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">{l.patient_name || "—"}</td>
                  <td className="px-4 py-3 font-mono">{l.phone}</td>
                  <td className="px-4 py-3">{l.specialty_name || "—"}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {DROP_LABELS[l.drop_reason || "nao_informado"] || l.drop_reason}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {new Date(l.started_at).toLocaleString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
