import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/fireguard/AppShell";
import { useQuery } from "@tanstack/react-query";
import { listInspecoes, listExtintores, statusFor } from "@/lib/fireguard/services";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useMemo } from "react";

export const Route = createFileRoute("/relatorios")({
  head: () => ({ meta: [{ title: "Relatórios — FireGuard" }] }),
  component: RelatoriosPage,
});

function RelatoriosPage() {
  const { data: inspecoes = [] } = useQuery({ queryKey: ["inspecoes"], queryFn: () => listInspecoes() });
  const { data: extintores = [] } = useQuery({ queryKey: ["extintores"], queryFn: listExtintores });
  const codigoMap = new Map(extintores.map((e) => [e.id, e.codigo]));
  const sorted = [...inspecoes].sort((a, b) => +new Date(b.data) - +new Date(a.data));

  // Série mensal: últimas 6 referências de mês (conformes vs não conformes)
  const desempenhoMensal = useMemo(() => {
    const now = new Date();
    const buckets: { key: string; label: string; conformes: number; naoConformes: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: format(d, "MMM/yy"),
        conformes: 0,
        naoConformes: 0,
      });
    }
    for (const i of inspecoes) {
      const d = new Date(i.data);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const b = buckets.find((x) => x.key === key);
      if (!b) continue;
      if (i.conforme) b.conformes += 1;
      else b.naoConformes += 1;
    }
    return buckets;
  }, [inspecoes]);

  // Distribuição de status dos extintores
  const statusExtintores = useMemo(() => {
    let ok = 0, vencendo = 0, vencidos = 0, outros = 0;
    for (const e of extintores) {
      const s = statusFor(e);
      if (s === "ok") ok += 1;
      else if (s === "vencido") vencidos += 1;
      else if (s === "vencendo7" || s === "vencendo15" || s === "vencendo30") vencendo += 1;
      else outros += 1;
    }
    return [
      { status: "Conformes", total: ok, fill: "var(--safe)" },
      { status: "Vencendo", total: vencendo, fill: "var(--alert)" },
      { status: "Vencidos", total: vencidos, fill: "var(--security)" },
      { status: "Outros", total: outros, fill: "var(--muted-foreground)" },
    ];
  }, [extintores]);

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
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">Visão Analítica</p>
          <h1 className="text-3xl font-semibold tracking-tight">Relatórios e Análises</h1>
          <p className="text-sm text-muted-foreground mt-1">{sorted.length} registros · Última: {sorted[0] ? format(new Date(sorted[0].data), "dd/MM/yyyy HH:mm") : "—"}</p>
        </div>
        <Button onClick={exportar} className="h-11 bg-security hover:bg-security/90 text-security-foreground font-semibold shadow-glow-red">
          <FileDown className="size-4" /> Exportar Relatório Mensal
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <SummaryCard label="Conformes" value={sorted.filter((i) => i.conforme).length} accent="safe" />
        <SummaryCard label="Não Conformes" value={sorted.filter((i) => !i.conforme).length} accent="security" />
        <SummaryCard label="Total de Inspeções" value={sorted.length} accent="default" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl shadow-soft p-6 md:p-8">
          <h3 className="font-semibold text-lg">Desempenho de Inspeções</h3>
          <p className="text-xs text-muted-foreground mt-0.5 mb-6">Conformes vs. Não conformes (últimos 6 meses)</p>
          <div className="h-72 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={desempenhoMensal}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="conformes" name="Conformes" stroke="var(--safe)" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="naoConformes" name="Não conformes" stroke="var(--security)" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-soft p-6 md:p-8">
          <h3 className="font-semibold text-lg">Status dos Extintores</h3>
          <p className="text-xs text-muted-foreground mt-0.5 mb-6">Distribuição atual por situação</p>
          <div className="h-72 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusExtintores}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="status" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={64}>
                  {statusExtintores.map((s) => (
                    <Cell key={s.status} fill={s.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
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