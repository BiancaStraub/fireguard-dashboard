import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Camera, X, AlertTriangle } from "lucide-react";
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
  const [starting, setStarting] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const detectedRef = useRef(false);

  const stopScanner = async () => {
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

  const startScanner = async () => {
    if (scannerRef.current || starting) return;
    setPermissionError(null);
    setStarting(true);
    detectedRef.current = false;
    try {
      const el = document.getElementById(containerId);
      if (el) el.innerHTML = "";
      const scanner = new Html5Qrcode(containerId, { verbose: false });
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: { ideal: "environment" } },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => {
          if (detectedRef.current) return;
          detectedRef.current = true;
          const code = decodedText.trim();
          stopScanner().finally(() => onDetected(code));
        },
        () => {}
      );
      setRunning(true);
    } catch (err) {
      console.error(err);
      scannerRef.current = null;
      const name = (err as { name?: string })?.name ?? "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setPermissionError("Permissão negada. Por favor, libere o acesso à câmera nas configurações do seu navegador.");
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setPermissionError("Nenhuma câmera foi encontrada neste dispositivo. Use o modo manual abaixo.");
      } else {
        setPermissionError("Não foi possível iniciar a câmera. Tente novamente ou use o modo manual abaixo.");
      }
    } finally {
      setStarting(false);
    }
  };

  // Always stop the scanner when the dialog closes or component unmounts.
  useEffect(() => {
    if (!open) {
      stopScanner();
      setPermissionError(null);
    }
    return () => {
      stopScanner();
    };
  }, [open]);

  const submitManual = (e: React.FormEvent) => {
    e.preventDefault();
    const c = manual.trim();
    if (!c) return;
    detectedRef.current = true;
    stopScanner();
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
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-carbon-foreground text-center">
              {permissionError ? (
                <>
                  <AlertTriangle className="size-8 text-amber-400" />
                  <p className="text-sm">{permissionError}</p>
                  <Button
                    type="button"
                    onClick={startScanner}
                    disabled={starting}
                    className="bg-security text-security-foreground hover:bg-security/90"
                  >
                    <Camera className="size-4" /> Tentar novamente
                  </Button>
                </>
              ) : (
                <>
                  <Camera className="size-10 opacity-80" />
                  <p className="text-sm opacity-90">
                    Para escanear, libere o acesso à câmera do seu dispositivo.
                  </p>
                  <Button
                    type="button"
                    onClick={startScanner}
                    disabled={starting}
                    className="bg-security text-security-foreground hover:bg-security/90"
                  >
                    <Camera className="size-4" />
                    {starting ? "Iniciando…" : "Ativar Câmera para Escanear"}
                  </Button>
                </>
              )}
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
          <Button type="button" variant="ghost" className="w-full" onClick={() => { stopScanner(); onClose(); }}>
            <X className="size-4" /> Cancelar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}