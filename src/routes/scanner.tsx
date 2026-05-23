import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/fireguard/AppShell";
import { QrScanner } from "@/components/fireguard/QrScanner";
import { getExtintorByCodigo } from "@/lib/fireguard/services";
import { useAuth } from "@/lib/fireguard/auth";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { QrCode } from "lucide-react";

export const Route = createFileRoute("/scanner")({
  head: () => ({ meta: [{ title: "Scanner QR — FireGuard" }] }),
  component: ScannerPage,
});

function ScannerPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin" || profile?.role === "subadmin";
  const [open, setOpen] = useState(true);

  const onScanned = async (code: string) => {
    setOpen(false);
    try {
      const found = await getExtintorByCodigo(code);
      if (found) {
        toast.success(`Extintor ${code} encontrado`);
        navigate({ to: "/cadastro/$id", params: { id: found.id } });
        return;
      }
      if (!isAdmin) {
        toast.error(`Código ${code} não cadastrado. Solicite ao administrador.`);
        setOpen(true);
        return;
      }
      toast.info(`Código ${code} não encontrado — cadastrando novo`);
      navigate({ to: "/cadastro/$id", params: { id: "novo" }, search: { codigo: code } as never });
    } catch (e) {
      toast.error((e as Error).message);
      setOpen(true);
    }
  };

  return (
    <AppShell>
      <div className="max-w-xl mx-auto space-y-6">
        <header className="space-y-1">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">FireGuard · Leitor</p>
          <h1 className="text-2xl font-bold flex items-center gap-2"><QrCode className="size-6 text-security" /> Scanner QR</h1>
          <p className="text-sm text-muted-foreground">Aponte a câmera para o QR Code ou código de barras do extintor. A leitura é automática.</p>
        </header>
        {!open && (
          <div className="rounded-xl border border-border bg-card p-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">Leitor pausado.</p>
            <Button onClick={() => setOpen(true)} className="bg-security text-security-foreground hover:bg-security/90">
              <QrCode className="size-4" /> Reabrir câmera
            </Button>
          </div>
        )}
        <QrScanner open={open} onClose={() => setOpen(false)} onDetected={onScanned} />
      </div>
    </AppShell>
  );
}