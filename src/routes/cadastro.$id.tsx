import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/fireguard/AppShell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getExtintor, upsertExtintor, listInspecoes, createInspecao, type ExtintorInsert } from "@/lib/fireguard/services";
import { listEmpresas } from "@/lib/fireguard/services";
import { EmpresaFormDialog } from "@/components/fireguard/EmpresaFormDialog";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, CalendarIcon, MapPin, FileText, Plus, ClipboardList, ShieldCheck, Building2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from "@/components/fireguard/FileUpload";
import type { Anexo } from "@/lib/fireguard/services";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { z } from "zod";
import { useAuth } from "@/lib/fireguard/auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";

const searchSchema = z.object({ codigo: z.string().optional() });

export const Route = createFileRoute("/cadastro/$id")({
  head: () => ({ meta: [{ title: "Cadastro de Extintor — FireGuard" }] }),
  validateSearch: (s) => searchSchema.parse(s),
  component: CadastroPage,
});

const CLASSES = ["A", "B", "C", "K"];

function todayPlus(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function CadastroPage() {
  const { id } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isNew = id === "novo";
  const { profile, loading } = useAuth();

  useEffect(() => {
    if (!loading && profile && profile.role !== "admin") {
      toast.error("Acesso restrito a administradores.");
      navigate({ to: "/inventario" });
    }
  }, [profile, loading, navigate]);

  const { data: existing } = useQuery({
    queryKey: ["extintor", id],
    queryFn: () => getExtintor(id),
    enabled: !isNew,
  });

  const [form, setForm] = useState<ExtintorInsert>({
    codigo: search.codigo ?? "",
    tipo: "PQS",
    classes: ["A", "B", "C"],
    fabricante: "",
    status: "Ativo",
    predio: "",
    andar: "",
    setor: "",
    validade_carga: todayPlus(365),
    teste_hidrostatico: todayPlus(5 * 365),
    altura_cm: 150,
  });
  const [fotos, setFotos] = useState<Anexo[]>([]);

  const { data: empresas = [] } = useQuery({ queryKey: ["empresas"], queryFn: listEmpresas });

  useEffect(() => {
    if (existing) {
      setForm({
        id: existing.id,
        codigo: existing.codigo,
        tipo: existing.tipo,
        classes: existing.classes,
        fabricante: existing.fabricante,
        status: existing.status,
        predio: existing.predio,
        andar: existing.andar,
        setor: existing.setor,
        validade_carga: existing.validade_carga,
        teste_hidrostatico: existing.teste_hidrostatico,
        altura_cm: existing.altura_cm,
        observacoes: existing.observacoes,
        fotos: existing.fotos,
        empresa_id: existing.empresa_id,
      });
      setFotos((existing.fotos ?? []).map((url) => ({ name: url.split("/").pop() ?? "foto", url })));
    }
  }, [existing]);

  const save = useMutation({
    mutationFn: () => upsertExtintor({ ...form, fotos: fotos.map((f) => f.url) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["extintores"] });
      toast.success(isNew ? "Extintor cadastrado!" : "Extintor atualizado!");
      navigate({ to: "/inventario" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const set = <K extends keyof ExtintorInsert>(k: K, v: ExtintorInsert[K]) => setForm({ ...form, [k]: v });

  const submit = () => {
    if (!form.codigo || !form.setor || !form.predio || !form.andar) {
      toast.error("Preencha código, prédio, andar e setor.");
      return;
    }
    if (!form.empresa_id) {
      toast.error("Selecione a empresa do extintor.");
      return;
    }
    save.mutate();
  };

  return (
    <AppShell>
      <button onClick={() => navigate({ to: "/inventario" })} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4">
        <ArrowLeft className="size-4" /> Voltar ao inventário
      </button>
      <div className="mb-8">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">{isNew ? "Novo Cadastro" : "Edição"}</p>
        <h1 className="text-3xl font-semibold tracking-tight">{isNew ? "Cadastrar Extintor" : `Editar ${form.codigo}`}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Section title="Equipamento" subtitle="Identificação e tipo">
          <Field label="Empresa">
            <div className="flex gap-2">
              <Select value={form.empresa_id ?? ""} onValueChange={(v) => set("empresa_id", v)}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent>
                  {empresas.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <EmpresaFormDialog
                onCreated={(empresa) => set("empresa_id", empresa.id)}
                trigger={
                  <Button type="button" variant="outline" size="icon" title="Cadastrar nova empresa">
                    <Building2 className="size-4" />
                  </Button>
                }
              />
            </div>
          </Field>
          <Field label="Código (QR / barras)">
            <Input value={form.codigo} onChange={(e) => set("codigo", e.target.value)} placeholder="FG-XXXX" className="font-mono" />
          </Field>
          <Field label="Tipo">
            <Select value={form.tipo} onValueChange={(v) => set("tipo", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="CO2">CO2</SelectItem>
                <SelectItem value="PQS">PQS</SelectItem>
                <SelectItem value="Água">Água</SelectItem>
                <SelectItem value="Espuma">Espuma</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Classe de fogo">
            <div className="flex gap-3 flex-wrap pt-1">
              {CLASSES.map((c) => {
                const checked = (form.classes ?? []).includes(c);
                return (
                  <label key={c} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) => {
                        const cur = form.classes ?? [];
                        const next = v ? [...cur, c] : cur.filter((x) => x !== c);
                        set("classes", next);
                      }}
                    />
                    <span className="text-sm font-medium">{c}</span>
                  </label>
                );
              })}
            </div>
          </Field>
          <Field label="Fabricante">
            <Input value={form.fabricante ?? ""} onChange={(e) => set("fabricante", e.target.value)} placeholder="Resil, Kidde..." />
          </Field>
          <Field label="Status">
            <Select value={form.status ?? "Ativo"} onValueChange={(v) => set("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Em Manutenção">Em Manutenção</SelectItem>
                <SelectItem value="Descartado">Descartado</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </Section>

        <Section title="Localização" subtitle="Onde está instalado">
          <Field label="Prédio"><Input value={form.predio} onChange={(e) => set("predio", e.target.value)} placeholder="Bloco A" /></Field>
          <Field label="Andar"><Input value={form.andar} onChange={(e) => set("andar", e.target.value)} placeholder="Térreo, 2º Andar..." /></Field>
          <Field label="Setor"><Input value={form.setor} onChange={(e) => set("setor", e.target.value)} placeholder="Almoxarifado, Lab Elétrica..." /></Field>
        </Section>

        <Section title="Dados Técnicos" subtitle="Validade e instalação">
          <Field label="Validade da carga">
            <DatePicker value={new Date(form.validade_carga)} onChange={(d) => set("validade_carga", d.toISOString().slice(0, 10))} />
          </Field>
          <Field label="Teste hidrostático">
            <DatePicker value={form.teste_hidrostatico ? new Date(form.teste_hidrostatico) : new Date()} onChange={(d) => set("teste_hidrostatico", d.toISOString().slice(0, 10))} />
          </Field>
          <Field label="Altura de instalação (cm)">
            <Input type="number" value={form.altura_cm ?? 150} onChange={(e) => set("altura_cm", Number(e.target.value))} />
            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
              <MapPin className="size-3" />Máximo 160cm conforme NR-23
            </p>
            {(form.altura_cm ?? 0) > 160 && <p className="text-xs text-security mt-1 font-medium">Altura excede o limite normativo!</p>}
          </Field>
        </Section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Section title="Fotos do Equipamento" subtitle="Estado físico e identificação visual">
          <FileUpload label="Adicionar foto" accept="image/*" capture="environment" prefix="extintores/fotos" values={fotos} onChange={setFotos} />
        </Section>
        <Section title="Observações Finais" subtitle="Notas técnicas, laudos, restrições">
          <Textarea
            value={form.observacoes ?? ""}
            onChange={(e) => set("observacoes", e.target.value)}
            placeholder="Notas do responsável técnico, restrições de uso, recomendações..."
            rows={6}
          />
        </Section>
      </div>

      <div className="flex justify-end gap-3 mt-8">
        <Button variant="outline" onClick={() => navigate({ to: "/inventario" })}>Cancelar</Button>
        <Button onClick={submit} disabled={save.isPending} className="bg-carbon hover:bg-carbon/90 text-carbon-foreground">{save.isPending ? "Salvando..." : isNew ? "Cadastrar" : "Salvar alterações"}</Button>
      </div>

      {!isNew && existing && (
        <HistoricoNR23 extintor={existing} />
      )}
    </AppShell>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-soft space-y-4">
      <div className="pb-4 border-b border-border">
        <h2 className="font-semibold">{title}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function DatePicker({ value, onChange }: { value: Date; onChange: (d: Date) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !value && "text-muted-foreground")}>
          <CalendarIcon className="size-4 mr-2" />
          {value ? format(value, "dd/MM/yyyy") : "Selecionar data"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={value} onSelect={(d) => d && onChange(d)} initialFocus className="p-3 pointer-events-auto" />
      </PopoverContent>
    </Popover>
  );
}

type ExtintorFull = NonNullable<Awaited<ReturnType<typeof getExtintor>>>;

function HistoricoNR23({ extintor }: { extintor: ExtintorFull }) {
  const qc = useQueryClient();
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const { data: inspecoes = [], isLoading } = useQuery({
    queryKey: ["inspecoes", extintor.id],
    queryFn: () => listInspecoes(extintor.id),
  });

  const [acao, setAcao] = useState("Inspecionado");
  const [pecas, setPecas] = useState("");
  const [obs, setObs] = useState("");
  const [fotos, setFotos] = useState<Anexo[]>([]);
  const [anexos, setAnexos] = useState<Anexo[]>([]);

  const reset = () => { setAcao("Inspecionado"); setPecas(""); setObs(""); setFotos([]); setAnexos([]); };

  const save = useMutation({
    mutationFn: () => createInspecao({
      extintor_id: extintor.id,
      inspetor_id: user!.id,
      inspetor_nome: profile?.nome ?? user!.email ?? "Técnico",
      itens: [],
      observacoes: obs,
      conforme: acao !== "Reparado",
      fotos: fotos.map((f) => f.url),
      anexos,
      acao,
      pecas: pecas || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inspecoes", extintor.id] });
      toast.success("Registro adicionado ao histórico");
      reset();
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const exportarPDF = () => {
    const win = window.open("", "_blank", "width=900,height=1100");
    if (!win) { toast.error("Pop-up bloqueado"); return; }
    const rows = inspecoes.map((i) => `
      <tr>
        <td>${format(new Date(i.data), "dd/MM/yyyy HH:mm")}</td>
        <td>${(i as { acao?: string }).acao ?? "Inspecionado"}</td>
        <td>${(i as { pecas?: string | null }).pecas ?? "—"}</td>
        <td>${i.inspetor_nome}</td>
        <td>${i.conforme ? "Conforme" : "Não conforme"}</td>
      </tr>`).join("");
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"/><title>Ficha NR-23 — ${extintor.codigo}</title>
      <style>
        @page { size: A4; margin: 18mm; }
        body { font-family: 'Times New Roman', Georgia, serif; color:#111; margin:0; }
        .header { border-bottom: 3px double #111; padding-bottom: 12px; margin-bottom: 18px; }
        .header h1 { margin:0; font-size: 20px; letter-spacing: 1px; text-transform: uppercase; }
        .header p { margin: 4px 0 0; font-size: 12px; color:#444; }
        .meta { display:grid; grid-template-columns: 1fr 1fr; gap: 6px 18px; font-size: 12px; margin-bottom: 18px; }
        .meta b { display:inline-block; min-width:130px; }
        h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; border-bottom:1px solid #111; padding-bottom:4px; margin: 20px 0 10px; }
        table { width:100%; border-collapse: collapse; font-size: 11px; }
        th, td { border: 1px solid #333; padding: 6px 8px; text-align: left; vertical-align: top; }
        th { background:#eee; text-transform: uppercase; font-size: 10px; letter-spacing:1px; }
        .sig { margin-top: 60px; display:grid; grid-template-columns: 1fr 1fr; gap: 60px; font-size: 11px; text-align:center; }
        .sig div { border-top: 1px solid #111; padding-top:6px; }
        .footer { margin-top: 30px; font-size: 10px; color:#666; text-align:center; border-top:1px solid #ccc; padding-top:8px; }
      </style></head><body>
      <div class="header">
        <h1>Ficha de Manutenção de Extintor — NR-23 / NBR 12962</h1>
        <p>Documento de rastreabilidade técnica · Sistema FireGuard</p>
      </div>
      <div class="meta">
        <div><b>Código:</b> ${extintor.codigo}</div>
        <div><b>Tipo / Classe:</b> ${extintor.tipo} ${extintor.capacidade ?? ""} — ${extintor.classes.join("/")}</div>
        <div><b>Fabricante:</b> ${extintor.fabricante ?? "—"}</div>
        <div><b>Status:</b> ${extintor.status}</div>
        <div><b>Localização:</b> ${extintor.localizacao ?? extintor.setor}</div>
        <div><b>Prédio / Andar:</b> ${extintor.predio} · ${extintor.andar}</div>
        <div><b>Validade da carga:</b> ${format(new Date(extintor.validade_carga), "dd/MM/yyyy")}</div>
        <div><b>Vencimento TH:</b> ${extintor.teste_hidrostatico ? format(new Date(extintor.teste_hidrostatico), "dd/MM/yyyy") : "—"}</div>
      </div>
      <h2>Histórico de Manutenção</h2>
      <table>
        <thead><tr><th>Data</th><th>Ação</th><th>Peças / Reparos</th><th>Responsável</th><th>Resultado</th></tr></thead>
        <tbody>${rows || `<tr><td colspan="5" style="text-align:center;padding:20px;color:#666">Nenhum registro de manutenção.</td></tr>`}</tbody>
      </table>
      <div class="sig">
        <div>Responsável Técnico</div>
        <div>Responsável pelo Estabelecimento</div>
      </div>
      <div class="footer">Emitido em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")} — Conforme NR-23 e ABNT NBR 12962/13485</div>
      <script>window.onload = () => setTimeout(() => window.print(), 300);</script>
      </body></html>`);
    win.document.close();
  };

  return (
    <div className="mt-10 bg-card border border-border rounded-2xl shadow-soft overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-6 border-b border-border bg-secondary/30">
        <div className="flex items-start gap-3">
          <div className="size-10 rounded-lg bg-carbon text-carbon-foreground flex items-center justify-center"><ClipboardList className="size-5" /></div>
          <div>
            <h2 className="font-semibold tracking-tight">Histórico de Manutenção (NR-23)</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Registros oficiais de inspeção, reparo e recebimento — ABNT NBR 12962</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={exportarPDF}
            variant="outline"
            className="border-carbon/30 bg-white text-carbon hover:bg-carbon hover:text-carbon-foreground font-serif tracking-wide"
          >
            <FileText className="size-4" /> Exportar Ficha (PDF)
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-security hover:bg-security/90 text-security-foreground">
                <Plus className="size-4" /> Nova Inspeção
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nova Inspeção / Manutenção</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Ação realizada</Label>
                  <Select value={acao} onValueChange={setAcao}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inspecionado">Inspecionado</SelectItem>
                      <SelectItem value="Reparado">Reparado</SelectItem>
                      <SelectItem value="Recebido">Recebido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Peças / Reparos</Label>
                  <Input value={pecas} onChange={(e) => setPecas(e.target.value)} placeholder="Ex: Substituição de gatilho, troca de difusor, mangote..." />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Observações</Label>
                  <Textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={3} placeholder="Notas técnicas..." />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Foto</Label>
                  <FileUpload label="Tirar / Enviar foto" accept="image/*" capture="environment" prefix="inspecao/fotos" values={fotos} onChange={setFotos} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Anexos</Label>
                  <FileUpload label="Anexar documento" prefix="inspecao/anexos" values={anexos} onChange={setAnexos} />
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={() => save.mutate()} disabled={save.isPending} className="bg-carbon hover:bg-carbon/90 text-carbon-foreground">
                  {save.isPending ? "Salvando..." : "Registrar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider border-b border-border bg-secondary/20">
              <th className="px-6 py-3 font-medium">Data</th>
              <th className="px-6 py-3 font-medium">Ação</th>
              <th className="px-6 py-3 font-medium">Peças / Reparos</th>
              <th className="px-6 py-3 font-medium">Responsável</th>
              <th className="px-6 py-3 font-medium">Resultado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {inspecoes.map((i) => {
              const r = i as typeof i & { acao?: string; pecas?: string | null };
              return (
                <tr key={i.id} className="hover:bg-secondary/20">
                  <td className="px-6 py-3 tabular-nums whitespace-nowrap">{format(new Date(i.data), "dd/MM/yyyy")}<span className="text-xs text-muted-foreground ml-1">{format(new Date(i.data), "HH:mm")}</span></td>
                  <td className="px-6 py-3 font-medium">{r.acao ?? "Inspecionado"}</td>
                  <td className="px-6 py-3 text-muted-foreground">{r.pecas ?? "—"}</td>
                  <td className="px-6 py-3">{i.inspetor_nome}</td>
                  <td className="px-6 py-3">
                    <span className={cn("inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full", i.conforme ? "bg-safe/10 text-safe" : "bg-security/10 text-security")}>
                      <ShieldCheck className="size-3" /> {i.conforme ? "Conforme" : "Não conforme"}
                    </span>
                  </td>
                </tr>
              );
            })}
            {inspecoes.length === 0 && (
              <tr><td colSpan={5} className="text-center py-12 text-muted-foreground text-sm">{isLoading ? "Carregando..." : "Nenhuma manutenção registrada ainda."}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}