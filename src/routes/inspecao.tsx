import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/fireguard/AppShell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listExtintores, getExtintorByCodigo, createInspecao, CHECKLIST_ITEMS } from "@/lib/fireguard/services";
import { useAuth } from "@/lib/fireguard/auth";
import { QrScanner } from "@/components/fireguard/QrScanner";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Check, X, ArrowLeft, ShieldCheck, AlertTriangle } from "lucide-react";
import { FileUpload } from "@/components/fireguard/FileUpload";
import type { Anexo } from "@/lib/fireguard/services";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { z } from "zod";

const searchSchema = z.object({ id: z.string().optional() });

export const Route = createFileRoute("/inspecao")({
  head: () => ({ meta: [{ title: "Inspeção — FireGuard" }] }),
  validateSearch: (s) => searchSchema.parse(s),
  component: InspecaoPage,
});

function InspecaoPage() {
  const search = Route.useSearch();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: extintores = [] } = useQuery({ queryKey: ["extintores"], queryFn: listExtintores });

  const [extintorId, setExtintorId] = useState<string | undefined>(search.id);
  const ext = extintores.find((e) => e.id === extintorId);

  const [itens, setItens] = useState(() => CHECKLIST_ITEMS.map((c) => ({ ...c, conforme: null as boolean | null })));
  const [obs, setObs] = useState("");
  const [fotos, setFotos] = useState<Anexo[]>([]);
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [scanOpen, setScanOpen] = useState(false);

  const onScanned = async (code: string) => {
    setScanOpen(false);
    const found = await getExtintorByCodigo(code);
    if (found) { setExtintorId(found.id); toast.success(`Extintor ${code} carregado`); }
    else toast.error(`Código ${code} não cadastrado.`);
  };

  const setItem = (key: string, conforme: boolean) => {
    setItens(itens.map((i) => i.key === key ? { ...i, conforme } : i));
  };

  const allAnswered = itens.every((i) => i.conforme !== null);
  const conforme = allAnswered && itens.every((i) => i.conforme === true);

  const save = useMutation({
    mutationFn: () => createInspecao({
      extintor_id: ext!.id,
      inspetor_id: user!.id,
      inspetor_nome: profile?.nome ?? user!.email ?? "Inspetor",
      itens: itens.map((i) => ({ key: i.key, label: i.label, conforme: !!i.conforme })),
      observacoes: obs,
      conforme,
      fotos: fotos.map((f) => f.url),
      anexos,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inspecoes"] });
      toast.success(`Inspeção salva — ${conforme ? "Conforme" : "Não conforme"}`);
      navigate({ to: "/relatorios" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submit = () => {
    if (!ext || !allAnswered) { toast.error("Responda todos os itens do checklist"); return; }
    save.mutate();
  };

  if (!ext) {
    return (
      <AppShell>
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">Inspeção em Campo</p>
            <h1 className="text-3xl font-semibold tracking-tight">Identificar Extintor</h1>
            <p className="text-sm text-muted-foreground mt-2">Escaneie o QR Code / código de barras para iniciar o checklist</p>
          </div>

          <Button onClick={() => setScanOpen(true)} className="w-full h-14 text-base bg-security hover:bg-security/90 text-security-foreground font-semibold shadow-glow-red">
            <Camera className="size-5" /> Abrir Câmera / Ler QR Code
          </Button>

          {extintores.length > 0 && (
            <div className="mt-6 text-center">
              <p className="text-xs text-muted-foreground mb-3">ou selecione manualmente:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {extintores.slice(0, 10).map((e) => (
                  <button key={e.id} onClick={() => setExtintorId(e.id)} className="font-mono text-xs px-3 py-1.5 border border-border rounded-md hover:bg-secondary">
                    {e.codigo}
                  </button>
                ))}
              </div>
            </div>
          )}

          <QrScanner open={scanOpen} onClose={() => setScanOpen(false)} onDetected={onScanned} />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <button onClick={() => setExtintorId(undefined)} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4">
        <ArrowLeft className="size-4" /> Escanear outro
      </button>

      <div className="max-w-2xl mx-auto">
        <div className="bg-carbon text-carbon-foreground rounded-2xl p-6 mb-6 shadow-soft">
          <p className="font-mono text-xs uppercase tracking-widest text-zinc-400 mb-1">Equipamento identificado</p>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">{ext.codigo}</h2>
              <p className="text-zinc-400 text-sm">{ext.tipo} · Classe {ext.classes.join("/")} · {ext.fabricante ?? "—"}</p>
            </div>
            <div className="text-right text-sm">
              <p className="text-zinc-400 text-xs">Localização</p>
              <p className="font-medium">{ext.setor}</p>
              <p className="text-xs text-zinc-400">{ext.predio} · {ext.andar}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-soft p-6 mb-4">
          <h3 className="font-semibold mb-1">Checklist de Inspeção</h3>
          <p className="text-xs text-muted-foreground mb-5">Marque cada item conforme ou não conforme</p>

          <div className="space-y-3">
            {itens.map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-4 p-4 rounded-xl border border-border">
                <p className="text-sm font-medium flex-1">{item.label}</p>
                <div className="flex gap-2">
                  <button onClick={() => setItem(item.key, true)} className={cn("h-11 w-11 rounded-lg border-2 flex items-center justify-center transition-all", item.conforme === true ? "bg-safe border-safe text-safe-foreground shadow-glow-green" : "border-border hover:border-safe text-muted-foreground")} aria-label="Conforme">
                    <Check className="size-5" />
                  </button>
                  <button onClick={() => setItem(item.key, false)} className={cn("h-11 w-11 rounded-lg border-2 flex items-center justify-center transition-all", item.conforme === false ? "bg-security border-security text-security-foreground shadow-glow-red" : "border-border hover:border-security text-muted-foreground")} aria-label="Não conforme">
                    <X className="size-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-2">
            <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Observações finais</label>
            <Textarea value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Descreva qualquer irregularidade ou ação tomada..." rows={4} />
          </div>

          <div className="mt-4 space-y-2">
            <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Fotos do estado físico</label>
            <FileUpload label="Tirar / Enviar foto" accept="image/*" capture="environment" prefix="inspecao/fotos" values={fotos} onChange={setFotos} />
          </div>

          <div className="mt-4 space-y-2">
            <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Anexos (laudos / documentos)</label>
            <FileUpload label="Anexar documento" prefix="inspecao/anexos" values={anexos} onChange={setAnexos} />
          </div>
        </div>

        {allAnswered && (
          <div className={cn("rounded-xl p-4 mb-4 flex items-center gap-3", conforme ? "bg-safe/10 text-safe" : "bg-security/10 text-security")}>
            {conforme ? <ShieldCheck className="size-5" /> : <AlertTriangle className="size-5" />}
            <p className="text-sm font-semibold">{conforme ? "Inspeção completa — Equipamento Conforme" : "Itens não conformes detectados"}</p>
          </div>
        )}

        <Button onClick={submit} disabled={!allAnswered || save.isPending} className="w-full h-14 text-base bg-carbon hover:bg-carbon/90 text-carbon-foreground font-semibold">
          {save.isPending ? "Salvando..." : "Salvar Inspeção"}
        </Button>
      </div>
    </AppShell>
  );
}