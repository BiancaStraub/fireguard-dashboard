import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/fireguard/AppShell";
import { useApp, statusFor, daysUntil } from "@/lib/fireguard/store";
import { useMemo } from "react";
import { AlertTriangle, CheckCircle2, Clock, Boxes, ArrowUpRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { StatusBadge } from "@/components/fireguard/StatusBadge";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — FireGuard" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const extintores = useApp((s) => s.extintores);
  const inspecoes = useApp((s) => s.inspecoes);

  const kpis = useMemo(() => {
    const ativos = extintores.filter((e) => e.status === "Ativo");
    const vencidos = ativos.filter((e) => daysUntil(e.validadeCarga) < 0).length;
    const v7 = ativos.filter((e) => { const d = daysUntil(e.validadeCarga); return d >= 0 && d <= 7; }).length;
    const v15 = ativos.filter((e) => { const d = daysUntil(e.validadeCarga); return d > 7 && d <= 15; }).length;
    const v30 = ativos.filter((e) => { const d = daysUntil(e.validadeCarga); return d > 15 && d <= 30; }).length;
    const mes = new Date();
    const inspMes = inspecoes.filter((i) => {
      const d = new Date(i.data);
      return d.getMonth() === mes.getMonth() && d.getFullYear() === mes.getFullYear();
    }).length;
    return { total: extintores.length, vencidos, v7, v15, v30, inspMes };
  }, [extintores, inspecoes]);

  const porSetor = useMemo(() => {
    const map = new Map<string, { setor: string; total: number; alerta: number }>();
    for (const e of extintores) {
      const cur = map.get(e.setor) ?? { setor: e.setor, total: 0, alerta: 0 };
      cur.total += 1;
      const s = statusFor(e);
      if (s === "vencido" || s === "vencendo7") cur.alerta += 1;
      map.set(e.setor, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [extintores]);

  const recentes = useMemo(() => {
    return [...extintores]
      .filter((e) => e.status === "Ativo")
      .sort((a, b) => daysUntil(a.validadeCarga) - daysUntil(b.validadeCarga))
      .slice(0, 5);
  }, [extintores]);

  return (
    <AppShell>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-mono font-medium text-muted-foreground uppercase tracking-widest mb-1">Sistema de Monitoramento</p>
          <h1 className="text-3xl font-semibold tracking-tight">Status da Rede de Proteção</h1>
        </div>
        <div className="flex gap-3">
          <Link to="/inventario" className="px-4 py-2 text-sm font-semibold border border-border rounded-lg hover:bg-secondary transition-colors shadow-soft bg-card">Ver Inventário</Link>
          <Link to="/inspecao" className="px-4 py-2 text-sm font-semibold bg-carbon text-carbon-foreground rounded-lg hover:bg-carbon/90 transition-colors shadow-soft">Nova Inspeção</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <KpiCard label="Total de Ativos" value={kpis.total} icon={Boxes} accent="default" hint="Patrimônio cadastrado" />
        <KpiCard label="Vencidos" value={kpis.vencidos} icon={AlertTriangle} accent="security" hint="Ação imediata" />
        <KpiCard label="Vencendo (30 dias)" value={kpis.v30 + kpis.v15 + kpis.v7} icon={Clock} accent="alert" hint={`${kpis.v7} em 7d · ${kpis.v15} em 15d`} />
        <KpiCard label="Inspeções no Mês" value={kpis.inspMes} icon={CheckCircle2} accent="safe" hint="Concluídas" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2 bg-card p-5 md:p-8 rounded-2xl border border-border shadow-soft">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-lg">Distribuição por Setor</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Total e itens em alerta crítico</p>
            </div>
            <div className="hidden sm:flex gap-3 text-xs">
              <div className="flex items-center gap-1.5"><div className="size-2 rounded-full bg-carbon" />Total</div>
              <div className="flex items-center gap-1.5"><div className="size-2 rounded-full bg-security" />Crítico</div>
            </div>
          </div>
          <div className="h-72 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={porSetor}>
                <XAxis dataKey="setor" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="total" fill="var(--carbon)" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {porSetor.map((_, i) => <Cell key={i} />)}
                </Bar>
                <Bar dataKey="alerta" fill="var(--security)" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-lg">Próximos do Vencimento</h3>
            <Link to="/inventario" className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1">Ver todos <ArrowUpRight className="size-3" /></Link>
          </div>
          {recentes.map((e) => {
            const d = daysUntil(e.validadeCarga);
            return (
              <div key={e.id} className="p-4 bg-card rounded-xl border border-border flex items-center gap-4 shadow-soft">
                <div className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${d < 0 ? "bg-security/10" : d <= 15 ? "bg-alert/15" : "bg-safe/10"}`}>
                  <div className={`size-2 rounded-full ${d < 0 ? "bg-security" : d <= 15 ? "bg-alert" : "bg-safe"}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{e.serie} · {e.tipo}</p>
                  <p className="text-xs text-muted-foreground truncate">{e.setor} · {e.predio}</p>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-mono font-bold ${d < 0 ? "text-security" : d <= 15 ? "text-alert" : "text-safe"}`}>
                    {d < 0 ? `${Math.abs(d)}d ATRÁS` : `${d}d`}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{d < 0 ? "Vencido" : "Restantes"}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}

function KpiCard({ label, value, icon: Icon, accent, hint }: { label: string; value: number; icon: typeof Boxes; accent: "default" | "security" | "alert" | "safe"; hint: string }) {
  const ringClass = {
    default: "",
    security: "border-l-4 border-l-security shadow-glow-red",
    alert: "border-l-4 border-l-alert",
    safe: "border-l-4 border-l-safe shadow-glow-green",
  }[accent];
  const iconColor = {
    default: "text-muted-foreground",
    security: "text-security",
    alert: "text-alert",
    safe: "text-safe",
  }[accent];
  const valueColor = {
    default: "text-foreground",
    security: "text-security",
    alert: "text-alert",
    safe: "text-safe",
  }[accent];
  return (
    <div className={`bg-card p-5 md:p-6 rounded-2xl border border-border shadow-soft flex flex-col justify-between min-h-[140px] ${ringClass}`}>
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <Icon className={`size-4 ${iconColor}`} />
      </div>
      <div>
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl md:text-4xl font-semibold tracking-tight tabular-nums ${valueColor}`}>{value}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{hint}</p>
      </div>
    </div>
  );
}