import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Camera, X } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  onDetected: (code: string) => void;
}

export function QrScanner({ open, onClose, onDetected }: Props) {
  const containerId = "fireguard-qr-reader";
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [manual, setManual] = useState("");
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const start = async () => {
      try {
        const scanner = new Html5Qrcode(containerId);
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decodedText) => {
            if (cancelled) return;
            cancelled = true;
            stop().finally(() => onDetected(decodedText.trim()));
          },
          () => {}
        );
        if (!cancelled) setRunning(true);
      } catch (err) {
        console.error(err);
        toast.error("Não foi possível acessar a câmera. Use o modo manual abaixo.");
      }
    };

    const stop = async () => {
      const s = scannerRef.current;
      scannerRef.current = null;
      if (!s) return;
      try {
        if (s.isScanning) await s.stop();
        await s.clear();
      } catch {
        // ignore
      }
      setRunning(false);
    };

    start();
    return () => {
      cancelled = true;
      stop();
    };
  }, [open, onDetected]);

  const submitManual = (e: React.FormEvent) => {
    e.preventDefault();
    const c = manual.trim();
    if (!c) return;
    onDetected(c);
    setManual("");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="flex items-center gap-2">
            <Camera className="size-5 text-security" /> Escanear Extintor
          </DialogTitle>
          <DialogDescription>
            Aponte a câmera para o QR Code / código de barras do equipamento.
          </DialogDescription>
        </DialogHeader>
        <div className="bg-carbon relative">
          <div id={containerId} className="w-full aspect-square [&_video]:w-full [&_video]:h-full [&_video]:object-cover" />
          {!running && (
            <div className="absolute inset-0 flex items-center justify-center text-carbon-foreground text-sm">
              Iniciando câmera…
            </div>
          )}
        </div>
        <form onSubmit={submitManual} className="p-5 space-y-3 border-t border-border">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            Ou digite o código manualmente
          </p>
          <div className="flex gap-2">
            <input
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              placeholder="FG-XXXX"
              className="flex-1 h-10 px-3 rounded-md border border-border bg-background font-mono text-sm"
            />
            <Button type="submit" className="bg-carbon hover:bg-carbon/90 text-carbon-foreground">
              Buscar
            </Button>
          </div>
          <Button type="button" variant="ghost" className="w-full" onClick={onClose}>
            <X className="size-4" /> Cancelar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}