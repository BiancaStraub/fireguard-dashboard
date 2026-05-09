import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type ExtintorRow = Database["public"]["Tables"]["extintores"]["Row"];
export type ExtintorInsert = Database["public"]["Tables"]["extintores"]["Insert"];
export type InspecaoRow = Database["public"]["Tables"]["inspecoes"]["Row"];
export type EmpresaRow = Database["public"]["Tables"]["empresas"]["Row"];

export type ChecklistItem = { key: string; label: string; conforme: boolean };
export type Anexo = { name: string; url: string; type?: string };

export type ExtStatusBadge =
  | "vencido"
  | "vencendo7"
  | "vencendo15"
  | "vencendo30"
  | "ok"
  | "manutencao"
  | "descartado";

export function parseDateBR(input: string | null | undefined): Date | null {
  if (!input) return null;
  // ISO format YYYY-MM-DD
  const iso = input.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return new Date(Date.UTC(+iso[1], +iso[2] - 1, +iso[3]));
  // BR format DD/MM/YYYY or DD-MM-YYYY
  const dmy = input.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (dmy) {
    let y = parseInt(dmy[3]);
    if (y < 100) y += 2000;
    return new Date(Date.UTC(y, parseInt(dmy[2]) - 1, parseInt(dmy[1])));
  }
  const fallback = new Date(input);
  return isNaN(fallback.getTime()) ? null : fallback;
}

export function daysUntil(input: string) {
  const target = parseDateBR(input);
  if (!target) return 0;
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const ms = target.getTime() - today;
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function statusFor(e: ExtintorRow): ExtStatusBadge {
  if (e.status === "Descartado") return "descartado";
  if (e.status === "Em Manutenção") return "manutencao";
  // Use teste_hidrostatico (Vencimento TH) when available; fallback to validade_carga
  const ref = e.teste_hidrostatico ?? e.validade_carga;
  const d = daysUntil(ref);
  if (d < 0) return "vencido";
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

export async function listExtintoresByEmpresa(empresaId: string) {
  const { data, error } = await supabase
    .from("extintores")
    .select("*")
    .eq("empresa_id", empresaId)
    .order("codigo", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listEmpresas() {
  const { data, error } = await supabase
    .from("empresas")
    .select("*")
    .order("nome", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getEmpresa(id: string) {
  const { data, error } = await supabase
    .from("empresas")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function countExtintoresPorEmpresa() {
  const { data, error } = await supabase.from("extintores").select("empresa_id");
  if (error) throw error;
  const map = new Map<string, number>();
  for (const r of data ?? []) {
    if (!r.empresa_id) continue;
    map.set(r.empresa_id, (map.get(r.empresa_id) ?? 0) + 1);
  }
  return map;
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
  fotos?: string[];
  anexos?: Anexo[];
  acao?: string;
  pecas?: string;
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
      fotos: input.fotos ?? [],
      anexos: (input.anexos ?? []) as unknown as Database["public"]["Tables"]["inspecoes"]["Insert"]["anexos"],
      acao: input.acao ?? "Inspecionado",
      pecas: input.pecas ?? null,
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

// ===================== Storage helpers =====================

export async function uploadAnexo(file: File, prefix = "anexos"): Promise<Anexo> {
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("anexos").upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from("anexos").getPublicUrl(path);
  return { name: file.name, url: data.publicUrl, type: file.type };
}

// ===================== Equipe / RBAC =====================

export type TeamMember = {
  id: string;
  nome: string;
  email: string;
  empresa_id: string | null;
  role: "admin" | "subadmin" | "inspetor" | null;
};

export async function listTeam(): Promise<TeamMember[]> {
  const { data: profs, error } = await supabase
    .from("profiles")
    .select("id, nome, email, empresa_id")
    .order("nome");
  if (error) throw error;
  const { data: roles } = await supabase.from("user_roles").select("user_id, role");
  const roleMap = new Map((roles ?? []).map((r) => [r.user_id, r.role as TeamMember["role"]]));
  return (profs ?? []).map((p) => ({
    id: p.id,
    nome: p.nome,
    email: p.email,
    empresa_id: (p as { empresa_id?: string | null }).empresa_id ?? null,
    role: roleMap.get(p.id) ?? null,
  }));
}

export async function updateMemberRole(userId: string, role: "admin" | "subadmin" | "inspetor", empresaId: string | null) {
  await supabase.from("user_roles").delete().eq("user_id", userId);
  const { error: rErr } = await supabase.from("user_roles").insert({ user_id: userId, role });
  if (rErr) throw rErr;
  const { error: pErr } = await supabase.from("profiles").update({ empresa_id: empresaId }).eq("id", userId);
  if (pErr) throw pErr;
}