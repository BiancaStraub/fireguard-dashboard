import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { statusFor, type ExtintorRow } from "@/lib/fireguard/services";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresaNome?: string;
  extintores: ExtintorRow[];
};

// Pseudo-random but stable coordinates derived from id
function coordsFor(id: string, idx: number): { top: string; left: string } {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const top = 12 + ((h + idx * 53) % 76);
  const left = 8 + (((h >> 3) + idx * 97) % 84);
  return { top: `${top}%`, left: `${left}%` };
}

function pinColor(s: ReturnType<typeof statusFor>) {
  if (s === "vencido") return "bg-red-500 ring-red-300";
  if (s === "vencendo30" || s === "vencendo15" || s === "vencendo7") return "bg-yellow-400 ring-yellow-200";
  if (s === "ok") return "bg-green-500 ring-green-300";
  return "bg-muted-foreground ring-border";
}

export function FloorPlanModal({ open, onOpenChange, empresaNome, extintores }: Props) {
  const [active, setActive] = useState<string | null>(null);
  const pins = useMemo(() => extintores.slice(0, 10), [extintores]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border">
          <DialogTitle className="text-base md:text-lg">
            Planta Baixa{empresaNome ? ` — ${empresaNome}` : ""}
          </DialogTitle>
        </DialogHeader>
        <div className="p-3 md:p-5">
          <div className="overflow-auto max-h-[70vh] rounded-xl border border-border bg-muted/30">
            <div
              className="relative mx-auto"
              style={{ width: "100%", minWidth: 600, aspectRatio: "16 / 10" }}
              onClick={() => setActive(null)}
            >
              {/* Floor plan placeholder (technical drawing look) */}
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 800 500"
                preserveAspectRatio="none"
                aria-hidden
              >
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="800" height="500" fill="hsl(var(--background, 0 0% 100%))" />
                <rect width="800" height="500" fill="url(#grid)" />
                {/* Outer walls */}
                <rect x="20" y="20" width="760" height="460" fill="none" stroke="currentColor" strokeWidth="3" />
                {/* Internal divisions */}
                <line x1="280" y1="20" x2="280" y2="300" stroke="currentColor" strokeWidth="2" />
                <line x1="280" y1="300" x2="20" y2="300" stroke="currentColor" strokeWidth="2" />
                <line x1="540" y1="20" x2="540" y2="250" stroke="currentColor" strokeWidth="2" />
                <line x1="540" y1="250" x2="780" y2="250" stroke="currentColor" strokeWidth="2" />
                <line x1="280" y1="380" x2="780" y2="380" stroke="currentColor" strokeWidth="2" />
                {/* Door gaps */}
                <line x1="150" y1="300" x2="200" y2="300" stroke="hsl(var(--background, 0 0% 100%))" strokeWidth="4" />
                <line x1="540" y1="160" x2="540" y2="200" stroke="hsl(var(--background, 0 0% 100%))" strokeWidth="4" />
                {/* Labels */}
                <text x="40" y="50" fontSize="14" fill="currentColor" opacity="0.5">SALA 01</text>
                <text x="300" y="50" fontSize="14" fill="currentColor" opacity="0.5">CORREDOR</text>
                <text x="560" y="50" fontSize="14" fill="currentColor" opacity="0.5">SALA 02</text>
                <text x="40" y="330" fontSize="14" fill="currentColor" opacity="0.5">DEPÓSITO</text>
                <text x="300" y="410" fontSize="14" fill="currentColor" opacity="0.5">RECEPÇÃO</text>
                <text x="560" y="280" fontSize="14" fill="currentColor" opacity="0.5">COZINHA</text>
              </svg>

              {/* Pins */}
              {pins.map((e, i) => {
                const { top, left } = coordsFor(e.id, i);
                const s = statusFor(e);
                const isActive = active === e.id;
                return (
                  <div
                    key={e.id}
                    className="absolute -translate-x-1/2 -translate-y-1/2 group"
                    style={{ top, left }}
                  >
                    <button
                      type="button"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        setActive(isActive ? null : e.id);
                      }}
                      className={cn(
                        "size-4 rounded-full ring-4 ring-offset-1 ring-offset-background animate-pulse hover:scale-110 transition-transform",
                        pinColor(s),
                      )}
                      aria-label={`Extintor ${e.codigo}`}
                    />
                    <div
                      className={cn(
                        "absolute z-10 left-1/2 -translate-x-1/2 mt-2 w-48 rounded-lg border border-border bg-popover text-popover-foreground shadow-lg p-3 text-xs space-y-1 pointer-events-none",
                        "opacity-0 group-hover:opacity-100 transition-opacity",
                        isActive && "opacity-100",
                      )}
                    >
                      <p className="font-bold text-sm">{e.codigo}</p>
                      <p className="text-muted-foreground">{e.tipo}</p>
                      <p className="break-words">{e.localizacao || `${e.setor} · ${e.predio ?? ""}`}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-2"><span className="size-3 rounded-full bg-green-500" /> Em conformidade</span>
            <span className="flex items-center gap-2"><span className="size-3 rounded-full bg-yellow-400" /> Vence em 30 dias</span>
            <span className="flex items-center gap-2"><span className="size-3 rounded-full bg-red-500" /> Vencido</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}