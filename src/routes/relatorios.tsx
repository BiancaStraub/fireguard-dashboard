import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/fireguard/AppShell";
import { useQuery } from "@tanstack/react-query";
import { listInspecoes, listExtintores, type ChecklistItem } from "@/lib/fireguard/services";
import { Button } from "@/components/ui/button";
import { FileDown, CheckCircle2, AlertTriangle, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useEffect } from "react";
import { useAuth } from "@/lib/fireguard/auth";

export const Route = createFileRoute("/relatorios")({
  head: () => ({ meta: [{ title: "Relatórios — FireGuard" }] }),
  component: RelatoriosPage,
});

function RelatoriosPage() {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && profile && profile.role !== "admin") navigate({ to: "/inventario" });
  }, [profile, loading, navigate]);
  const { data: inspecoes = [] } = useQuery({ queryKey: ["inspecoes"], queryFn: () => listInspecoes() });
  const { data: extintores = [] } = useQuery({ queryKey: ["extintores"], queryFn: listExtintores });
  const codigoMap = new Map(extintores.map((e) => [e.id, e.codigo]));
  const sorted = [...inspecoes].sort((a, b) => +new Date(b.data) - +new Date(a.data));

  const exportar = () => {
    const now = new Date();
    const mes = sorted.filter((i) => {
      const d = new Date(i.data);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const header = ["Data", "Codigo", "Inspetor", "Conforme", "Observacoes"];
    const rows = mes.map((i) => [
      format(new Date(i.data), "dd/MM/yyyy HH:mm"),
      codigoMap.get(i.extintor_id) ?? i.extintor_id,
      i.inspetor_nome,
      i.conforme ? "Sim" : "Nao",
      (i.observacoes ?? "").replace(/\n/g, " "),
    ]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-${format(now, "yyyy-MM")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Relatório do mês exportado (${mes.length} inspeções)`);
  };

  return (
    <AppShell>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">Histórico</p>
          <h1 className="text-3xl font-semibold tracking-tight">Relatórios e Inspeções</h1>
          <p className="text-sm text-muted-foreground mt-1">{sorted.length} registros · Última: {sorted[0] ? format(new Date(sorted[0].data), "dd/MM/yyyy HH:mm") : "—"}</p>
        </div>
        <Button onClick={exportar} className="h-11 bg-security hover:bg-security/90 text-security-foreground font-semibold shadow-glow-red">
          <FileDown className="size-4" /> Exportar Relatório Mensal
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <SummaryCard label="Conformes" value={sorted.filter((i) => i.conforme).length} accent="safe" />
          <SummaryCard label="Não Conformes" value={sorted.filter((i) => !i.conforme).length} accent="security" />
          <SummaryCard label="Total" value={sorted.length} accent="default" />
        </div>

        <div className="lg:col-span-3">
          <div className="bg-card border border-border rounded-2xl shadow-soft p-6 md:p-8">
            <h3 className="font-semibold mb-1">Linha do Tempo</h3>
            <p className="text-xs text-muted-foreground mb-6">Inspeções recentes em ordem cronológica</p>

            <div className="relative">
              <div className="absolute left-4 top-2 bottom-2 w-px bg-border" />
              <div className="space-y-6">
                {sorted.map((i) => {
                  const itens = (Array.isArray(i.itens) ? i.itens : []) as unknown as ChecklistItem[];
                  const naoConformes = itens.filter((it) => !it.conforme);
                  return (
                    <div key={i.id} className="relative pl-12">
                      <div className={`absolute left-0 top-1 size-8 rounded-full border-4 border-background flex items-center justify-center ${i.conforme ? "bg-safe" : "bg-security"}`}>
                        {i.conforme ? <CheckCircle2 className="size-4 text-safe-foreground" /> : <AlertTriangle className="size-4 text-security-foreground" />}
                      </div>
                      <div className="bg-secondary/40 border border-border rounded-xl p-4">
                        <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                          <div>
                            <p className="font-semibold flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-sm">{codigoMap.get(i.extintor_id) ?? i.extintor_id.slice(0, 8)}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${i.conforme ? "bg-safe/10 text-safe" : "bg-security/10 text-security"}`}>
                                {i.conforme ? "Conforme" : "Não conforme"}
                              </span>
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                              <span>{format(new Date(i.data), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}</span>
                              <span className="flex items-center gap-1"><User className="size-3" />{i.inspetor_nome}</span>
                            </p>
                          </div>
                        </div>
                        {naoConformes.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-border">
                            <p className="text-xs font-mono uppercase tracking-wider text-security mb-1.5">Itens não conformes</p>
                            <ul className="text-xs text-foreground space-y-0.5">
                              {naoConformes.map((nc) => <li key={nc.key}>· {nc.label}</li>)}
                            </ul>
                          </div>
                        )}
                        {i.observacoes && (
                          <p className="text-xs text-muted-foreground mt-3 italic">"{i.observacoes}"</p>
                        )}
                      </div>
                    </div>
                  );
                })}
                {sorted.length === 0 && <p className="text-sm text-muted-foreground text-center py-12">Nenhuma inspeção registrada ainda.</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function SummaryCard({ label, value, accent }: { label: string; value: number; accent: "safe" | "security" | "default" }) {
  const map = {
    safe: { val: "text-safe", border: "border-l-safe" },
    security: { val: "text-security", border: "border-l-security" },
    default: { val: "text-foreground", border: "border-l-border" },
  }[accent];
  return (
    <div className={`bg-card border border-border rounded-2xl p-5 shadow-soft border-l-4 ${map.border}`}>
      <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`text-3xl font-semibold tracking-tight tabular-nums mt-2 ${map.val}`}>{value}</p>
    </div>
  );
}