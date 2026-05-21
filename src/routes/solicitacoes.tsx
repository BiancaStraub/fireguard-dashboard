import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/fireguard/AppShell";
import { useEffect, useState } from "react";
import { Inbox, Mail, Phone, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/solicitacoes")({
  head: () => ({ meta: [{ title: "Solicitações — FireGuard" }] }),
  component: SolicitacoesPage,
});

type ContactKind = "email" | "telefone";
type SolicitacaoStored = {
  id: string;
  nome: string;
  contato_tipo: ContactKind;
  contato_valor: string;
  mensagem: string;
  criado_em: string;
};

function load(): SolicitacaoStored[] {
  try {
    const raw = localStorage.getItem("equipe5_requests");
    return raw ? (JSON.parse(raw) as SolicitacaoStored[]) : [];
  } catch { return []; }
}

function SolicitacoesPage() {
  const [items, setItems] = useState<SolicitacaoStored[]>([]);

  useEffect(() => { setItems(load()); }, []);

  const remove = (id: string) => {
    const next = items.filter((i) => i.id !== id);
    setItems(next);
    localStorage.setItem("equipe5_requests", JSON.stringify(next));
    toast.success("Solicitação removida");
  };

  const clearAll = () => {
    if (!confirm("Limpar todas as solicitações?")) return;
    localStorage.removeItem("equipe5_requests");
    setItems([]);
    toast.success("Caixa de entrada limpa");
  };

  return (
    <AppShell>
      <div className="mb-6 md:mb-8 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Caixa de entrada</p>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Solicitações de Serviço</h1>
          <p className="text-sm text-muted-foreground mt-1">{items.length} solicitação(ões) recebida(s) pelo portal público.</p>
        </div>
        {items.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAll} className="text-muted-foreground">
            <Trash2 className="size-4" /> Limpar tudo
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-12 md:p-16 text-center shadow-soft">
          <div className="mx-auto size-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Inbox className="size-7 text-muted-foreground" strokeWidth={1.75} />
          </div>
          <h2 className="text-lg font-semibold mb-1">Nenhuma solicitação no momento</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            As solicitações enviadas pelo portal público de auditoria aparecerão aqui assim que chegarem.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((it) => (
            <article key={it.id} className="bg-card border border-border rounded-2xl p-5 shadow-soft flex flex-col gap-3">
              <header className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-base truncate">{it.nome}</p>
                  <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mt-0.5">
                    {new Date(it.criado_em).toLocaleString("pt-BR")}
                  </p>
                </div>
                <button onClick={() => remove(it.id)} className="text-muted-foreground hover:text-security transition-colors shrink-0" title="Remover">
                  <Trash2 className="size-4" />
                </button>
              </header>

              <a
                href={it.contato_tipo === "email" ? `mailto:${it.contato_valor}` : `tel:${it.contato_valor}`}
                className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-security transition-colors break-all"
              >
                {it.contato_tipo === "email" ? <Mail className="size-4 shrink-0" /> : <Phone className="size-4 shrink-0" />}
                {it.contato_valor}
              </a>

              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Mensagem</p>
                <p className="text-sm text-foreground/90 leading-relaxed break-words whitespace-pre-wrap">{it.mensagem}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </AppShell>
  );
}