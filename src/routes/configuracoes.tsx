import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/fireguard/AppShell";
import { Settings } from "lucide-react";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — FireGuard" }] }),
  component: ConfiguracoesPage,
});

function ConfiguracoesPage() {
  return (
    <AppShell>
      <div className="mb-8">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">Sistema</p>
        <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-3">
          <Settings className="size-7 text-security" /> Configurações
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Preferências de notificação, alertas e integrações.</p>
      </div>
      <div className="bg-card border border-border rounded-2xl p-8 shadow-soft text-sm text-muted-foreground">
        Em construção. Em breve você poderá ajustar alertas por e-mail e preferências do sistema aqui.
      </div>
    </AppShell>
  );
}