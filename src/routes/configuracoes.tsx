import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/fireguard/AppShell";
import { Settings, Bell, Mail } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — FireGuard" }] }),
  component: ConfiguracoesPage,
});

type Prefs = {
  email30: boolean;
  emailVencido: boolean;
};

const DEFAULTS: Prefs = { email30: true, emailVencido: true };
const KEY = "fireguard:prefs";

function ConfiguracoesPage() {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const p = { ...DEFAULTS, ...JSON.parse(raw) } as Prefs;
        setPrefs(p);
      }
    } catch { /* ignore */ }
  }, []);

  const update = (patch: Partial<Prefs>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    localStorage.setItem(KEY, JSON.stringify(next));
    toast.success("Preferência atualizada");
  };

  return (
    <AppShell>
      <div className="mb-8">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">Sistema</p>
        <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-3">
          <Settings className="size-7 text-security" /> Configurações
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Preferências de notificação e aparência.</p>
      </div>

      <div className="grid gap-5 max-w-3xl">
        <section className="bg-card border border-border rounded-xl p-6 shadow-soft">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="size-5 text-security" />
            <h2 className="font-semibold text-lg">Notificações Automáticas</h2>
          </div>
          <div className="space-y-4">
            <ToggleRow
              icon={<Mail className="size-4 text-muted-foreground" />}
              title="Avisar por e-mail 30 dias antes do vencimento"
              desc="Envia um lembrete prévio para o responsável pela unidade."
              checked={prefs.email30}
              onChange={(v) => update({ email30: v })}
            />
            <ToggleRow
              icon={<Mail className="size-4 text-security" />}
              title="Avisar por e-mail quando o extintor vencer"
              desc="Notifica imediatamente após o vencimento do extintor."
              checked={prefs.emailVencido}
              onChange={(v) => update({ emailVencido: v })}
            />
          </div>
        </section>

      </div>
    </AppShell>
  );
}

function ToggleRow({ title, desc, checked, onChange, icon }: { title: string; desc?: string; checked: boolean; onChange: (v: boolean) => void; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div className="flex gap-3 min-w-0">
        {icon && <div className="mt-0.5">{icon}</div>}
        <div className="min-w-0">
          <Label className="font-medium text-sm">{title}</Label>
          {desc && <p className="text-xs text-muted-foreground mt-0.5 break-words">{desc}</p>}
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}