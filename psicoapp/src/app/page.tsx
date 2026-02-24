import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-100">
      <main className="text-center max-w-2xl px-6">
        <h1 className="text-4xl font-bold text-indigo-900 mb-4">
          Psicoapp
        </h1>
        <p className="text-lg text-slate-600 mb-8">
          Gestão inteligente para clínicas multiespecialidade.
          Agenda, pacientes e WhatsApp em um só lugar.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition"
          >
            Entrar
          </Link>
          <Link
            href="/auth/registro"
            className="px-6 py-3 rounded-lg border border-indigo-600 text-indigo-600 font-medium hover:bg-indigo-50 transition"
          >
            Criar conta
          </Link>
        </div>
      </main>
    </div>
  );
}
