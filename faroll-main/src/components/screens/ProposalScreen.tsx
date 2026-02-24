import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useApp } from "@/contexts/AppContext";
import { Header } from "@/components/layout/Header";
import { Navigation } from "@/components/layout/Navigation";
import { FileText, Send, X, Paperclip, AlertTriangle, Check, Clock } from "lucide-react";
import { toast } from "sonner";

export function ProposalScreen() {
  const {
    user,
    selectedProfessional,
    navigate,
    goBack,
    canSendProposal,
    sendProposal,
    respondProposal,
    getProposalForProfessional,
  } = useApp();

  const [valorAcordado, setValorAcordado] = useState("");
  const [quantidadeGcoins, setQuantidadeGcoins] = useState("");
  const [descricaoAcordo, setDescricaoAcordo] = useState("");
  const [antecedenciaMinima, setAntecedenciaMinima] = useState("24");
  const [prazoCancelamento, setPrazoCancelamento] = useState("48");
  const [comprovante, setComprovante] = useState<string | null>(null);

  if (!selectedProfessional) return null;

  const existingProposal = getProposalForProfessional(selectedProfessional.id);
  const isCliente = user?.role === "cliente";
  const canEdit = canSendProposal();

  /* ======================================================
     🔒 REGRA ABSOLUTA:
     Cliente NUNCA cria proposta
     ====================================================== */
  if (isCliente && !existingProposal) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <Navigation />
        <main className="p-4 max-w-2xl mx-auto">
          <Alert className="border-blue-500/50 bg-blue-50 dark:bg-blue-950/20">
            <AlertDescription className="text-blue-700 dark:text-blue-400">
              Aguarde uma proposta do profissional para continuar.
            </AlertDescription>
          </Alert>
          <Button onClick={goBack} variant="outline" className="w-full mt-4">
            Voltar
          </Button>
        </main>
      </div>
    );
  }

  const handleSendProposal = () => {
    if (!valorAcordado || !quantidadeGcoins || !descricaoAcordo) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    sendProposal({
      profissionalId: selectedProfessional.id,
      clienteId: "cliente_responsavel_001",
      valorAcordado: Number(valorAcordado),
      quantidadeGcoins: Number(quantidadeGcoins),
      descricaoAcordo,
      antecedenciaMinima: Number(antecedenciaMinima),
      prazoCancelamento: Number(prazoCancelamento),
      comprovanteAnexo: comprovante || undefined,
    });

    toast.success("Proposta enviada com sucesso!");
    navigate("chat");
  };

  const handleAccept = () => {
    if (!existingProposal) return;
    respondProposal(existingProposal.id, true);
    toast.success("Proposta aceita! Vínculo criado e Gcoins liberados.");
    navigate("contatos");
  };

  const handleReject = () => {
    if (!existingProposal) return;
    respondProposal(existingProposal.id, false);
    toast.info("Proposta recusada.");
    navigate("galeria");
  };

  const handleAttachment = () => {
    setComprovante(`comprovante_pix_${Date.now()}.pdf`);
    toast.success("Comprovante anexado (simulado)");
  };

  /* ======================================================
     👤 VISÃO DO CLIENTE (visualizar / aceitar / recusar)
     ====================================================== */
  if (isCliente && existingProposal) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <Navigation />
        <main className="p-4 max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex gap-2 items-center">
                  <FileText className="h-5 w-5" />
                  Proposta de {selectedProfessional.nome}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  Status: <strong>{existingProposal.status}</strong>
                </div>

                <Separator />

                <p>
                  <strong>Valor:</strong> R$ {existingProposal.valorAcordado}
                </p>
                <p>
                  <strong>Gcoins:</strong> {existingProposal.quantidadeGcoins}
                </p>
                <p>{existingProposal.descricaoAcordo}</p>

                <Alert>
                  <AlertDescription>
                    Antecedência mínima: {existingProposal.antecedenciaMinima}h<br />
                    Cancelamento sem penalidade: {existingProposal.prazoCancelamento}h
                  </AlertDescription>
                </Alert>

                {existingProposal.status === "enviada" && (
                  <div className="flex gap-2">
                    <Button onClick={handleAccept} className="flex-1">
                      Aceitar
                    </Button>
                    <Button onClick={handleReject} variant="destructive" className="flex-1">
                      Recusar
                    </Button>
                  </div>
                )}

                <Button onClick={goBack} variant="outline" className="w-full">
                  Voltar
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </main>
      </div>
    );
  }

  /* ======================================================
     🧑‍⚕️ VISÃO DO PROFISSIONAL / SECRETÁRIA
     ====================================================== */
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />
      <main className="p-4 max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Nova Proposta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!canEdit && (
              <Alert variant="destructive">
                <AlertDescription>Você não tem permissão para enviar propostas.</AlertDescription>
              </Alert>
            )}

            <Input
              placeholder="Valor (R$)"
              value={valorAcordado}
              onChange={(e) => setValorAcordado(e.target.value)}
              disabled={!canEdit}
            />
            <Input
              placeholder="Gcoins"
              value={quantidadeGcoins}
              onChange={(e) => setQuantidadeGcoins(e.target.value)}
              disabled={!canEdit}
            />
            <Textarea
              placeholder="Descrição"
              value={descricaoAcordo}
              onChange={(e) => setDescricaoAcordo(e.target.value)}
              disabled={!canEdit}
            />

            <Button onClick={handleAttachment} variant="outline" disabled={!canEdit}>
              <Paperclip className="h-4 w-4 mr-2" />
              {comprovante ?? "Anexar comprovante"}
            </Button>

            <Button onClick={handleSendProposal} disabled={!canEdit} className="w-full">
              <Send className="h-4 w-4 mr-2" />
              Enviar Proposta
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
