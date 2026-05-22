import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Flame, LayoutDashboard, Building2, BellRing, LogOut, Menu, X, Users, Sun, Moon, Inbox, FileText, Settings, QrCode } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useAuth, type Role } from "@/lib/fireguard/auth";
import { NotificationBell } from "@/components/fireguard/NotificationBell";

const NAV: { to: string; label: string; icon: typeof LayoutDashboard; roles: Role[] }[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "subadmin"] },
  { to: "/empresas", label: "Extintores", icon: Building2, roles: ["admin", "subadmin", "inspetor"] },
  { to: "/scanner", label: "Scanner QR", icon: QrCode, roles: ["admin", "subadmin", "inspetor"] },
  { to: "/alertas", label: "Alertas", icon: BellRing, roles: ["admin", "subadmin"] },
  { to: "/equipe", label: "Equipe", icon: Users, roles: ["admin"] },
  { to: "/relatorios", label: "Relatórios", icon: FileText, roles: ["admin", "subadmin", "inspetor"] },
  { to: "/solicitacoes", label: "Solicitações", icon: Inbox, roles: ["admin", "subadmin", "inspetor"] },
  { to: "/configuracoes", label: "Configurações", icon: Settings, roles: ["admin", "subadmin", "inspetor"] },
];

const PREFS_KEY = "fireguard:prefs";

function readDark(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return false;
    const p = JSON.parse(raw);
    return !!p.darkMode;
  } catch { return false; }
}
function writeDark(on: boolean) {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    const p = raw ? JSON.parse(raw) : {};
    p.darkMode = on;
    localStorage.setItem(PREFS_KEY, JSON.stringify(p));
  } catch { /* ignore */ }
  const r = document.documentElement;
  if (on) r.classList.add("dark"); else r.classList.remove("dark");
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState<boolean>(false);

  useEffect(() => { setDark(readDark()); }, []);
  const toggleTheme = useCallback(() => {
    const next = !readDark();
    writeDark(next);
    setDark(next);
  }, []);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);
  useEffect(() => { setOpen(false); }, [location.pathname]);

  if (loading || !user) return null;
  const role: Role = profile?.role ?? "inspetor";
  const items = NAV.filter((n) => n.roles.includes(role));
  const nome = role === "admin" ? "Administrador" : role === "subadmin" ? "Subadministrador" : (profile?.nome ?? user.email ?? "Usuário");
  const initials = nome.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const hoje = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

  return (
    <div className="min-h-dvh bg-background flex">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-20 shrink-0 flex-col items-center py-5 gap-2 bg-card border-r border-border sticky top-0 h-dvh">
        <Link to="/empresas" className="size-11 bg-security rounded-xl flex items-center justify-center shadow-glow-red mb-3">
          <Flame className="size-6 text-security-foreground" strokeWidth={2.5} />
        </Link>
        {items.map((n, i) => {
          const active = location.pathname.startsWith(n.to);
          return (
            <Link key={`${n.to}-${i}`} to={n.to} title={n.label} className={cn(
              "size-11 rounded-xl flex items-center justify-center transition-colors",
              active ? "bg-security/15 text-security" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}>
              <n.icon className="size-5" />
            </Link>
          );
        })}
        <div className="mt-auto">
          <button onClick={async () => { await signOut(); navigate({ to: "/login" }); }} className="size-11 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground">
            <LogOut className="size-5" />
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-40 h-16 bg-card/80 backdrop-blur-md border-b border-border px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3 md:hidden">
            <div className="size-9 bg-security rounded-lg flex items-center justify-center">
              <Flame className="size-5 text-security-foreground" strokeWidth={2.5} />
            </div>
            <span className="font-semibold uppercase tracking-tight">FireGuard</span>
          </div>
          <div className="hidden md:block">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">FireGuard · NBR 13485 / 12693</p>
            <p className="text-sm font-medium capitalize">{hoje}</p>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={toggleTheme}
              title={dark ? "Tema claro" : "Tema escuro"}
              aria-label="Alternar tema"
              className="size-9 rounded-lg border border-border bg-background hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <NotificationBell />
            <div className="text-right leading-tight">
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{role === "admin" ? "Administrador" : role === "subadmin" ? "Subadmin" : "Inspetor"}</p>
              <p className="text-sm font-semibold hidden sm:block">{nome}</p>
            </div>
            <div className="size-10 rounded-full bg-security text-security-foreground flex items-center justify-center font-semibold text-sm">
              {initials}
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 md:px-8 py-6 md:py-8 pb-24 md:pb-8 max-w-7xl w-full mx-auto">{children}</main>

        {/* Bottom Nav mobile */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur border-t border-border">
          <div className="flex items-center justify-around px-1 py-1.5">
            {items.slice(0, 4).map((n, i) => {
              const active = location.pathname.startsWith(n.to);
              return (
                <Link key={`bn-${n.to}-${i}`} to={n.to} className={cn(
                  "flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-lg",
                  active ? "text-security" : "text-muted-foreground"
                )}>
                  <n.icon className="size-5" />
                  <span className="text-[10px] font-medium leading-none truncate max-w-[64px]">{n.label}</span>
                </Link>
              );
            })}
            <button onClick={() => setOpen(!open)} className={cn(
              "flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-muted-foreground"
            )}>
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
              <span className="text-[10px] font-medium leading-none">Mais</span>
            </button>
          </div>
          {open && (
            <div className="border-t border-border bg-card px-3 py-3 flex flex-col gap-1 max-h-[60vh] overflow-y-auto">
              {items.slice(4).map((n, i) => {
                const active = location.pathname.startsWith(n.to);
                return (
                  <Link key={`more-${n.to}-${i}`} to={n.to} className={cn(
                    "px-3 py-2.5 text-sm font-medium rounded-md flex items-center gap-3",
                    active ? "bg-security/15 text-security" : "text-muted-foreground"
                  )}>
                    <n.icon className="size-4" />
                    {n.label}
                  </Link>
                );
              })}
              <button onClick={toggleTheme} className="px-3 py-2.5 text-sm font-medium text-muted-foreground flex items-center gap-3 text-left">
                {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
                {dark ? "Tema claro" : "Tema escuro"}
              </button>
              <button onClick={async () => { await signOut(); navigate({ to: "/login" }); }} className="px-3 py-2.5 text-sm font-medium text-muted-foreground flex items-center gap-3 text-left">
                <LogOut className="size-4" />Sair
              </button>
            </div>
          )}
        </nav>
      </div>
    </div>
  );
}