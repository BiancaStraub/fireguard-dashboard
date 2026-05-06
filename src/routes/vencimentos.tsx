import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/fireguard/AppShell";
import { useQuery } from "@tanstack/react-query";
import { listExtintores, daysUntil, statusFor } from "@/lib/fireguard/services";
import { useAuth } from "@/lib/fireguard/auth";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/fireguard/StatusBadge";
import { CalendarClock, Pencil } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/vencimentos")({
  head: () => ({ meta: [{ title: "Vencimentos — FireGuard" }] }),
  component: VencimentosPage,
});

function VencimentosPage() {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && profile && profile.role !== "admin") navigate({ to: "/empresas" });
  }, [profile, loading, navigate]);

  const { data: extintores = [] } = useQuery({ queryKey: ["extintores"], queryFn: listExtintores });
  const [janela, setJanela] = useState<"todos" | "vencidos" | "7" | "15" | "30">("30");
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    return [...extintores]
      .filter((e) => e.status === "Ativo")
      .filter((e) => {
        const d = daysUntil(e.validade_carga);
        if (janela === "vencidos") return d < 0;
        if (janela === "7") return d >= 0 && d <= 7;
        if (janela === "15") return d >= 0 && d <= 15;
        if (janela === "30") return d >= 0 && d <= 30;
        return true;
      })
      .filter((e) => !q || `${e.codigo} ${e.setor} ${e.predio}`.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => daysUntil(a.validade_carga) - daysUntil(b.validade_carga));
  }, [extintores, janela, q]);

  return (
    <AppShell>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-2">
            <CalendarClock className="size-3" /> Controle de prazos
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Vencimentos</h1>
          <p className="text-sm text-muted-foreground mt-1">{list.length} equipamentos no filtro atual</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-soft p-4 md:p-5 mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por código ou setor..." className="h-10 md:col-span-2" />
        <Select value={janela} onValueChange={(v) => setJanela(v as typeof janela)}>
          <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="vencidos">Vencidos</SelectItem>
            <SelectItem value="7">Vencendo em 7 dias</SelectItem>
            <SelectItem value="15">Vencendo em 15 dias</SelectItem>
            <SelectItem value="30">Vencendo em 30 dias</SelectItem>
            <SelectItem value="todos">Todos os ativos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-soft">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider border-b border-border bg-secondary/30">
              <th className="px-6 py-3 font-medium">Código</th>
              <th className="px-6 py-3 font-medium">Tipo</th>
              <th className="px-6 py-3 font-medium">Localização</th>
              <th className="px-6 py-3 font-medium">Validade Carga</th>
              <th className="px-6 py-3 font-medium">Restantes</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {list.map((e) => {
              const d = daysUntil(e.validade_carga);
              return (
                <tr key={e.id} className="hover:bg-secondary/30">
                  <td className="px-6 py-4 text-sm font-mono">{e.codigo}</td>
                  <td className="px-6 py-4 text-sm">{e.tipo} {e.capacidade ?? ""}</td>
                  <td className="px-6 py-4 text-sm">{e.localizacao ?? e.setor} · {e.predio}</td>
                  <td className="px-6 py-4 text-sm tabular-nums">{format(new Date(e.validade_carga), "dd/MM/yyyy")}</td>
                  <td className={`px-6 py-4 text-sm font-mono font-semibold ${d < 0 ? "text-security" : d <= 15 ? "text-alert" : "text-safe"}`}>
                    {d < 0 ? `${Math.abs(d)}d atrás` : `${d}d`}
                  </td>
                  <td className="px-6 py-4"><StatusBadge status={statusFor(e)} /></td>
                  <td className="px-6 py-4 text-right">
                    <Button size="sm" variant="outline" onClick={() => navigate({ to: "/cadastro/$id", params: { id: e.id } })}>
                      <Pencil className="size-3.5" /> Editar / Renovar
                    </Button>
                  </td>
                </tr>
              );
            })}
            {list.length === 0 && (
              <tr><td colSpan={7} className="text-center py-12 text-muted-foreground text-sm">Nenhum equipamento neste filtro.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}