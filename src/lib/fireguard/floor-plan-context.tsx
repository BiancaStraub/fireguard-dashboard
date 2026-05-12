import { createContext, useContext, useState, type ReactNode } from "react";

type Ctx = {
  open: boolean;
  empresaId?: string;
  openPlanta: (empresaId?: string) => void;
  setOpen: (open: boolean) => void;
};

const FloorPlanCtx = createContext<Ctx | null>(null);

export function FloorPlanProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [empresaId, setEmpresaId] = useState<string | undefined>(undefined);
  const openPlanta = (id?: string) => {
    setEmpresaId(id);
    setOpen(true);
  };
  return (
    <FloorPlanCtx.Provider value={{ open, empresaId, openPlanta, setOpen }}>
      {children}
    </FloorPlanCtx.Provider>
  );
}

export function useFloorPlan() {
  const ctx = useContext(FloorPlanCtx);
  if (!ctx) throw new Error("useFloorPlan must be used within FloorPlanProvider");
  return ctx;
}
