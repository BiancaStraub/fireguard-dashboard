import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/fireguard/AppShell";
import { useQuery } from "@tanstack/react-query";
import { listExtintores, listInspecoes, listEmpresas, statusFor, daysUntil } from "@/lib/fireguard/services";
import { useMemo, useEffect, useState } from "react";
import { useAuth } from "@/lib/fireguard/auth";
import { AlertTriangle, CheckCircle2, Clock, Boxes, Filter } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/fireguard/StatusBadge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — FireGuard" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && profile && profile.role !== "admin" && profile.role !== "subadmin") navigate({ to: "/empresas" });
  }, [profile, loading, navigate]);
  const { data: extintoresAll = [] } = useQuery({ queryKey: ["extintores"], queryFn: listExtintores });
  const { data: empresas = [] } = useQuery({ queryKey: ["empresas"], queryFn: listEmpresas });
  const { data: inspecoes = [] } = useQuery({ queryKey: ["inspecoes"], queryFn: () => listInspecoes() });

  // Subadmin: restringe à própria empresa
  const empresaScopeId = profile?.role === "subadmin" ? profile?.empresa_id ?? null : null;

  const [filtroEmpresa, setFiltroEmpresa] = useState<string>("todas");
  const [filtroSetor, setFiltroSetor] = useState<string>("todos");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");

  const extintores = useMemo(() => {
    return extintoresAll.filter((e) => {
      if (empresaScopeId && e.empresa_id !== empresaScopeId) return false;
      if (filtroEmpresa !== "todas" && e.empresa_id !== filtroEmpresa) return false;
      if (filtroSetor !== "todos" && e.setor !== filtroSetor) return false;
      if (filtroStatus !== "todos") {
        const s = statusFor(e);
        if (filtroStatus === "vencidos" && s !== "vencido") return false;
        if (filtroStatus === "vencendo" && s !== "vencendo30") return false;
        if (filtroStatus === "ok" && s !== "ok") return false;
      }
      return true;
    });
  }, [extintoresAll, empresaScopeId, filtroEmpresa, filtroSetor, filtroStatus]);

  const setores = useMemo(() => Array.from(new Set(extintoresAll.filter((e) => !empresaScopeId || e.empresa_id === empresaScopeId).map((e) => e.setor))).sort(), [extintoresAll, empresaScopeId]);

  const kpis = useMemo(() => {
    const ativos = extintores.filter((e) => e.status === "Ativo");
    const vencidos = ativos.filter((e) => statusFor(e) === "vencido").length;
    const vencendo30 = ativos.filter((e) => statusFor(e) === "vencendo30").length;
    const ok = ativos.filter((e) => statusFor(e) === "ok").length;
    const mes = new Date();
    const inspMes = inspecoes.filter((i) => {
      const d = new Date(i.data);
      return d.getMonth() === mes.getMonth() && d.getFullYear() === mes.getFullYear();
    }).length;
    return { total: extintores.length, vencidos, vencendo30, ok, inspMes };
  }, [extintores, inspecoes]);

  const porSetor = useMemo(() => {
    const map = new Map<string, { setor: string; total: number; alerta: number }>();
    for (const e of extintores) {
      const cur = map.get(e.setor) ?? { setor: e.setor, total: 0, alerta: 0 };
      cur.total += 1;
      const s = statusFor(e);
      if (s === "vencido" || s === "vencendo30") cur.alerta += 1;
      map.set(e.setor, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [extintores]);

  const filtrados = useMemo(() => {
    return [...extintores]
      .sort((a, b) => daysUntil(a.teste_hidrostatico ?? a.validade_carga) - daysUntil(b.teste_hidrostatico ?? b.validade_carga));
  }, [extintores]);

  return (
    <AppShell>
      {/* Filter bar */}
      <div className="bg-card border border-border rounded-2xl shadow-soft p-4 mb-6 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground"><Filter className="size-4" /> Filtros</div>
        {!empresaScopeId && (
          <Select value={filtroEmpresa} onValueChange={setFiltroEmpresa}>
            <SelectTrigger className="h-9 md:w-56"><SelectValue placeholder="Empresa" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as empresas</SelectItem>
              {empresas.map((e) => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Select value={filtroSetor} onValueChange={setFiltroSetor}>
          <SelectTrigger className="h-9 md:w-48"><SelectValue placeholder="Setor" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os setores</SelectItem>
            {setores.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="h-9 md:w-48"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            <SelectItem value="vencidos">Vencidos</SelectItem>
            <SelectItem value="vencendo">Vencendo (30d)</SelectItem>
            <SelectItem value="ok">Em conformidade</SelectItem>
          </SelectContent>
        </Select>
        {(filtroEmpresa !== "todas" || filtroSetor !== "todos" || filtroStatus !== "todos") && (
          <Button variant="ghost" size="sm" onClick={() => { setFiltroEmpresa("todas"); setFiltroSetor("todos"); setFiltroStatus("todos"); }}>Limpar</Button>
        )}
      </div>

      {/* KPIs — sempre visíveis. Clique apenas altera o filtro da lista abaixo. */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
        <KpiCard label="Total de Ativos" value={kpis.total} icon={Boxes} accent="default" hint="Clique para limpar" active={filtroStatus === "todos"} onClick={() => setFiltroStatus("todos")} />
        <KpiCard label="Vencidos" value={kpis.vencidos} icon={AlertTriangle} accent="security" hint="Ação imediata" active={filtroStatus === "vencidos"} onClick={() => setFiltroStatus("vencidos")} />
        <KpiCard label="Vence em 30 dias" value={kpis.vencendo30} icon={Clock} accent="alert" hint="Aviso prévio" active={filtroStatus === "vencendo"} onClick={() => setFiltroStatus("vencendo")} />
        <KpiCard label="Em Conformidade" value={kpis.ok} icon={CheckCircle2} accent="safe" hint="OK" active={filtroStatus === "ok"} onClick={() => setFiltroStatus("ok")} />
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
            {porSetor.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                Sem dados para os filtros atuais.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={porSetor}>
                  <XAxis dataKey="setor" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="total" fill="var(--carbon)" radius={[6, 6, 0, 0]} maxBarSize={48} />
                  <Bar dataKey="alerta" fill="var(--security)" radius={[6, 6, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="space-y-3 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="font-semibold text-lg truncate">Extintores {filtroStatus !== "todos" ? `(${filtroStatus === "vencidos" ? "vencidos" : filtroStatus === "vencendo" ? "30 dias" : "conformes"})` : "filtrados"}</h3>
            <span className="text-xs text-muted-foreground tabular-nums shrink-0">{filtrados.length}</span>
          </div>
          {filtrados.length === 0 && (
            <div className="p-4 bg-card rounded-xl border border-border text-sm text-muted-foreground shadow-soft">
              Nenhum equipamento corresponde aos filtros.
            </div>
          )}
          <div className="max-h-[520px] overflow-y-auto space-y-3 pr-1">
            {filtrados.slice(0, 30).map((e) => {
              const venc = e.teste_hidrostatico ?? e.validade_carga;
              const dataFmt = venc ? new Date(venc).toLocaleDateString("pt-BR") : "—";
              return (
                <button
                  key={e.id}
                  onClick={() => navigate({ to: "/inventario", search: { empresa: e.empresa_id ?? undefined } as never })}
                  className="w-full text-left p-5 bg-card rounded-xl border border-border shadow-soft hover:border-security/40 transition-colors flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-lg font-bold text-foreground truncate min-w-0">{e.codigo}</p>
                    <span className="shrink-0"><StatusBadge status={statusFor(e)} /></span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Localização</p>
                    <p className="text-base text-foreground/90 break-words">{e.tipo} · {e.setor}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Vencimento</p>
                    <p className="text-base font-normal text-foreground/90 tabular-nums">{dataFmt}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function KpiCard({ label, value, icon: Icon, accent, hint, active, onClick }: { label: string; value: number; icon: typeof Boxes; accent: "default" | "security" | "alert" | "safe"; hint: string; active?: boolean; onClick?: () => void }) {
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
    <button onClick={onClick} className={`text-left bg-card p-4 md:p-6 rounded-2xl border border-border shadow-soft flex flex-col justify-between min-h-[112px] md:min-h-[140px] transition-all hover:border-security/50 ${ringClass} ${active ? "ring-2 ring-security/40" : ""}`}>
      <div className="flex items-start justify-between">
        <p className="text-xs md:text-sm font-medium text-muted-foreground leading-tight pr-2">{label}</p>
        <Icon className={`size-4 ${iconColor}`} />
      </div>
      <div>
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl md:text-4xl font-semibold tracking-tight tabular-nums ${valueColor}`}>{value}</span>
        </div>
        <p className="text-[10px] md:text-xs text-muted-foreground mt-1 hidden sm:block">{hint}</p>
      </div>
    </button>
  );
}