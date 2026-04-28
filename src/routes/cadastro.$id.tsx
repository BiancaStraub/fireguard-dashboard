import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/fireguard/AppShell";
import { useApp } from "@/lib/fireguard/store";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, CalendarIcon, MapPin, Upload } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { ExtClass, ExtStatus, ExtType, Extintor } from "@/lib/fireguard/types";

export const Route = createFileRoute("/cadastro/$id")({
  head: () => ({ meta: [{ title: "Cadastro de Extintor — FireGuard" }] }),
  component: CadastroPage,
});

const CLASSES: ExtClass[] = ["A", "B", "C", "K"];

function CadastroPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const extintores = useApp((s) => s.extintores);
  const upsert = useApp((s) => s.upsertExtintor);
  const existing = id !== "novo" ? extintores.find((e) => e.id === id) : undefined;
  const isNew = !existing;

  const [form, setForm] = useState<Extintor>(existing ?? {
    id: `e${Date.now()}`,
    serie: "",
    tipo: "PQS",
    classe: ["A", "B", "C"],
    fabricante: "",
    status: "Ativo",
    predio: "",
    andar: "",
    setor: "",
    validadeCarga: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    testeHidrostatico: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000).toISOString(),
    alturaCm: 150,
  });

  const set = <K extends keyof Extintor>(k: K, v: Extintor[K]) => setForm({ ...form, [k]: v });

  const submit = () => {
    if (!form.serie || !form.fabricante || !form.setor) {
      toast.error("Preencha série, fabricante e setor.");
      return;
    }
    upsert(form);
    toast.success(isNew ? "Extintor cadastrado!" : "Extintor atualizado!");
    navigate({ to: "/inventario" });
  };

  return (
    <AppShell>
      <button onClick={() => navigate({ to: "/inventario" })} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4">
        <ArrowLeft className="size-4" /> Voltar ao inventário
      </button>
      <div className="mb-8">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">{isNew ? "Novo Cadastro" : "Edição"}</p>
        <h1 className="text-3xl font-semibold tracking-tight">{isNew ? "Cadastrar Extintor" : `Editar ${form.serie}`}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Equipamento */}
        <Section title="Dados do Equipamento" subtitle="Identificação e tipo">
          <Field label="Número de Série">
            <Input value={form.serie} onChange={(e) => set("serie", e.target.value)} placeholder="FG-XXXX" className="font-mono" />
          </Field>
          <Field label="Tipo">
            <Select value={form.tipo} onValueChange={(v) => set("tipo", v as ExtType)}>
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
              {CLASSES.map((c) => (
                <label key={c} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={form.classe.includes(c)}
                    onCheckedChange={(v) => {
                      const next = v ? [...form.classe, c] : form.classe.filter((x) => x !== c);
                      set("classe", next);
                    }}
                  />
                  <span className="text-sm font-medium">{c}</span>
                </label>
              ))}
            </div>
          </Field>
          <Field label="Fabricante">
            <Input value={form.fabricante} onChange={(e) => set("fabricante", e.target.value)} placeholder="Resil, Kidde..." />
          </Field>
          <Field label="Status">
            <Select value={form.status} onValueChange={(v) => set("status", v as ExtStatus)}>
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
          <Field label="Setor"><Input value={form.setor} onChange={(e) => set("setor", e.target.value)} placeholder="Almoxarifado, Sala Elétrica..." /></Field>

          <div className="pt-2">
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2 block">Planta Baixa / Mapa</Label>
            <button type="button" onClick={() => toast.info("Upload simulado — selecione um arquivo .pdf, .png ou .jpg")} className="w-full border-2 border-dashed border-border rounded-xl p-6 hover:bg-secondary/50 transition-colors text-center">
              <Upload className="size-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">Anexar Planta Baixa</p>
              <p className="text-xs text-muted-foreground mt-0.5">PDF, PNG ou JPG até 10MB</p>
            </button>
          </div>
        </Section>

        <Section title="Dados Técnicos" subtitle="Validade e instalação">
          <Field label="Validade da carga">
            <DatePicker value={new Date(form.validadeCarga)} onChange={(d) => set("validadeCarga", d.toISOString())} />
          </Field>
          <Field label="Teste hidrostático">
            <DatePicker value={new Date(form.testeHidrostatico)} onChange={(d) => set("testeHidrostatico", d.toISOString())} />
          </Field>
          <Field label="Altura de instalação (cm)">
            <Input type="number" value={form.alturaCm} onChange={(e) => set("alturaCm", Number(e.target.value))} placeholder="máx 1,60m conforme NR-23" />
            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
              <MapPin className="size-3" />Máximo 160cm conforme NR-23
            </p>
            {form.alturaCm > 160 && <p className="text-xs text-security mt-1 font-medium">Altura excede o limite normativo!</p>}
          </Field>
        </Section>
      </div>

      <div className="flex justify-end gap-3 mt-8">
        <Button variant="outline" onClick={() => navigate({ to: "/inventario" })}>Cancelar</Button>
        <Button onClick={submit} className="bg-carbon hover:bg-carbon/90 text-carbon-foreground">{isNew ? "Cadastrar" : "Salvar alterações"}</Button>
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