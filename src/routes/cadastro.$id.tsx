import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/fireguard/AppShell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getExtintor, upsertExtintor, type ExtintorInsert } from "@/lib/fireguard/services";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, CalendarIcon, MapPin } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { z } from "zod";
import { useAuth } from "@/lib/fireguard/auth";

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
      });
    }
  }, [existing]);

  const save = useMutation({
    mutationFn: () => upsertExtintor(form),
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

      <div className="flex justify-end gap-3 mt-8">
        <Button variant="outline" onClick={() => navigate({ to: "/inventario" })}>Cancelar</Button>
        <Button onClick={submit} disabled={save.isPending} className="bg-carbon hover:bg-carbon/90 text-carbon-foreground">{save.isPending ? "Salvando..." : isNew ? "Cadastrar" : "Salvar alterações"}</Button>
      </div>
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