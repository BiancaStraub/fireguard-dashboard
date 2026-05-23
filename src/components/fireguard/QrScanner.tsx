import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Camera, X, AlertTriangle } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onDetected: (code: string) => void;
}

const CONTAINER_ID = "fireguard-qr-reader";

export function QrScanner({ open, onClose, onDetected }: Props) {
  const [manual, setManual] = useState("");
  const [active, setActive] = useState(false);
  const [starting, setStarting] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const detectedRef = useRef(false);
  const onDetectedRef = useRef(onDetected);

  useEffect(() => {
    onDetectedRef.current = onDetected;
  }, [onDetected]);

  // Reset when dialog closes.
  useEffect(() => {
    if (!open) {
      setActive(false);
      setPermissionError(null);
      detectedRef.current = false;
    }
  }, [open]);

  // Camera lifecycle — guarded by `active` so it only starts after the user
  // clicks "Ativar Câmera". A local `scannerInstance` ensures React Strict
  // Mode's double mount can't leave zombie cameras: each mount owns its own
  // instance and the cleanup stops/clears exactly that one.
  useEffect(() => {
    if (!open || !active) return;

    let scannerInstance: Html5Qrcode | null = null;
    let cancelled = false;
    detectedRef.current = false;
    setStarting(true);
    setPermissionError(null);

    const el = document.getElementById(CONTAINER_ID);
    if (el) el.innerHTML = "";

    scannerInstance = new Html5Qrcode(CONTAINER_ID, { verbose: false });

    const onScanSuccess = (decodedText: string) => {
      if (detectedRef.current) return;
      detectedRef.current = true;
      const code = decodedText.trim();
      const s = scannerInstance;
      scannerInstance = null;
      const finish = () => onDetectedRef.current(code);
      if (s) {
        (s.isScanning ? s.stop() : Promise.resolve())
          .then(() => s.clear())
          .catch(() => undefined)
          .finally(finish);
      } else {
        finish();
      }
    };
    const onScanFailure = () => {};

    // Force the native permission prompt with an explicit getUserMedia call
    // tied to the user gesture (button click). Some browsers (Safari iOS,
    // Chrome Android) won't show the prompt if the camera is started only
    // through a third-party library on page load.
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: "environment" } } })
      .then((stream) => {
        // Release the probe stream — Html5Qrcode opens its own.
        stream.getTracks().forEach((t) => t.stop());
        if (cancelled || !scannerInstance) return Promise.resolve();
        return scannerInstance.start(
          { facingMode: { ideal: "environment" } },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          onScanSuccess,
          onScanFailure,
        );
      })
      .then(() => {
        if (cancelled && scannerInstance) {
          const s = scannerInstance;
          scannerInstance = null;
          s.stop().then(() => s.clear()).catch(() => undefined);
        }
      })
      .catch((err: unknown) => {
        console.error(err);
        const name = (err as { name?: string })?.name ?? "";
        if (name === "NotAllowedError" || name === "PermissionDeniedError") {
          setPermissionError("Permissão negada ou câmera não encontrada. Por favor, libere o acesso nas configurações do navegador.");
        } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
          setPermissionError("Permissão negada ou câmera não encontrada. Por favor, libere o acesso nas configurações do navegador.");
        } else {
          setPermissionError("Não foi possível iniciar a câmera. Tente novamente ou use o modo manual.");
        }
        setActive(false);
        scannerInstance = null;
      })
      .finally(() => {
        if (!cancelled) setStarting(false);
      });

    return () => {
      cancelled = true;
      const s = scannerInstance;
      scannerInstance = null;
      if (s) {
        (s.isScanning ? s.stop() : Promise.resolve())
          .then(() => s.clear())
          .catch(console.error);
      }
    };
  }, [open, active]);

  const submitManual = (e: React.FormEvent) => {
    e.preventDefault();
    const c = manual.trim();
    if (!c) return;
    detectedRef.current = true;
    setActive(false);
    onDetectedRef.current(c);
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
          <div id={CONTAINER_ID} className="w-full aspect-square [&_video]:w-full [&_video]:h-full [&_video]:object-cover" />
          {!active && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-carbon-foreground text-center">
              {permissionError ? (
                <>
                  <AlertTriangle className="size-8 text-red-500" />
                  <p className="text-sm text-red-400 font-medium">{permissionError}</p>
                  <Button
                    type="button"
                    size="lg"
                    onClick={() => setActive(true)}
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
                    size="lg"
                    onClick={() => setActive(true)}
                    disabled={starting}
                    className="bg-security text-security-foreground hover:bg-security/90 px-6 py-6 text-base"
                  >
                    <Camera className="size-5" /> Permitir e Abrir Câmera
                  </Button>
                </>
              )}
            </div>
          )}
          {active && starting && (
            <div className="absolute inset-0 flex items-center justify-center text-carbon-foreground/80 text-sm">
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
          <Button type="button" variant="ghost" className="w-full" onClick={() => { setActive(false); onClose(); }}>
            <X className="size-4" /> Cancelar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}