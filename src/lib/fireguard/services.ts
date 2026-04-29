import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type ExtintorRow = Database["public"]["Tables"]["extintores"]["Row"];
export type ExtintorInsert = Database["public"]["Tables"]["extintores"]["Insert"];
export type InspecaoRow = Database["public"]["Tables"]["inspecoes"]["Row"];

export type ChecklistItem = { key: string; label: string; conforme: boolean };

export type ExtStatusBadge =
  | "vencido"
  | "vencendo7"
  | "vencendo15"
  | "vencendo30"
  | "ok"
  | "manutencao"
  | "descartado";

export function daysUntil(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function statusFor(e: ExtintorRow): ExtStatusBadge {
  if (e.status === "Descartado") return "descartado";
  if (e.status === "Em Manutenção") return "manutencao";
  const d = daysUntil(e.validade_carga);
  if (d < 0) return "vencido";
  if (d <= 7) return "vencendo7";
  if (d <= 15) return "vencendo15";
  if (d <= 30) return "vencendo30";
  return "ok";
}

export async function listExtintores() {
  const { data, error } = await supabase
    .from("extintores")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getExtintor(id: string) {
  const { data, error } = await supabase
    .from("extintores")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getExtintorByCodigo(codigo: string) {
  const { data, error } = await supabase
    .from("extintores")
    .select("*")
    .eq("codigo", codigo)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertExtintor(payload: ExtintorInsert) {
  const { data, error } = await supabase
    .from("extintores")
    .upsert(payload, { onConflict: "id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteExtintor(id: string) {
  const { error } = await supabase.from("extintores").delete().eq("id", id);
  if (error) throw error;
}

export async function listInspecoes(extintorId?: string) {
  let q = supabase.from("inspecoes").select("*").order("data", { ascending: false });
  if (extintorId) q = q.eq("extintor_id", extintorId);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function createInspecao(input: {
  extintor_id: string;
  inspetor_id: string;
  inspetor_nome: string;
  itens: ChecklistItem[];
  observacoes: string;
  conforme: boolean;
}) {
  const { data, error } = await supabase
    .from("inspecoes")
    .insert({
      extintor_id: input.extintor_id,
      inspetor_id: input.inspetor_id,
      inspetor_nome: input.inspetor_nome,
      itens: input.itens,
      observacoes: input.observacoes,
      conforme: input.conforme,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export const CHECKLIST_ITEMS = [
  { key: "lacre", label: "Lacre intacto?" },
  { key: "manometro", label: "Manômetro na faixa verde?" },
  { key: "acesso", label: "Acesso desobstruído?" },
  { key: "sinalizacao", label: "Sinalização correta e visível?" },
  { key: "mangueira", label: "Mangueira/Bico em bom estado?" },
] as const;