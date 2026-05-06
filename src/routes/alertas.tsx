import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/fireguard/AppShell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/fireguard/auth";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { BellRing, Plus, Pencil, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Alerta = Database["public"]["Tables"]["alertas"]["Row"];

export const Route = createFileRoute("/alertas")({
  head: () => ({ meta: [{ title: "Alertas — FireGuard" }] }),
  component: AlertasPage,
});

async function listAlertas(): Promise<Alerta[]> {
  const { data, error } = await supabase.from("alertas").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

function AlertasPage() {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && profile && profile.role !== "admin") navigate({ to: "/empresas" });
  }, [profile, loading, navigate]);

  const qc = useQueryClient();
  const { data: alertas = [], isLoading } = useQuery({ queryKey: ["alertas"], queryFn: listAlertas });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Alerta | null>(null);
  const [form, setForm] = useState({ titulo: "", mensagem: "", prioridade: "media" });

  const reset = () => { setEditing(null); setForm({ titulo: "", mensagem: "", prioridade: "media" }); };

  const save = useMutation({
    mutationFn: async () => {
      if (!form.titulo.trim() || !form.mensagem.trim()) throw new Error("Preencha título e mensagem");
      if (editing) {
        const { error } = await supabase.from("alertas").update({ titulo: form.titulo, mensagem: form.mensagem, prioridade: form.prioridade }).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("alertas").insert({ titulo: form.titulo, mensagem: form.mensagem, prioridade: form.prioridade });
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["alertas"] }); toast.success(editing ? "Alerta atualizado" : "Alerta criado"); setOpen(false); reset(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async (a: Alerta) => {
      const { error } = await supabase.from("alertas").update({ resolvido: !a.resolvido }).eq("id", a.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alertas"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("alertas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["alertas"] }); toast.success("Alerta removido"); },
  });

  const openEdit = (a: Alerta) => {
    setEditing(a);
    setForm({ titulo: a.titulo, mensagem: a.mensagem, prioridade: a.prioridade });
    setOpen(true);
  };

  return (
    <AppShell>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-2">
            <BellRing className="size-3" /> Operacional
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Alertas</h1>
          <p className="text-sm text-muted-foreground mt-1">{alertas.length} registros · gerencie criação, edição e baixa</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
          <DialogTrigger asChild>
            <Button className="h-11 bg-security hover:bg-security/90 text-security-foreground"><Plus className="size-4" /> Novo Alerta</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Editar alerta" : "Novo alerta"}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Mensagem</Label>
                <Textarea value={form.mensagem} onChange={(e) => setForm({ ...form, mensagem: e.target.value })} rows={4} />
              </div>
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select value={form.prioridade} onValueChange={(v) => setForm({ ...form, prioridade: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setOpen(false); reset(); }}>Cancelar</Button>
              <Button onClick={() => save.mutate()} disabled={save.isPending} className="bg-security hover:bg-security/90 text-security-foreground">
                {save.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {isLoading && <div className="text-sm text-muted-foreground">Carregando...</div>}
        {!isLoading && alertas.length === 0 && (
          <div className="bg-card border border-border rounded-2xl p-8 text-center text-sm text-muted-foreground shadow-soft">
            Nenhum alerta criado. Use "Novo Alerta" para começar.
          </div>
        )}
        {alertas.map((a) => {
          const cor = a.prioridade === "alta" ? "border-l-security" : a.prioridade === "media" ? "border-l-alert" : "border-l-safe";
          return (
            <div key={a.id} className={`bg-card border border-border border-l-4 ${cor} rounded-xl p-4 shadow-soft flex flex-col md:flex-row md:items-center gap-4`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className={`font-semibold ${a.resolvido ? "line-through text-muted-foreground" : ""}`}>{a.titulo}</p>
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-secondary text-muted-foreground">{a.prioridade}</span>
                  {a.resolvido && <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-safe/15 text-safe">Resolvido</span>}
                </div>
                <p className="text-sm text-muted-foreground">{a.mensagem}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" title={a.resolvido ? "Reabrir" : "Marcar como resolvido"} onClick={() => toggle.mutate(a)}>
                  <CheckCircle2 className={`size-4 ${a.resolvido ? "text-safe" : ""}`} />
                </Button>
                <Button variant="ghost" size="icon" title="Editar" onClick={() => openEdit(a)}><Pencil className="size-4" /></Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-security hover:text-security hover:bg-security/10"><Trash2 className="size-4" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Remover alerta?</AlertDialogTitle><AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => remove.mutate(a.id)} className="bg-security hover:bg-security/90 text-security-foreground">Remover</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}