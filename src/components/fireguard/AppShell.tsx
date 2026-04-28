import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useApp } from "@/lib/fireguard/store";
import { Flame, LayoutDashboard, Boxes, ClipboardCheck, FileText, LogOut, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import type { Role } from "@/lib/fireguard/types";
const NAV: { to: string; label: string; icon: typeof LayoutDashboard; roles: Role[] }[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "inspetor"] },
  { to: "/inventario", label: "Inventário", icon: Boxes, roles: ["admin"] },
  { to: "/inspecao", label: "Inspeção", icon: ClipboardCheck, roles: ["admin", "inspetor"] },
  { to: "/relatorios", label: "Relatórios", icon: FileText, roles: ["admin"] },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const user = useApp((s) => s.user);
  const logout = useApp((s) => s.logout);
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) navigate({ to: "/login" });
  }, [user, navigate]);
  useEffect(() => { setOpen(false); }, [location.pathname]);

  if (!user) return null;
  const items = NAV.filter((n) => n.roles.includes(user.role));

  return (
    <div className="min-h-dvh bg-background">
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6 md:gap-10">
            <Link to="/dashboard" className="flex items-center gap-2.5">
              <div className="size-9 bg-carbon rounded-lg flex items-center justify-center shadow-soft">
                <Flame className="size-5 text-security" strokeWidth={2.5} />
              </div>
              <span className="text-xl font-semibold tracking-tight uppercase">FireGuard</span>
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {items.map((n) => {
                const active = location.pathname.startsWith(n.to);
                return (
                  <Link key={n.to} to={n.to} className={cn(
                    "px-3.5 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2",
                    active ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}>
                    <n.icon className="size-4" />
                    {n.label}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right leading-tight">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{user.role === "admin" ? "Administrador" : "Inspetor"}</p>
              <p className="text-sm font-semibold">{user.nome}</p>
            </div>
            <div className="size-10 rounded-full bg-carbon text-carbon-foreground flex items-center justify-center font-semibold text-sm">
              {user.nome.split(" ").map((n) => n[0]).slice(0, 2).join("")}
            </div>
            <Button variant="ghost" size="icon" className="hidden md:inline-flex" onClick={() => { logout(); navigate({ to: "/login" }); }}>
              <LogOut className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(!open)}>
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>
        </div>
        {open && (
          <div className="md:hidden border-t border-border bg-background">
            <div className="px-4 py-3 flex flex-col gap-1">
              {items.map((n) => {
                const active = location.pathname.startsWith(n.to);
                return (
                  <Link key={n.to} to={n.to} className={cn(
                    "px-3 py-2.5 text-sm font-medium rounded-md flex items-center gap-3",
                    active ? "bg-secondary text-foreground" : "text-muted-foreground"
                  )}>
                    <n.icon className="size-4" />
                    {n.label}
                  </Link>
                );
              })}
              <button onClick={() => { logout(); navigate({ to: "/login" }); }} className="px-3 py-2.5 text-sm font-medium text-muted-foreground flex items-center gap-3">
                <LogOut className="size-4" />Sair
              </button>
            </div>
          </div>
        )}
      </nav>
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">{children}</main>
    </div>
  );
}