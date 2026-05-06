import type { ExtStatusBadge } from "@/lib/fireguard/services";
import { cn } from "@/lib/utils";

const MAP: Record<ExtStatusBadge, { label: string; className: string }> = {
  vencido: { label: "Vencido", className: "bg-security/10 text-security ring-security/20" },
  vencendo7: { label: "≤ 7 dias", className: "bg-security/10 text-security ring-security/20" },
  vencendo15: { label: "≤ 15 dias", className: "bg-alert/15 text-alert ring-alert/20" },
  vencendo30: { label: "Vence em 30 dias", className: "bg-alert/15 text-alert ring-alert/20" },
  ok: { label: "Em Conformidade", className: "bg-safe/10 text-safe ring-safe/20" },
  manutencao: { label: "Manutenção", className: "bg-muted text-muted-foreground ring-border" },
  descartado: { label: "Descartado", className: "bg-muted text-muted-foreground ring-border line-through" },
};

export function StatusBadge({ status }: { status: ExtStatusBadge }) {
  const m = MAP[status];
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset", m.className)}>
      {m.label}
    </span>
  );
}