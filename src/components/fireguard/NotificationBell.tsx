import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { listExtintores, statusFor } from "@/lib/fireguard/services";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function NotificationBell() {
  const { data: extintores = [] } = useQuery({ queryKey: ["extintores"], queryFn: listExtintores });
  const alertas = extintores.filter((e) => {
    const s = statusFor(e);
    return s === "vencido" || s === "vencendo30";
  });
  const count = alertas.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative size-10 rounded-full flex items-center justify-center hover:bg-secondary transition-colors" aria-label="Notificações">
          <Bell className="size-5 text-muted-foreground" />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-security text-security-foreground text-[10px] font-bold flex items-center justify-center ring-2 ring-card">
              {count > 99 ? "99+" : count}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b border-border">
          <p className="font-semibold text-sm">Notificações</p>
          <p className="text-xs text-muted-foreground mt-0.5">{count} extintores precisam de atenção</p>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {alertas.length === 0 && (
            <p className="p-6 text-sm text-muted-foreground text-center">Nenhum alerta no momento.</p>
          )}
          {alertas.slice(0, 8).map((e) => {
            const s = statusFor(e);
            const venc = s === "vencido";
            return (
              <Link key={e.id} to="/inventario" className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 border-b border-border last:border-b-0">
                <span className={`size-2 rounded-full ${venc ? "bg-security" : "bg-alert"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{e.codigo} · {e.tipo}</p>
                  <p className="text-xs text-muted-foreground truncate">{e.setor}</p>
                </div>
                <span className={`text-[10px] font-mono uppercase ${venc ? "text-security" : "text-alert"}`}>
                  {venc ? "Vencido" : "30 dias"}
                </span>
              </Link>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}