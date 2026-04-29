import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/fireguard/AppShell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listExtintores, deleteExtintor, getExtintorByCodigo, statusFor } from "@/lib/fireguard/services";
import { useAuth } from "@/lib/fireguard/auth";
import { useMemo, useState } from "react";
import { Plus, QrCode, Search, Pencil, Trash2, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/fireguard/StatusBadge";
import { QrScanner } from "@/components/fireguard/QrScanner";
import { format } from "date-fns";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/inventario")({
  head: () => ({ meta: [{ title: "Inventário — FireGuard" }] }),
  component: InventarioPage,
});

function InventarioPage() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: extintores = [], isLoading } = useQuery({ queryKey: ["extintores"], queryFn: listExtintores });
  const remove = useMutation({
    mutationFn: (id: string) => deleteExtintor(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["extintores"] }); toast.success("Extintor removido"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const [q, setQ] = useState("");
  const [tipo, setTipo] = useState("todos");
  const [setor, setSetor] = useState("todos");
  const [statusF, setStatusF] = useState("todos");
  const [scanOpen, setScanOpen] = useState(false);

  const setores = useMemo(() => Array.from(new Set(extintores.map((e) => e.setor))), [extintores]);
  const list = useMemo(() => {
    return extintores.filter((e) => {
      if (q && !`${e.codigo} ${e.fabricante ?? ""} ${e.setor}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (tipo !== "todos" && e.tipo !== tipo) return false;
      if (setor !== "todos" && e.setor !== setor) return false;
      if (statusF !== "todos") {
        const s = statusFor(e);
        if (statusF === "vencidos" && s !== "vencido") return false;
        if (statusF === "vencendo" && !["vencendo7", "vencendo15", "vencendo30"].includes(s)) return false;
        if (statusF === "ok" && s !== "ok") return false;
      }
      return true;
    });
  }, [extintores, q, tipo, setor, statusF]);

  const onScanned = async (code: string) => {
    setScanOpen(false);
    const found = await getExtintorByCodigo(code);
    if (found) {
      toast.success(`Extintor ${code} encontrado`);
      navigate({ to: "/cadastro/$id", params: { id: found.id } });
    } else {
      if (!isAdmin) { toast.error(`Código ${code} não cadastrado. Peça a um admin.`); return; }
      toast.info(`Código ${code} não encontrado — cadastrando novo`);
      navigate({ to: "/cadastro/$id", params: { id: "novo" }, search: { codigo: code } as never });
    }
  };

  return (
    <AppShell>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">Patrimônio</p>
          <h1 className="text-3xl font-semibold tracking-tight">Inventário de Extintores</h1>
          <p className="text-sm text-muted-foreground mt-1">{list.length} de {extintores.length} ativos</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" onClick={() => setScanOpen(true)} className="h-11">
            <QrCode className="size-4" /> Escanear Extintor
          </Button>
          {isAdmin && (
            <Button onClick={() => navigate({ to: "/cadastro/$id", params: { id: "novo" } })} className="h-11 bg-carbon hover:bg-carbon/90 text-carbon-foreground">
              <Plus className="size-4" /> Cadastrar Novo
            </Button>
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-soft p-4 md:p-5 mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por código, fabricante, setor..." className="pl-9 h-10" />
        </div>
        <Select value={tipo} onValueChange={setTipo}>
          <SelectTrigger className="h-10"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            <SelectItem value="CO2">CO2</SelectItem>
            <SelectItem value="PQS">PQS</SelectItem>
            <SelectItem value="Água">Água</SelectItem>
            <SelectItem value="Espuma">Espuma</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusF} onValueChange={setStatusF}>
          <SelectTrigger className="h-10"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            <SelectItem value="vencidos">Vencidos</SelectItem>
            <SelectItem value="vencendo">Vencendo (≤30d)</SelectItem>
            <SelectItem value="ok">Conformes</SelectItem>
          </SelectContent>
        </Select>
        <Select value={setor} onValueChange={setSetor}>
          <SelectTrigger className="h-10 md:col-span-2"><SelectValue placeholder="Setor" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os setores</SelectItem>
            {setores.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop */}
      <div className="hidden md:block bg-card border border-border rounded-2xl overflow-hidden shadow-soft">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider border-b border-border bg-secondary/30">
              <th className="px-6 py-3 font-medium">Código</th>
              <th className="px-6 py-3 font-medium">Tipo / Classe</th>
              <th className="px-6 py-3 font-medium">Localização</th>
              <th className="px-6 py-3 font-medium">Validade</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {list.map((e) => (
              <tr key={e.id} className="hover:bg-secondary/30 transition-colors">
                <td className="px-6 py-4 text-sm font-mono font-medium">{e.codigo}</td>
                <td className="px-6 py-4">
                  <p className="text-sm font-semibold">{e.tipo}</p>
                  <p className="text-xs text-muted-foreground">Classe {e.classes.join("/")}</p>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{e.setor} · {e.predio}, {e.andar}</td>
                <td className="px-6 py-4 text-sm tabular-nums">{format(new Date(e.validade_carga), "dd/MM/yyyy")}</td>
                <td className="px-6 py-4"><StatusBadge status={statusFor(e)} /></td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" title="Nova inspeção" onClick={() => navigate({ to: "/inspecao", search: { id: e.id } as never })}>
                      <ClipboardCheck className="size-4" />
                    </Button>
                    {isAdmin && (
                      <>
                        <Button variant="ghost" size="icon" title="Editar" onClick={() => navigate({ to: "/cadastro/$id", params: { id: e.id } })}>
                          <Pencil className="size-4" />
                        </Button>
                        <DeleteBtn onConfirm={() => remove.mutate(e.id)} />
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan={6} className="text-center py-12 text-muted-foreground text-sm">{isLoading ? "Carregando..." : "Nenhum extintor cadastrado."}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="md:hidden space-y-3">
        {list.map((e) => (
          <div key={e.id} className="bg-card border border-border rounded-xl p-4 shadow-soft">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="font-mono text-xs text-muted-foreground">{e.codigo}</p>
                <p className="font-semibold">{e.tipo} · Classe {e.classes.join("/")}</p>
              </div>
              <StatusBadge status={statusFor(e)} />
            </div>
            <div className="text-xs text-muted-foreground space-y-1 mb-4">
              <p>{e.setor} · {e.predio}, {e.andar}</p>
              <p>Validade: <span className="font-mono">{format(new Date(e.validade_carga), "dd/MM/yyyy")}</span></p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => navigate({ to: "/inspecao", search: { id: e.id } as never })}>
                <ClipboardCheck className="size-3.5" /> Inspecionar
              </Button>
              {isAdmin && (
                <>
                  <Button size="sm" variant="outline" onClick={() => navigate({ to: "/cadastro/$id", params: { id: e.id } })}><Pencil className="size-3.5" /></Button>
                  <DeleteBtn onConfirm={() => remove.mutate(e.id)} />
                </>
              )}
            </div>
          </div>
        ))}
        {list.length === 0 && <div className="text-center py-12 text-muted-foreground text-sm">{isLoading ? "Carregando..." : "Nenhum extintor cadastrado."}</div>}
      </div>

      <QrScanner open={scanOpen} onClose={() => setScanOpen(false)} onDetected={onScanned} />
    </AppShell>
  );
}

function DeleteBtn({ onConfirm }: { onConfirm: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-security hover:text-security hover:bg-security/10"><Trash2 className="size-4" /></Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover extintor?</AlertDialogTitle>
          <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-security hover:bg-security/90 text-security-foreground">Remover</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}