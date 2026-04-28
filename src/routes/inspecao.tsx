import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/fireguard/AppShell";
import { useApp } from "@/lib/fireguard/store";
import { CHECKLIST_ITEMS } from "@/lib/fireguard/data";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Check, X, ScanLine, ArrowLeft, ShieldCheck, AlertTriangle } from "lucide-react";
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
  const extintores = useApp((s) => s.extintores);
  const addInspecao = useApp((s) => s.addInspecao);
  const user = useApp((s) => s.user);
  const navigate = useNavigate();

  const [extintorId, setExtintorId] = useState<string | undefined>(search.id);
  const ext = extintores.find((e) => e.id === extintorId);

  const [itens, setItens] = useState(() => CHECKLIST_ITEMS.map((c) => ({ ...c, conforme: null as boolean | null })));
  const [obs, setObs] = useState("");
  const [scanning, setScanning] = useState(false);

  const startScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      const random = extintores[Math.floor(Math.random() * extintores.length)];
      setExtintorId(random.id);
      toast.success(`QR Code lido: ${random.serie}`);
    }, 1600);
  };

  const setItem = (key: string, conforme: boolean) => {
    setItens(itens.map((i) => i.key === key ? { ...i, conforme } : i));
  };

  const allAnswered = itens.every((i) => i.conforme !== null);
  const conforme = allAnswered && itens.every((i) => i.conforme === true);

  const save = () => {
    if (!ext || !allAnswered) {
      toast.error("Responda todos os itens do checklist");
      return;
    }
    addInspecao({
      id: `i${Date.now()}`,
      extintorId: ext.id,
      extintorSerie: ext.serie,
      data: new Date().toISOString(),
      inspetor: user?.nome ?? "Inspetor",
      itens: itens.map((i) => ({ ...i, conforme: i.conforme! })),
      observacoes: obs,
      conforme,
    });
    toast.success(`Inspeção salva — ${conforme ? "Conforme" : "Não conforme"}`);
    navigate({ to: "/relatorios" });
  };

  if (!ext) {
    return (
      <AppShell>
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">Inspeção em Campo</p>
            <h1 className="text-3xl font-semibold tracking-tight">Identificar Extintor</h1>
            <p className="text-sm text-muted-foreground mt-2">Escaneie o QR Code do equipamento para iniciar o checklist</p>
          </div>

          <div className={cn("aspect-square max-w-sm mx-auto rounded-3xl border-2 border-dashed border-border bg-card flex flex-col items-center justify-center p-8 mb-6 relative overflow-hidden transition-all", scanning && "border-security bg-security/5")}>
            {scanning ? (
              <>
                <ScanLine className="size-20 text-security animate-pulse" />
                <p className="mt-4 font-mono text-xs uppercase tracking-widest text-security">Lendo QR Code...</p>
                <div className="absolute inset-x-0 top-1/2 h-0.5 bg-security animate-pulse" />
              </>
            ) : (
              <>
                <Camera className="size-20 text-muted-foreground/40" />
                <p className="mt-4 text-sm text-muted-foreground text-center">Aponte a câmera para o adesivo do extintor</p>
              </>
            )}
          </div>

          <Button onClick={startScan} disabled={scanning} className="w-full h-14 text-base bg-security hover:bg-security/90 text-security-foreground font-semibold shadow-glow-red">
            <Camera className="size-5" /> Abrir Câmera / Ler QR Code
          </Button>

          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground mb-3">ou selecione manualmente:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {extintores.slice(0, 6).map((e) => (
                <button key={e.id} onClick={() => setExtintorId(e.id)} className="font-mono text-xs px-3 py-1.5 border border-border rounded-md hover:bg-secondary">
                  {e.serie}
                </button>
              ))}
            </div>
          </div>
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
              <h2 className="text-2xl font-semibold tracking-tight">{ext.serie}</h2>
              <p className="text-zinc-400 text-sm">{ext.tipo} · Classe {ext.classe.join("/")} · {ext.fabricante}</p>
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
                  <button
                    onClick={() => setItem(item.key, true)}
                    className={cn(
                      "h-11 w-11 rounded-lg border-2 flex items-center justify-center transition-all",
                      item.conforme === true ? "bg-safe border-safe text-safe-foreground shadow-glow-green" : "border-border hover:border-safe text-muted-foreground"
                    )}
                    aria-label="Conforme"
                  >
                    <Check className="size-5" />
                  </button>
                  <button
                    onClick={() => setItem(item.key, false)}
                    className={cn(
                      "h-11 w-11 rounded-lg border-2 flex items-center justify-center transition-all",
                      item.conforme === false ? "bg-security border-security text-security-foreground shadow-glow-red" : "border-border hover:border-security text-muted-foreground"
                    )}
                    aria-label="Não conforme"
                  >
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
        </div>

        {allAnswered && (
          <div className={cn("rounded-xl p-4 mb-4 flex items-center gap-3", conforme ? "bg-safe/10 text-safe" : "bg-security/10 text-security")}>
            {conforme ? <ShieldCheck className="size-5" /> : <AlertTriangle className="size-5" />}
            <p className="text-sm font-semibold">{conforme ? "Inspeção completa — Equipamento Conforme" : "Itens não conformes detectados"}</p>
          </div>
        )}

        <Button onClick={save} disabled={!allAnswered} className="w-full h-14 text-base bg-carbon hover:bg-carbon/90 text-carbon-foreground font-semibold">
          Salvar Inspeção
        </Button>
      </div>
    </AppShell>
  );
}