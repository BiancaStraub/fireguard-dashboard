import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { MapPin, ExternalLink } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { statusFor, type ExtintorRow, type EmpresaRow } from "@/lib/fireguard/services";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresas: EmpresaRow[];
  extintores: ExtintorRow[];
  initialEmpresaId?: string;
};

// Background images per company prefix (isometric / floor plan placeholders)
const PLANTA_BG: Record<string, string> = {
  CAS: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80",
  CED: "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1600&q=80",
  ICS: "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?auto=format&fit=crop&w=1600&q=80",
  SPC: "https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?auto=format&fit=crop&w=1600&q=80",
  HSL: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=1600&q=80",
};

function bgFor(empresa: EmpresaRow | undefined, fallbackCodigo?: string) {
  const prefix = (fallbackCodigo ?? "").split("-")[0];
  if (PLANTA_BG[prefix]) return PLANTA_BG[prefix];
  // try to infer from nome
  const nome = (empresa?.nome ?? "").toLowerCase();
  if (nome.includes("hospital")) return PLANTA_BG.HSL;
  if (nome.includes("shopping")) return PLANTA_BG.SPC;
  if (nome.includes("indúst") || nome.includes("indust")) return PLANTA_BG.ICS;
  if (nome.includes("colég") || nome.includes("coleg") || nome.includes("educ")) return PLANTA_BG.CED;
  return PLANTA_BG.CAS;
}

function coordsFor(id: string, idx: number) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const top = 10 + ((h + idx * 53) % 80);
  const left = 6 + (((h >> 3) + idx * 97) % 88);
  return { top: `${top}%`, left: `${left}%` };
}

function pinClasses(s: ReturnType<typeof statusFor>) {
  if (s === "vencido") return "bg-red-500 text-white ring-red-300";
  if (s === "vencendo30" || s === "vencendo15" || s === "vencendo7")
    return "bg-yellow-400 text-black ring-yellow-200";
  if (s === "ok") return "bg-green-500 text-white ring-green-300";
  return "bg-muted-foreground text-white ring-border";
}

export function FloorPlanModal({ open, onOpenChange, empresas, extintores, initialEmpresaId }: Props) {
  const navigate = useNavigate();
  const [empresaId, setEmpresaId] = useState<string>(initialEmpresaId ?? empresas[0]?.id ?? "");
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setEmpresaId(initialEmpresaId ?? empresas[0]?.id ?? "");
      setActive(null);
    }
  }, [open, initialEmpresaId, empresas]);

  const empresa = useMemo(() => empresas.find((e) => e.id === empresaId), [empresas, empresaId]);
  const pins = useMemo(
    () => extintores.filter((e) => e.empresa_id === empresaId).slice(0, 40),
    [extintores, empresaId],
  );
  const bg = bgFor(empresa, pins[0]?.codigo);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[96vw] p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border">
          <DialogTitle className="text-base md:text-lg flex items-center gap-2">
            <MapPin className="size-4 text-security" />
            Mapa Interativo — Planta do Local
          </DialogTitle>
        </DialogHeader>

        <div className="p-3 md:p-5 space-y-4">
          {/* Empresa selector */}
          {empresas.length > 0 && (
            <Tabs value={empresaId} onValueChange={setEmpresaId}>
              <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/60 p-1">
                {empresas.map((e) => (
                  <TabsTrigger key={e.id} value={e.id} className="text-xs md:text-sm">
                    {e.nome}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}

          {/* Floor plan canvas */}
          <div className="rounded-xl border border-border bg-muted/30 overflow-auto md:overflow-hidden max-h-[65vh]">
            <div
              className="relative mx-auto"
              style={{ width: "100%", minWidth: 640, aspectRatio: "16 / 10" }}
              onClick={() => setActive(null)}
            >
              <img
                src={bg}
                alt={`Planta baixa — ${empresa?.nome ?? ""}`}
                className="absolute inset-0 w-full h-full object-cover opacity-90"
                draggable={false}
              />
              <div className="absolute inset-0 bg-background/30" />

              {pins.map((e, i) => {
                const { top, left } = coordsFor(e.id, i);
                const s = statusFor(e);
                const isActive = active === e.id;
                return (
                  <div
                    key={e.id}
                    className="absolute -translate-x-1/2 -translate-y-full group"
                    style={{ top, left }}
                  >
                    <button
                      type="button"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        setActive(isActive ? null : e.id);
                      }}
                      className={cn(
                        "relative flex items-center justify-center size-7 rounded-full ring-4 ring-offset-2 ring-offset-background shadow-lg hover:scale-110 transition-transform",
                        pinClasses(s),
                      )}
                      aria-label={`Extintor ${e.codigo}`}
                    >
                      <MapPin className="size-4" strokeWidth={2.5} />
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 size-2 rotate-45 bg-inherit" />
                    </button>

                    <div
                      className={cn(
                        "absolute z-20 left-1/2 -translate-x-1/2 mt-3 w-56 rounded-lg border border-border bg-popover text-popover-foreground shadow-xl p-3 text-xs space-y-2",
                        "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity",
                        isActive && "opacity-100 pointer-events-auto",
                      )}
                      onClick={(ev) => ev.stopPropagation()}
                    >
                      <div>
                        <p className="font-bold text-sm">{e.codigo}</p>
                        <p className="text-muted-foreground">{e.tipo}</p>
                      </div>
                      <p className="break-words text-foreground/80">
                        {e.localizacao || `${e.setor}${e.predio ? ` · ${e.predio}` : ""}`}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full h-7 text-xs gap-1"
                        onClick={() => {
                          onOpenChange(false);
                          navigate({ to: "/cadastro/$id", params: { id: e.id } });
                        }}
                      >
                        <ExternalLink className="size-3" /> Ver Detalhes
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-2"><span className="size-3 rounded-full bg-green-500" /> Em conformidade</span>
              <span className="flex items-center gap-2"><span className="size-3 rounded-full bg-yellow-400" /> Vence em 30 dias</span>
              <span className="flex items-center gap-2"><span className="size-3 rounded-full bg-red-500" /> Vencido</span>
            </div>
            <span className="tabular-nums">{pins.length} extintor(es) plotado(s)</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
