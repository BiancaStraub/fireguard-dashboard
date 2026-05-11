import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/fireguard/AppShell";
import { useQuery } from "@tanstack/react-query";
import { listExtintores, listEmpresas, statusFor, daysUntil } from "@/lib/fireguard/services";
import { useMemo, useState } from "react";
import { BellRing, ClipboardCheck, Mail, MapPin, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/fireguard/StatusBadge";
import { toast } from "sonner";

export const Route = createFileRoute("/alertas")({
  head: () => ({ meta: [{ title: "Alertas — FireGuard" }] }),
  component: AlertasPage,
});

function AlertasPage() {
  const navigate = useNavigate();
  const { data: extAll = [] } = useQuery({ queryKey: ["extintores"], queryFn: listExtintores });
  const { data: empresas = [] } = useQuery({ queryKey: ["empresas"], queryFn: listEmpresas });
  const [lidos, setLidos] = useState<Set<string>>(new Set());

  const empresaName = (id?: string | null) => empresas.find((e) => e.id === id)?.nome ?? "—";

  const items = useMemo(() => {
    return extAll
      .filter((e) => {
        const s = statusFor(e);
        return s === "vencido" || s === "vencendo30";
      })
      .sort((a, b) => daysUntil(a.teste_hidrostatico ?? a.validade_carga) - daysUntil(b.teste_hidrostatico ?? b.validade_carga));
  }, [extAll]);

  const vencidos = items.filter((e) => statusFor(e) === "vencido").length;
  const vencendo = items.length - vencidos;

  const markAll = () => {
    setLidos(new Set(items.map((i) => i.id)));
    toast.success("Todos os alertas marcados como lidos");
  };

  const notificar = (codigo: string) => {
    toast.success(`Notificação enviada para o subadmin sobre ${codigo}`);
  };

  return (
    <AppShell>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-2">
            <BellRing className="size-3" /> Operacional
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Alertas e Notificações</h1>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="text-security font-semibold">{vencidos} vencidos</span> · <span className="text-alert font-semibold">{vencendo} vencendo em 30 dias</span>
          </p>
        </div>
        <Button variant="outline" className="h-11" onClick={markAll} disabled={items.length === 0}>
          <CheckCheck className="size-4" /> Marcar todos como lidos
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-10 text-center text-sm text-muted-foreground shadow-soft">
          Nenhum alerta ativo. Tudo em conformidade. ✓
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((e) => {
            const s = statusFor(e);
            const lido = lidos.has(e.id);
            const ref = e.teste_hidrostatico ?? e.validade_carga;
            const dias = daysUntil(ref);
            return (
              <div key={e.id} className={`bg-card border rounded-xl p-5 shadow-soft flex flex-col lg:flex-row lg:items-center gap-4 ${lido ? "opacity-60 border-border" : s === "vencido" ? "border-l-4 border-l-security border-border" : "border-l-4 border-l-alert border-border"}`}>
                <div className="flex-1 min-w-0 flex flex-col gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-base">{e.codigo}</span>
                    <StatusBadge status={s} />
                    <span className="text-xs text-muted-foreground">{dias < 0 ? `${Math.abs(dias)} dia(s) atrás` : `em ${dias} dia(s)`}</span>
                  </div>
                  <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                    <span className="font-medium text-foreground">{empresaName(e.empresa_id)}</span>
                    <span className="inline-flex items-center gap-1 break-words"><MapPin className="size-3 shrink-0" /> {e.localizacao || `${e.predio} / ${e.andar} / ${e.setor}`}</span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                  <Button variant="outline" className="h-10" onClick={() => navigate({ to: "/inspecao" })}>
                    <ClipboardCheck className="size-4" /> Registrar Inspeção
                  </Button>
                  <Button className="h-10 bg-security hover:bg-security/90 text-security-foreground" onClick={() => notificar(e.codigo)}>
                    <Mail className="size-4" /> Notificar Subadmin
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}