import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/fireguard/AppShell";
import { useQuery } from "@tanstack/react-query";
import { listEmpresas, countExtintoresPorEmpresa } from "@/lib/fireguard/services";
import { Building2, MapPin, Hash, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmpresaFormDialog } from "@/components/fireguard/EmpresaFormDialog";
import { useAuth } from "@/lib/fireguard/auth";

export const Route = createFileRoute("/empresas")({
  head: () => ({ meta: [{ title: "Empresas — FireGuard" }] }),
  component: EmpresasPage,
});

function EmpresasPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const { data: empresas = [], isLoading } = useQuery({ queryKey: ["empresas"], queryFn: listEmpresas });
  const { data: counts } = useQuery({ queryKey: ["empresas-counts"], queryFn: countExtintoresPorEmpresa });

  return (
    <AppShell>
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">Extintores</p>
          <h1 className="text-3xl font-semibold tracking-tight">Selecione uma Empresa</h1>
          <p className="text-sm text-muted-foreground mt-1">Acesse o inventário detalhado de cada unidade conforme NBR 13485 / 12693.</p>
        </div>
        {isAdmin && (
          <EmpresaFormDialog
            trigger={
              <Button className="h-11 bg-security hover:bg-security/90 text-security-foreground">
                <Plus className="size-4" /> Cadastrar Empresa
              </Button>
            }
          />
        )}
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {empresas.map((e) => {
          const total = counts?.get(e.id) ?? 0;
          return (
            <button
              key={e.id}
              onClick={() => navigate({ to: "/inventario", search: { empresa: e.id } as never })}
              className="group text-left bg-card border border-border rounded-2xl p-6 shadow-soft hover:border-security/50 hover:shadow-glow-red transition-all flex flex-col gap-3"
            >
              <div className="flex items-start justify-between">
                <div className="size-12 rounded-xl bg-security/10 text-security flex items-center justify-center">
                  <Building2 className="size-6" />
                </div>
                <ChevronRight className="size-5 text-muted-foreground group-hover:text-security transition-colors" />
              </div>
              <h3 className="text-lg font-bold leading-tight break-words">{e.nome}</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-start gap-1.5"><Hash className="size-3 mt-1 shrink-0" /> <span className="font-medium">CNPJ:</span> <span className="truncate text-foreground/90">{e.cnpj}</span></p>
                <p className="flex items-start gap-1.5"><MapPin className="size-3 mt-1 shrink-0" /> <span className="break-words text-foreground/90">{e.endereco}</span></p>
              </div>
              <div className="mt-2 pt-4 border-t border-border flex items-baseline justify-between gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Total de Extintores</span>
                <span className="text-2xl font-semibold tabular-nums text-security">{total}</span>
              </div>
            </button>
          );
        })}
      </div>
    </AppShell>
  );
}