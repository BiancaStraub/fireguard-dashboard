import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/fireguard/AppShell";
import { Users } from "lucide-react";

export const Route = createFileRoute("/equipe")({
  head: () => ({ meta: [{ title: "Equipe — FireGuard" }] }),
  component: EquipePage,
});

function EquipePage() {
  return (
    <AppShell>
      <div className="mb-8">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">Gestão</p>
        <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-3">
          <Users className="size-7 text-security" /> Cadastro de Equipe
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Gerencie administradores, subadministradores e inspetores.</p>
      </div>
      <div className="bg-card border border-border rounded-2xl p-8 shadow-soft text-sm text-muted-foreground">
        Em construção. Em breve você poderá gerenciar usuários e níveis de acesso aqui.
      </div>
    </AppShell>
  );
}