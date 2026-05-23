import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ShieldCheck, ClipboardCheck, BadgeCheck, ArrowRight, ArrowDown,
  Sun, Moon, CircleCheck, AlertTriangle, CircleX, Flame, Mail, Phone, User, MessageSquare,
  Lock,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Equipe 5 — Consultoria em NR-23 e Conformidade" },
      { name: "description", content: "Auditoria e adequação à NR-23, NBR 12962 e NBR 13485. Proteja seu patrimônio e sua equipe com a Equipe 5." },
      { property: "og:title", content: "Equipe 5 — Consultoria em NR-23" },
      { property: "og:description", content: "Consultoria especializada em NR-23 e Normas ABNT." },
    ],
  }),
  component: LandingPage,
});

type Status = "conforme" | "nao_conforme" | "parcial";
type Item = { id: string; requisito: string; descricao: string; status: Status; evidencia: string };

const NBR_12962: Item[] = [
  { id: "12962-1", requisito: "Inspeção visual mensal", descricao: "Verificação de pressão, lacre e sinalização nos últimos 30 dias.", status: "conforme", evidencia: "200/200 extintores inspecionados" },
  { id: "12962-2", requisito: "Manutenção 1º nível", descricao: "Limpeza externa, integridade do cilindro e mangotinho.", status: "conforme", evidencia: "Execução em ciclo válido" },
  { id: "12962-3", requisito: "Manutenção 2º nível", descricao: "Recarga anual obrigatória dos extintores.", status: "parcial", evidencia: "12 unidades pendentes (CED, ICS)" },
  { id: "12962-4", requisito: "Manutenção 3º nível", descricao: "Teste hidrostático quinquenal documentado.", status: "nao_conforme", evidencia: "3 unidades com hidrostático vencido" },
];
const NBR_13485: Item[] = [
  { id: "13485-1", requisito: "Sinalização de localização", descricao: "Placa de identificação visível a 1,80 m do piso.", status: "conforme", evidencia: "Inspeção fotográfica aprovada" },
  { id: "13485-2", requisito: "Desobstrução do acesso", descricao: "Área de 1 m ao redor do extintor livre.", status: "parcial", evidencia: "2 ocorrências no Hospital São Lucas" },
  { id: "13485-3", requisito: "Altura de instalação", descricao: "Parte superior entre 1,60 m e 1,80 m do piso.", status: "conforme", evidencia: "Medições registradas no app" },
];

function statusMeta(s: Status) {
  if (s === "conforme") return { label: "Conforme", cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30", icon: CircleCheck };
  if (s === "parcial") return { label: "Parcialmente", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/30", icon: AlertTriangle };
  return { label: "Não conforme", cls: "bg-red-500/15 text-red-700 dark:text-red-300 ring-1 ring-red-500/30", icon: CircleX };
}

type ContactKind = "email" | "telefone";
type SolicitacaoStored = {
  id: string; nome: string; contato_tipo: ContactKind; contato_valor: string; mensagem: string; criado_em: string;
};

function LandingPage() {
  const [dark, setDark] = useState(false);
  const contatoRef = useRef<HTMLElement>(null);
  const auditoriasRef = useRef<HTMLElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("fireguard:prefs");
      const isDark = raw ? !!JSON.parse(raw)?.darkMode : false;
      setDark(isDark);
      document.documentElement.classList.toggle("dark", isDark);
    } catch { /* noop */ }
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      const raw = localStorage.getItem("fireguard:prefs");
      const p = raw ? JSON.parse(raw) : {};
      localStorage.setItem("fireguard:prefs", JSON.stringify({ ...p, darkMode: next }));
    } catch { /* noop */ }
  };

  const scrollTo = (ref: React.RefObject<HTMLElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-dvh w-full bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 antialiased">
      {/* HEADER */}
      <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-zinc-950/70 border-b border-zinc-200/60 dark:border-zinc-800/60">
        <div className="max-w-7xl mx-auto h-16 px-5 md:px-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="size-9 rounded-xl bg-gradient-to-br from-red-500 to-red-700 grid place-items-center shadow-lg shadow-red-500/30">
              <Flame className="size-5 text-white" strokeWidth={2.25} />
            </div>
            <div className="leading-tight">
              <p className="font-bold tracking-tight text-[15px]">Equipe 5</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">Conformidade</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              aria-label="Alternar tema"
              className="size-10 grid place-items-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            >
              {dark ? <Sun className="size-4.5" strokeWidth={1.75} /> : <Moon className="size-4.5" strokeWidth={1.75} />}
            </button>
            <Link
              to="/login"
              aria-label="Acesso Restrito"
              className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-4 rounded-full text-xs font-semibold border border-red-500/60 text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white dark:hover:text-white transition-all"
            >
              <Lock className="size-3.5" strokeWidth={2} />
              <span className="hidden xs:inline sm:inline">Acesso Restrito</span>
              <span className="xs:hidden sm:hidden">Acesso</span>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden pt-32 pb-24 md:pt-40 md:pb-40">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_60%_at_50%_-10%,rgba(239,68,68,0.18),transparent_70%)]" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-px bg-gradient-to-r from-transparent via-zinc-200 dark:via-zinc-800 to-transparent" />
        <div className="max-w-5xl mx-auto px-5 md:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 ring-1 ring-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium mb-6">
            <span className="size-1.5 rounded-full bg-red-500 animate-pulse" />
            Especialistas em NR-23 · NBR 12962 · NBR 13485
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.05]">
            Garantimos a <span className="bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent">Segurança</span> e
            Conformidade do seu Projeto.
          </h1>
          <p className="mt-7 text-base md:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Consultoria especializada em NR-23 e Normas ABNT para proteger o seu patrimônio e a sua equipe.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => scrollTo(contatoRef)}
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold text-base shadow-xl shadow-red-500/30 hover:shadow-2xl hover:shadow-red-500/40 hover:-translate-y-0.5 transition-all"
            >
              Solicitar Auditoria
              <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={2.25} />
            </button>
            <button
              onClick={() => scrollTo(auditoriasRef)}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900 font-semibold text-base transition-colors"
            >
              Ver Relatórios Públicos
              <ArrowDown className="size-4" strokeWidth={2.25} />
            </button>
          </div>
        </div>
      </section>

      {/* EXPERTISE */}
      <section className="py-24 md:py-32 bg-zinc-50 dark:bg-zinc-900/40 border-y border-zinc-200/60 dark:border-zinc-800/60">
        <div className="max-w-6xl mx-auto px-5 md:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 md:mb-20">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-red-600 dark:text-red-400 mb-3">Nossa Expertise</p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Soluções completas em conformidade</h2>
            <p className="mt-4 text-zinc-600 dark:text-zinc-400 md:text-lg">Do diagnóstico à certificação, conduzimos cada etapa com rigor técnico.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5 md:gap-6">
            <ServiceCard icon={ClipboardCheck} title="Auditoria de Projetos" desc="Diagnóstico técnico completo de instalações, sinalização e plano de emergência conforme normativas vigentes." />
            <ServiceCard icon={ShieldCheck} title="Adequação à NR-23" desc="Implementação de medidas de proteção contra incêndios, rotas de fuga e treinamento de brigada." />
            <ServiceCard icon={BadgeCheck} title="Certificação ABNT" desc="Documentação e acompanhamento para certificação segundo NBR 12962 e NBR 13485." />
          </div>
        </div>
      </section>

      {/* AUDITORIAS */}
      <section ref={auditoriasRef} className="py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-5 md:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 md:mb-16">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-red-600 dark:text-red-400 mb-3">Transparência</p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Últimas Auditorias</h2>
            <p className="mt-4 text-zinc-600 dark:text-zinc-400 md:text-lg">Relatórios técnicos públicos de projetos auditados pela Equipe 5.</p>
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            <ReportCard title="NBR 12962" subtitle="Inspeção, manutenção e recarga de extintores" items={NBR_12962} />
            <ReportCard title="NBR 13485" subtitle="Sinalização e localização" items={NBR_13485} />
          </div>
        </div>
      </section>

      {/* CTA / CONTATO */}
      <section ref={contatoRef} className="bg-zinc-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_50%_0%,rgba(239,68,68,0.25),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_80%_100%,rgba(239,68,68,0.15),transparent_70%)]" />
        <div className="relative max-w-6xl mx-auto px-5 md:px-8 py-24 md:py-32">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-red-400 mb-4">Fale com a Equipe 5</p>
              <h2 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
                Pronto para regularizar sua empresa?
              </h2>
              <p className="mt-6 text-zinc-400 md:text-lg max-w-md leading-relaxed">
                Receba um diagnóstico inicial gratuito. Nossa equipe entra em contato em até 24 horas úteis.
              </p>
              <div className="mt-8 flex flex-col gap-3 text-sm text-zinc-300">
                <div className="flex items-center gap-3"><div className="size-9 rounded-full bg-white/5 ring-1 ring-white/10 grid place-items-center"><ShieldCheck className="size-4 text-red-400" strokeWidth={1.75} /></div>Atendimento técnico especializado</div>
                <div className="flex items-center gap-3"><div className="size-9 rounded-full bg-white/5 ring-1 ring-white/10 grid place-items-center"><BadgeCheck className="size-4 text-red-400" strokeWidth={1.75} /></div>Relatórios e documentação completa</div>
              </div>
            </div>
            <ContactCard />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-zinc-950 text-zinc-500 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-8 text-center text-xs">
          Desenvolvido por Grupo 1 (Bianca, Bryan e Luciano) — Projeto Integrador
        </div>
      </footer>
    </div>
  );
}

function ServiceCard({ icon: Icon, title, desc }: { icon: typeof ShieldCheck; title: string; desc: string }) {
  return (
    <div className="group relative p-7 md:p-8 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:-translate-y-2 hover:shadow-xl hover:shadow-red-500/10 hover:border-red-500/40 transition-all duration-300">
      <div className="size-14 rounded-2xl bg-gradient-to-br from-red-500/10 to-red-600/5 ring-1 ring-red-500/20 grid place-items-center mb-5 group-hover:scale-110 group-hover:from-red-500 group-hover:to-red-700 transition-all duration-300">
        <Icon className="size-7 text-red-600 dark:text-red-400 group-hover:text-white transition-colors" strokeWidth={1.75} />
      </div>
      <h3 className="text-xl font-bold tracking-tight mb-2">{title}</h3>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{desc}</p>
    </div>
  );
}

function ReportCard({ title, subtitle, items }: { title: string; subtitle: string; items: Item[] }) {
  const total = items.length;
  const conf = items.filter((i) => i.status === "conforme").length;
  const pct = Math.round((conf / total) * 100);
  return (
    <article className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <header className="p-6 md:p-7 border-b border-zinc-100 dark:border-zinc-900 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-red-600 dark:text-red-400">{title}</p>
          <h3 className="text-lg md:text-xl font-bold tracking-tight mt-1">{subtitle}</h3>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-2xl md:text-3xl font-bold tabular-nums">{pct}%</p>
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">Conforme</p>
        </div>
      </header>
      <ul className="divide-y divide-zinc-100 dark:divide-zinc-900">
        {items.map((it) => {
          const m = statusMeta(it.status);
          const Ico = m.icon;
          return (
            <li key={it.id} className="p-5 md:p-6 hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40 transition-colors">
              <div className="flex items-start justify-between gap-4 mb-1.5">
                <p className="font-semibold text-sm md:text-base">{it.requisito}</p>
                <span className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full ${m.cls}`}>
                  <Ico className="size-3" strokeWidth={2} />{m.label}
                </span>
              </div>
              <p className="text-xs md:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{it.descricao}</p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-500 mt-2 italic">{it.evidencia}</p>
            </li>
          );
        })}
      </ul>
    </article>
  );
}

function ContactCard() {
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
        nome: nome.trim(), contato_tipo: contatoTipo, contato_valor: contatoValor.trim(),
        mensagem: mensagem.trim(), criado_em: new Date().toISOString(),
      };
      localStorage.setItem("equipe5_requests", JSON.stringify([novo, ...list]));
      toast.success("Solicitação enviada com sucesso!");
      setNome(""); setContatoValor(""); setMensagem(""); setContatoTipo("email");
    } catch {
      toast.error("Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative">
      <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-red-500/30 to-transparent blur-xl" />
      <form
        onSubmit={submit}
        className="relative rounded-3xl bg-white/[0.06] backdrop-blur-2xl border border-white/10 p-7 md:p-9 shadow-2xl"
      >
        <div className="space-y-5">
          <Field label="Nome / Empresa" icon={User}>
            <input
              value={nome} onChange={(e) => setNome(e.target.value)}
              placeholder="Indústria Acme Ltda."
              className="w-full bg-transparent text-white placeholder:text-zinc-500 text-sm outline-none"
            />
          </Field>
          <div>
            <div className="inline-flex p-1 bg-white/5 ring-1 ring-white/10 rounded-full mb-2">
              <button type="button" onClick={() => setContatoTipo("email")} className={`px-3.5 py-1 text-xs font-semibold rounded-full transition-colors ${contatoTipo === "email" ? "bg-white text-zinc-900" : "text-zinc-400"}`}>E-mail</button>
              <button type="button" onClick={() => setContatoTipo("telefone")} className={`px-3.5 py-1 text-xs font-semibold rounded-full transition-colors ${contatoTipo === "telefone" ? "bg-white text-zinc-900" : "text-zinc-400"}`}>Telefone</button>
            </div>
            <Field label={contatoTipo === "email" ? "E-mail" : "Telefone"} icon={contatoTipo === "email" ? Mail : Phone}>
              <input
                type={contatoTipo === "email" ? "email" : "tel"}
                value={contatoValor} onChange={(e) => setContatoValor(e.target.value)}
                placeholder={contatoTipo === "email" ? "voce@empresa.com" : "(11) 90000-0000"}
                className="w-full bg-transparent text-white placeholder:text-zinc-500 text-sm outline-none"
              />
            </Field>
          </div>
          <Field label="Mensagem" icon={MessageSquare} align="top">
            <textarea
              rows={4} value={mensagem} onChange={(e) => setMensagem(e.target.value)}
              placeholder="Descreva brevemente o que precisa..."
              className="w-full bg-transparent text-white placeholder:text-zinc-500 text-sm outline-none resize-none"
            />
          </Field>
          <button
            type="submit" disabled={busy}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-500 hover:to-red-700 text-white font-semibold text-sm shadow-xl shadow-red-500/30 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0"
          >
            {busy ? "Enviando..." : (<>Enviar solicitação <ArrowRight className="size-4" /></>)}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, icon: Icon, children, align = "center" }: { label: string; icon: typeof Mail; children: React.ReactNode; align?: "center" | "top" }) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400 mb-1.5 block">{label}</span>
      <div className={`flex gap-3 px-4 py-3 rounded-xl bg-white/5 ring-1 ring-white/10 focus-within:ring-red-400/60 transition-all ${align === "top" ? "items-start" : "items-center"}`}>
        <Icon className={`size-4 text-zinc-500 shrink-0 ${align === "top" ? "mt-0.5" : ""}`} strokeWidth={1.75} />
        {children}
      </div>
    </label>
  );
}