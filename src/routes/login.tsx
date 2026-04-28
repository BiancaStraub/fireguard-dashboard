import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useApp } from "@/lib/fireguard/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Flame, Shield, HardHat } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Entrar — FireGuard" }] }),
  component: LoginPage,
});

function LoginPage() {
  const login = useApp((s) => s.login);
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@fireguard.com");
  const [password, setPassword] = useState("demo1234");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    const u = login(email, password);
    if (u) {
      toast.success(`Bem-vindo, ${u.nome}`);
      navigate({ to: "/dashboard" });
    }
  };

  const fillAs = (kind: "admin" | "inspetor") => {
    setEmail(kind === "admin" ? "admin@fireguard.com" : "inspetor@fireguard.com");
    setPassword("demo1234");
  };

  return (
    <div className="min-h-dvh grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-between bg-carbon text-carbon-foreground p-12 relative overflow-hidden">
        <div className="flex items-center gap-3 relative z-10">
          <div className="size-10 bg-security/20 rounded-lg flex items-center justify-center">
            <Flame className="size-6 text-security" strokeWidth={2.5} />
          </div>
          <span className="text-2xl font-semibold tracking-tight uppercase">FireGuard</span>
        </div>
        <div className="relative z-10 space-y-6 max-w-md">
          <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">Sistema de Segurança do Trabalho</p>
          <h1 className="text-4xl font-semibold tracking-tight leading-tight">Conformidade NR-23 em tempo real, na palma da mão.</h1>
          <p className="text-zinc-400 leading-relaxed">Gestão de patrimônio, inspeções via QR Code e relatórios de auditoria — tudo em um único painel.</p>
        </div>
        <div className="grid grid-cols-3 gap-4 relative z-10 text-xs font-mono">
          <div><div className="text-2xl font-semibold tracking-tight">1.482</div><div className="text-zinc-500 uppercase">Ativos</div></div>
          <div><div className="text-2xl font-semibold tracking-tight text-safe">98.2%</div><div className="text-zinc-500 uppercase">Conformes</div></div>
          <div><div className="text-2xl font-semibold tracking-tight">42</div><div className="text-zinc-500 uppercase">Inspetores</div></div>
        </div>
        <div className="absolute -bottom-32 -right-32 size-96 rounded-full bg-security/10 blur-3xl" />
      </div>

      <div className="flex flex-col justify-center p-6 md:p-12">
        <div className="w-full max-w-md mx-auto">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="size-9 bg-carbon rounded-lg flex items-center justify-center">
              <Flame className="size-5 text-security" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-semibold tracking-tight uppercase">FireGuard</span>
          </div>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">Acesso ao sistema</p>
          <h2 className="text-3xl font-semibold tracking-tight mb-8">Entrar na sua conta</h2>

          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail corporativo</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@empresa.com" autoComplete="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            </div>
            <Button type="submit" className="w-full h-11 bg-carbon hover:bg-carbon/90 text-carbon-foreground font-semibold">Entrar</Button>
          </form>

          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">Demo — escolha um perfil</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => fillAs("admin")} className="p-4 border border-border rounded-xl hover:bg-secondary text-left transition-colors">
                <Shield className="size-5 mb-2" />
                <p className="text-sm font-semibold">Administrador</p>
                <p className="text-xs text-muted-foreground">Visão completa</p>
              </button>
              <button onClick={() => fillAs("inspetor")} className="p-4 border border-border rounded-xl hover:bg-secondary text-left transition-colors">
                <HardHat className="size-5 mb-2" />
                <p className="text-sm font-semibold">Inspetor</p>
                <p className="text-xs text-muted-foreground">Foco em inspeção mobile</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}