import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/fireguard/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Flame, Shield, ClipboardCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Entrar — FireGuard" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { user, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [user, loading, navigate]);

  const fillCreds = (perfil: "admin" | "inspetor") => {
    if (perfil === "admin") {
      setEmail("admin@adelia.edu.br");
      setPassword("admin123");
      setNome("Administrador");
    } else {
      setEmail("inspetor@adelia.edu.br");
      setPassword("inspetor123");
      setNome("Inspetor");
    }
    setTab("login");
    toast.info(`Credenciais de ${perfil} preenchidas — clique em Entrar.`);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setBusy(true);
    try {
      if (tab === "login") {
        const { error } = await signIn(email, password);
        if (error) {
          // Auto-cria conta de teste se não existir
          const isTest = email === "admin@adelia.edu.br" || email === "inspetor@adelia.edu.br";
          if (isTest && /invalid|credenciais|credentials/i.test(error)) {
            const nomeAuto = email.startsWith("admin") ? "Administrador" : "Inspetor";
            const { error: errSignup } = await signUp(email, password, nomeAuto);
            if (errSignup) { toast.error(errSignup); return; }
            const { error: err2 } = await signIn(email, password);
            if (err2) { toast.error(err2); return; }
          } else {
            toast.error(error); return;
          }
        }
        toast.success("Bem-vindo de volta!");
        navigate({ to: "/dashboard" });
      } else {
        if (!nome) { toast.error("Informe seu nome"); return; }
        const { error } = await signUp(email, password, nome);
        if (error) { toast.error(error); return; }
        toast.success("Conta criada — você já pode entrar.");
        setTab("login");
      }
    } finally {
      setBusy(false);
    }
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
        <p className="text-xs font-mono text-zinc-500 relative z-10">O primeiro usuário cadastrado vira <span className="text-safe">admin</span> automaticamente.</p>
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
          <h2 className="text-3xl font-semibold tracking-tight mb-8">{tab === "login" ? "Entrar na sua conta" : "Criar conta"}</h2>

          <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "signup")} className="w-full">
            <TabsList className="grid grid-cols-2 w-full mb-6">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Cadastrar</TabsTrigger>
            </TabsList>

            <TabsContent value="login" />
            <TabsContent value="signup" />
          </Tabs>

          <form onSubmit={submit} className="space-y-5">
            {tab === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="nome">Nome completo</Label>
                <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Maria Silva" />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" autoComplete="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={tab === "login" ? "current-password" : "new-password"} />
            </div>
            <Button type="submit" disabled={busy} className="w-full h-11 bg-carbon hover:bg-carbon/90 text-carbon-foreground font-semibold">
              {busy ? "Aguarde..." : tab === "login" ? "Entrar" : "Criar conta"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}