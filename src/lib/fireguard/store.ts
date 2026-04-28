import { create } from "zustand";
import { seedExtintores, seedInspecoes } from "./data";
import type { Extintor, Inspecao, User } from "./types";

function daysUntil(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export type ExtStatusBadge = "vencido" | "vencendo7" | "vencendo15" | "vencendo30" | "ok" | "manutencao" | "descartado";

export function statusFor(e: Extintor): ExtStatusBadge {
  if (e.status === "Descartado") return "descartado";
  if (e.status === "Em Manutenção") return "manutencao";
  const d = daysUntil(e.validadeCarga);
  if (d < 0) return "vencido";
  if (d <= 7) return "vencendo7";
  if (d <= 15) return "vencendo15";
  if (d <= 30) return "vencendo30";
  return "ok";
}

interface AppState {
  user: User | null;
  extintores: Extintor[];
  inspecoes: Inspecao[];
  login: (email: string, password: string) => User | null;
  logout: () => void;
  upsertExtintor: (e: Extintor) => void;
  removeExtintor: (id: string) => void;
  addInspecao: (i: Inspecao) => void;
}

export const useApp = create<AppState>((set, get) => ({
  user: null,
  extintores: seedExtintores,
  inspecoes: seedInspecoes,
  login: (email) => {
    const role = email.toLowerCase().includes("inspetor") ? "inspetor" : "admin";
    const user: User = {
      id: "u1",
      nome: role === "admin" ? "Administrador" : "Inspetor de Campo",
      email,
      role,
    };
    set({ user });
    return user;
  },
  logout: () => set({ user: null }),
  upsertExtintor: (e) => {
    const existing = get().extintores.find((x) => x.id === e.id);
    if (existing) {
      set({ extintores: get().extintores.map((x) => (x.id === e.id ? e : x)) });
    } else {
      set({ extintores: [...get().extintores, e] });
    }
  },
  removeExtintor: (id) => set({ extintores: get().extintores.filter((x) => x.id !== id) }),
  addInspecao: (i) => set({ inspecoes: [i, ...get().inspecoes] }),
}));

export { daysUntil };