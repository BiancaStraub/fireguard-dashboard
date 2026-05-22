import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, FileCheck2, AlertTriangle, CircleCheck, CircleX, ClipboardList, ListChecks, Gauge, ClipboardEdit, ArrowRight, Lock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Auditoria NR-23 — Equipe 5" }] }),
  component: HomeAuditoriaPage,
});

type Status = "conforme" | "nao_conforme" | "parcial";
type Item = { id: string; requisito: string; descricao: string; status: Status; evidencia: string };

const NBR_12962: Item[] = [
  { id: "12962-1", requisito: "Inspeção visual mensal", descricao: "Verificação de pressão, lacre e sinalização realizada nos últimos 30 dias.", status: "conforme", evidencia: "200/200 extintores inspecionados" },
  { id: "12962-2", requisito: "Manutenção de 1º nível", descricao: "Limpeza externa, integridade do cilindro e mangotinho.", status: "conforme", evidencia: "Última execução em ciclo válido" },
  { id: "12962-3", requisito: "Manutenção de 2º nível", descricao: "Recarga anual obrigatória dos extintores.", status: "parcial", evidencia: "12 unidades pendentes (CED, ICS)" },
  { id: "12962-4", requisito: "Manutenção de 3º nível", descricao: "Teste hidrostático quinquenal documentado.", status: "nao_conforme", evidencia: "3 unidades com hidrostático vencido" },
  { id: "12962-5", requisito: "Anel de identificação", descricao: "Anel colorido fixado após cada recarga.", status: "conforme", evidencia: "Padrão atendido em 100% da amostra" },
];
const NBR_13485: Item[] = [
  { id: "13485-1", requisito: "Sinalização de localização", descricao: "Placa de identificação visível a 1,80 m do piso.", status: "conforme", evidencia: "Inspeção fotográfica aprovada" },
  { id: "13485-2", requisito: "Desobstrução do acesso", descricao: "Área de 1 m ao redor do extintor livre de obstáculos.", status: "parcial", evidencia: "2 ocorrências no Hospital São Lucas" },
  { id: "13485-3", requisito: "Altura de instalação", descricao: "Parte superior entre 1,60 m e máximo 1,80 m do piso.", status: "conforme", evidencia: "Medições registradas no app" },
  { id: "13485-4", requisito: "Treinamento da brigada", descricao: "Brigada apta com curso atualizado nos últimos 12 meses.", status: "conforme", evidencia: "Certificados anexados ao dossiê" },
];
const NR_23: Item[] = [
  { id: "nr23-1", requisito: "Plano de emergência", descricao: "Documento de evacuação revisado anualmente.", status: "conforme", evidencia: "Revisão registrada em 03/2026" },
  { id: "nr23-2", requisito: "Rotas de fuga sinalizadas", descricao: "Saídas demarcadas e iluminação de emergência funcional.", status: "parcial", evidencia: "Iluminação intermitente na ala G2" },
  { id: "nr23-3", requisito: "Simulado anual", descricao: "Realização de simulado documentado.", status: "nao_conforme", evidencia: "Último simulado fora do prazo" },
];

function statusMeta(s: Status) {
  if (s === "conforme") return { label: "Conforme", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CircleCheck };
  if (s === "parcial") return { label: "Parcialmente conforme", cls: "bg-amber-50 text-amber-700 border-amber-200", icon: AlertTriangle };
  return { label: "Não conforme", cls: "bg-red-50 text-red-700 border-red-200", icon: CircleX };
}
function summary(items: Item[]) {
  return {
    total: items.length,
    conforme: items.filter((i) => i.status === "conforme").length,
    parcial: items.filter((i) => i.status === "parcial").length,
    nc: items.filter((i) => i.status === "nao_conforme").length,
  };
}

type TabKey = "12962" | "13485" | "nr23";
const TABS: { key: TabKey; label: string; subtitle: string; icon: typeof ShieldCheck; items: Item[] }[] = [
  { key: "12962", label: "NBR 12962", subtitle: "Inspeção, manutenção e recarga de extintores", icon: FileCheck2, items: NBR_12962 },
  { key: "13485", label: "NBR 13485", subtitle: "Sinalização e localização dos extintores", icon: ClipboardList, items: NBR_13485 },
  { key: "nr23", label: "NR-23", subtitle: "Proteção contra incêndios — Ministério do Trabalho", icon: ShieldCheck, items: NR_23 },
];

type ContactKind = "email" | "telefone";
type SolicitacaoStored = {
  id: string;
  nome: string;
  contato_tipo: ContactKind;
  contato_valor: string;
  mensagem: string;
  criado_em: string;
};

function HomeAuditoriaPage() {
  const [tab, setTab] = useState<TabKey>("12962");
  const [openModal, setOpenModal] = useState(false);
  const all = [...NBR_12962, ...NBR_13485, ...NR_23];
  const total = summary(all);
  const active = TABS.find((t) => t.key === tab)!;

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur border-b border-slate-100">
        <div className="max-w-6xl mx-auto h-14 px-4 md:px-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="size-4 text-red-600" strokeWidth={1.75} />
            <span className="hidden sm:inline">Equipe 5 · Conformidade</span>
          </div>
          <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
            Portal NR-23
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="mb-8 md:mb-10">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500 mb-2">Portal · Equipe 5</p>
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-slate-900">Portal de Conformidade Regulamentar</h1>
          <p className="text-sm md:text-base text-slate-500 mt-2">Auditoria Interna de Normas Técnicas — Equipe 5</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8 md:mb-10">
          <KpiCard label="NBRs avaliadas" value={3} icon={ListChecks} tone="slate" />
          <KpiCard label="Itens conformes" value={total.conforme} icon={CircleCheck} tone="emerald" />
          <KpiCard label="Ajustes pendentes" value={total.parcial + total.nc} icon={ClipboardEdit} tone="red" />
          <KpiCard label="Índice de conformidade" value={`${Math.round(((total.conforme + total.parcial * 0.5) / total.total) * 100)}%`} icon={Gauge} tone="slate" />
        </div>

        <section className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 md:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="inline-flex p-1 bg-slate-100 rounded-full self-start">
              {TABS.map((t) => {
                const isActive = tab === t.key;
                return (
                  <button key={t.key} onClick={() => setTab(t.key)} className={`px-3.5 md:px-4 py-1.5 text-xs md:text-sm font-medium rounded-full transition-colors ${isActive ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}>
                    {t.label}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <active.icon className="size-4 text-slate-400" strokeWidth={1.75} />
              <span>{active.subtitle}</span>
            </div>
          </div>

          <div className="hidden md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-medium uppercase tracking-wider text-slate-500 border-b border-slate-100">
                  <th className="px-6 py-4 font-medium min-w-[180px]">Requisito</th>
                  <th className="px-6 py-4 font-medium">Descrição</th>
                  <th className="px-6 py-4 font-medium min-w-[200px]">Status</th>
                  <th className="px-6 py-4 font-medium min-w-[220px]">Observação</th>
                </tr>
              </thead>
              <tbody>
                {active.items.map((it) => {
                  const m = statusMeta(it.status);
                  const Ico = m.icon;
                  return (
                    <tr key={it.id} className="border-b border-slate-100 last:border-0 align-top hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">{it.requisito}</td>
                      <td className="px-6 py-4 text-slate-600 leading-relaxed">{it.descricao}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${m.cls}`}>
                          <Ico className="size-3.5" strokeWidth={1.75} /> {m.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[13px] text-slate-500 leading-relaxed">{it.evidencia}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="md:hidden p-3 space-y-3 bg-slate-50/40">
            {active.items.map((it) => {
              const m = statusMeta(it.status);
              const Ico = m.icon;
              return (
                <article key={it.id} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                  <header className="flex items-start justify-between gap-3 mb-2">
                    <p className="font-semibold text-sm text-slate-900 break-words">{it.requisito}</p>
                    <span className={`shrink-0 inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${m.cls}`}>
                      <Ico className="size-3" strokeWidth={1.75} /> {m.label}
                    </span>
                  </header>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3 break-words">{it.descricao}</p>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 mb-0.5">Observação</p>
                  <p className="text-xs text-slate-500 leading-relaxed break-words">{it.evidencia}</p>
                </article>
              );
            })}
          </div>
        </section>

        <p className="text-[11px] text-slate-400 mt-6 text-center">FireGuard · Portal público de auditoria · Atualizado em maio de 2026</p>

        <section className="mt-10 rounded-2xl overflow-hidden border border-red-100 bg-gradient-to-br from-red-600 to-red-700 text-white shadow-sm">
          <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="max-w-xl">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-red-100/90 mb-2">Serviços de Conformidade</p>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight">Precisa de adequação à NR-23?</h2>
              <p className="text-sm text-red-50/90 mt-2 leading-relaxed">
                Nossa equipe realiza auditoria completa de extintores, sinalização, rotas de fuga e plano
                de emergência segundo as NBR 12962, NBR 13485 e NR-23.
              </p>
            </div>
            <button
              onClick={() => setOpenModal(true)}
              className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-red-700 font-semibold text-sm shadow-sm hover:bg-red-50 transition-colors"
            >
              Solicitar Auditoria
              <ArrowRight className="size-4" strokeWidth={2.25} />
            </button>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <p>© 2026 Equipe 5 · Portal de Conformidade NR-23 / NBR 12962 / NBR 13485</p>
          <Link to="/login" className="inline-flex items-center gap-1.5 hover:text-slate-700 transition-colors">
            <Lock className="size-3" strokeWidth={1.75} />
            Acesso Colaborador (Fireguard)
          </Link>
        </div>
      </footer>

      <ContactModal open={openModal} onOpenChange={setOpenModal} />
    </div>
  );
}

function ContactModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [nome, setNome] = useState("");
  const [contatoTipo, setContatoTipo] = useState<ContactKind>("email");
  const [contatoValor, setContatoValor] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !contatoValor.trim() || !mensagem.trim()) {
      toast.error("Preencha todos os campos.");
      return;
    }
    setBusy(true);
    try {
      const raw = localStorage.getItem("equipe5_requests");
      const list: SolicitacaoStored[] = raw ? JSON.parse(raw) : [];
      const novo: SolicitacaoStored = {
        id: crypto.randomUUID(),
        nome: nome.trim(),
        contato_tipo: contatoTipo,
        contato_valor: contatoValor.trim(),
        mensagem: mensagem.trim(),
        criado_em: new Date().toISOString(),
      };
      localStorage.setItem("equipe5_requests", JSON.stringify([novo, ...list]));
      toast.success("Solicitação enviada com sucesso!");
      setNome(""); setContatoValor(""); setMensagem(""); setContatoTipo("email");
      onOpenChange(false);
    } catch {
      toast.error("Não foi possível salvar localmente.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white text-slate-900">
        <DialogHeader>
          <DialogTitle className="text-slate-900">Solicitar Auditoria</DialogTitle>
          <DialogDescription className="text-slate-500">
            Preencha os dados e nossa equipe entrará em contato.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="nome" className="text-slate-700">Nome / Empresa</Label>
            <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Indústria Acme Ltda." />
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-700">Forma de contato</Label>
            <div className="inline-flex p-1 bg-slate-100 rounded-lg">
              <button type="button" onClick={() => setContatoTipo("email")} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${contatoTipo === "email" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>E-mail</button>
              <button type="button" onClick={() => setContatoTipo("telefone")} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${contatoTipo === "telefone" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>Telefone</button>
            </div>
            <Input
              type={contatoTipo === "email" ? "email" : "tel"}
              value={contatoValor}
              onChange={(e) => setContatoValor(e.target.value)}
              placeholder={contatoTipo === "email" ? "voce@empresa.com" : "(11) 90000-0000"}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="msg" className="text-slate-700">Mensagem / Serviço desejado</Label>
            <Textarea id="msg" rows={4} value={mensagem} onChange={(e) => setMensagem(e.target.value)} placeholder="Descreva brevemente o que precisa..." />
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
              <X className="size-4" /> Cancelar
            </Button>
            <Button type="submit" disabled={busy} className="bg-red-600 hover:bg-red-700 text-white">
              {busy ? "Enviando..." : "Enviar solicitação"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type Tone = "slate" | "emerald" | "red";
function KpiCard({ label, value, icon: Icon, tone }: { label: string; value: string | number; icon: typeof ShieldCheck; tone: Tone }) {
  const toneCls = { slate: "bg-slate-100 text-slate-600", emerald: "bg-emerald-50 text-emerald-600", red: "bg-red-50 text-red-600" }[tone];
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-4 md:p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-[11px] md:text-xs font-medium uppercase tracking-wider text-slate-500 leading-tight">{label}</p>
        <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${toneCls}`}>
          <Icon className="size-4" strokeWidth={1.75} />
        </div>
      </div>
      <p className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 tabular-nums">{value}</p>
    </div>
  );
}
