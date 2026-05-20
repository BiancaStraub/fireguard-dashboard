import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/fireguard/AppShell";
import { ShieldCheck, FileCheck2, AlertTriangle, CircleCheck, CircleX, ClipboardList } from "lucide-react";

export const Route = createFileRoute("/auditoria")({
  head: () => ({ meta: [{ title: "Auditoria (Equipe 5) — FireGuard" }] }),
  component: AuditoriaPage,
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
  if (s === "conforme") return { label: "Conforme", cls: "bg-safe/15 text-safe border-safe/30", icon: CircleCheck };
  if (s === "parcial") return { label: "Parcial", cls: "bg-alert/20 text-alert-foreground border-alert/40", icon: AlertTriangle };
  return { label: "Não conforme", cls: "bg-security/15 text-security border-security/30", icon: CircleX };
}

function summary(items: Item[]) {
  return {
    total: items.length,
    conforme: items.filter((i) => i.status === "conforme").length,
    parcial: items.filter((i) => i.status === "parcial").length,
    nc: items.filter((i) => i.status === "nao_conforme").length,
  };
}

function AuditoriaPage() {
  const all = [...NBR_12962, ...NBR_13485, ...NR_23];
  const total = summary(all);
  const score = Math.round(((total.conforme + total.parcial * 0.5) / total.total) * 100);

  return (
    <AppShell>
      <div className="mb-8">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">Equipe 5 · Conformidade</p>
        <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-3">
          <ShieldCheck className="size-7 text-security" /> Painel de Auditoria
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Status oficial perante NBR 12962, NBR 13485 e NR-23.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
        <Kpi label="Índice de conformidade" value={`${score}%`} accent />
        <Kpi label="Conformes" value={total.conforme} />
        <Kpi label="Parciais" value={total.parcial} />
        <Kpi label="Não conformes" value={total.nc} />
      </div>

      <div className="space-y-8">
        <ComplianceSection title="NBR 12962" subtitle="Inspeção, manutenção e recarga de extintores" icon={FileCheck2} items={NBR_12962} />
        <ComplianceSection title="NBR 13485" subtitle="Sinalização e localização dos extintores" icon={ClipboardList} items={NBR_13485} />
        <ComplianceSection title="NR-23" subtitle="Proteção contra incêndios — Ministério do Trabalho" icon={ShieldCheck} items={NR_23} />
      </div>
    </AppShell>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 md:p-5 shadow-soft ${accent ? "bg-security text-security-foreground border-security" : "bg-card border-border"}`}>
      <p className={`text-[11px] font-mono uppercase tracking-widest ${accent ? "text-security-foreground/80" : "text-muted-foreground"}`}>{label}</p>
      <p className="text-2xl md:text-3xl font-semibold mt-2">{value}</p>
    </div>
  );
}

function ComplianceSection({ title, subtitle, icon: Icon, items }: { title: string; subtitle: string; icon: typeof ShieldCheck; items: Item[] }) {
  const s = summary(items);
  return (
    <section className="bg-card border border-border rounded-xl shadow-soft overflow-hidden">
      <header className="flex items-start justify-between gap-4 p-5 border-b border-border">
        <div className="flex items-start gap-3 min-w-0">
          <div className="size-10 rounded-lg bg-security/10 text-security flex items-center justify-center shrink-0">
            <Icon className="size-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            <p className="text-sm text-muted-foreground break-words">{subtitle}</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-3 text-xs font-mono shrink-0">
          <span className="text-safe">{s.conforme} OK</span>
          <span className="text-alert-foreground">{s.parcial} parc.</span>
          <span className="text-security">{s.nc} NC</span>
        </div>
      </header>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr className="text-left">
              <th className="px-5 py-3 font-medium min-w-[160px]">Requisito</th>
              <th className="px-5 py-3 font-medium min-w-[280px]">Descrição</th>
              <th className="px-5 py-3 font-medium min-w-[160px]">Status</th>
              <th className="px-5 py-3 font-medium min-w-[220px]">Evidência</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => {
              const m = statusMeta(it.status);
              const Ico = m.icon;
              return (
                <tr key={it.id} className="border-t border-border align-top">
                  <td className="px-5 py-3 font-medium">{it.requisito}</td>
                  <td className="px-5 py-3 text-muted-foreground break-words">{it.descricao}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md border ${m.cls}`}>
                      <Ico className="size-3.5" /> {m.label}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground break-words">{it.evidencia}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden p-3 space-y-3">
        {items.map((it) => {
          const m = statusMeta(it.status);
          const Ico = m.icon;
          return (
            <div key={it.id} className="border border-border rounded-lg p-4 bg-background text-left">
              <div className="flex items-start justify-between gap-3 mb-2">
                <p className="font-semibold text-sm break-words">{it.requisito}</p>
                <span className={`inline-flex shrink-0 items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md border ${m.cls}`}>
                  <Ico className="size-3" /> {m.label}
                </span>
              </div>
              <p className="text-xs text-muted-foreground break-words mb-2">{it.descricao}</p>
              <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Evidência</p>
              <p className="text-xs break-words">{it.evidencia}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}