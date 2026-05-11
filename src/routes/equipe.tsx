import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/fireguard/AppShell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listTeam, listEmpresas, updateMemberRole, type TeamMember } from "@/lib/fireguard/services";
import { supabase } from "@/integrations/supabase/client";
import { Users, Plus, Mail, Building2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/equipe")({
  head: () => ({ meta: [{ title: "Equipe — FireGuard" }] }),
  component: EquipePage,
});

const ROLE_STYLES: Record<string, string> = {
  admin: "bg-security/10 text-security ring-security/20",
  subadmin: "bg-alert/15 text-alert ring-alert/20",
  inspetor: "bg-safe/10 text-safe ring-safe/20",
};
const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  subadmin: "Subadmin",
  inspetor: "Inspetor",
};

function RoleBadge({ role }: { role: string | null }) {
  if (!role) return <span className="text-xs text-muted-foreground">Sem nível</span>;
  return (
    <span className={cn("inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset", ROLE_STYLES[role])}>
      {ROLE_LABEL[role]}
    </span>
  );
}

function EquipePage() {
  const qc = useQueryClient();
  const { data: team = [], isLoading } = useQuery({ queryKey: ["team"], queryFn: listTeam });
  const { data: empresas = [] } = useQuery({ queryKey: ["empresas"], queryFn: listEmpresas });

  const [openNew, setOpenNew] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [form, setForm] = useState({ nome: "", email: "", senha: "", role: "inspetor" as "admin" | "subadmin" | "inspetor", empresa_id: "" });

  const empresaName = (id?: string | null) => empresas.find((e) => e.id === id)?.nome ?? "—";

  const create = useMutation({
    mutationFn: async () => {
      if (!form.email || !form.senha || !form.nome) throw new Error("Preencha nome, e-mail e senha");
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.senha,
        options: { data: { nome: form.nome } },
      });
      if (error) throw error;
      const userId = data.user?.id;
      if (userId) {
        await updateMemberRole(userId, form.role, form.empresa_id || null);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team"] });
      toast.success("Usuário cadastrado");
      setOpenNew(false);
      setForm({ nome: "", email: "", senha: "", role: "inspetor", empresa_id: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateRole = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      await updateMemberRole(editing.id, form.role, form.empresa_id || null);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team"] });
      toast.success("Permissões atualizadas");
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openEdit = (m: TeamMember) => {
    setEditing(m);
    setForm({ nome: m.nome, email: m.email, senha: "", role: (m.role ?? "inspetor"), empresa_id: m.empresa_id ?? "" });
  };

  return (
    <AppShell>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">Gestão</p>
          <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-3">
            <Users className="size-7 text-security" /> Membros da Equipe
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{team.length} usuário(s) cadastrados</p>
        </div>
        <Dialog open={openNew} onOpenChange={setOpenNew}>
          <DialogTrigger asChild>
            <Button className="h-11 bg-security hover:bg-security/90 text-security-foreground"><Plus className="size-4" /> Novo Usuário</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo usuário</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2"><Label>Nome</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
              <div className="space-y-2"><Label>E-mail</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div className="space-y-2"><Label>Senha provisória</Label><Input type="password" value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>Nível de acesso</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as typeof form.role })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="subadmin">Subadmin</SelectItem>
                    <SelectItem value="inspetor">Inspetor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Empresa vinculada</Label>
                <Select value={form.empresa_id || "none"} onValueChange={(v) => setForm({ ...form, empresa_id: v === "none" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {empresas.map((e) => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenNew(false)}>Cancelar</Button>
              <Button onClick={() => create.mutate()} disabled={create.isPending} className="bg-security hover:bg-security/90 text-security-foreground">
                {create.isPending ? "Salvando..." : "Cadastrar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && <div className="text-sm text-muted-foreground">Carregando...</div>}
      {!isLoading && team.length === 0 && (
        <div className="bg-card border border-border rounded-2xl p-8 text-center text-sm text-muted-foreground shadow-soft">
          Nenhum membro cadastrado ainda.
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {team.map((m) => (
          <div key={m.id} className="bg-card border border-border rounded-xl p-5 shadow-soft flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold truncate">{m.nome}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1 break-all"><Mail className="size-3 shrink-0" /> {m.email}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => openEdit(m)} title="Editar nível"><Pencil className="size-4" /></Button>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
              <RoleBadge role={m.role} />
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Building2 className="size-3" /> {empresaName(m.empresa_id)}</span>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar permissões — {editing?.nome}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nível de acesso</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as typeof form.role })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="subadmin">Subadmin</SelectItem>
                  <SelectItem value="inspetor">Inspetor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Empresa vinculada</Label>
              <Select value={form.empresa_id || "none"} onValueChange={(v) => setForm({ ...form, empresa_id: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {empresas.map((e) => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={() => updateRole.mutate()} disabled={updateRole.isPending} className="bg-security hover:bg-security/90 text-security-foreground">
              {updateRole.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}