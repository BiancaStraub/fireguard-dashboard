import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Camera, X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onDetected: (code: string) => void;
}

const CONTAINER_ID = "reader";

export function QrScanner({ open, onClose, onDetected }: Props) {
  const [manual, setManual] = useState("");
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const detectedRef = useRef(false);
  const onDetectedRef = useRef(onDetected);

  useEffect(() => {
    onDetectedRef.current = onDetected;
  }, [onDetected]);

  // Reset state when the dialog closes.
  useEffect(() => {
    if (!open) {
      setIsCameraOpen(false);
      detectedRef.current = false;
    }
  }, [open]);

  // Library handles the permission prompt itself on render(). No manual
  // getUserMedia — that double-request was locking the video track and
  // causing NotAllowedError / NotReadableError on mobile.
  useEffect(() => {
    if (!open || !isCameraOpen) return;

    detectedRef.current = false;

    const onScanSuccess = (decodedText: string) => {
      if (detectedRef.current) return;
      detectedRef.current = true;
      const code = decodedText.trim();
      const s = scannerRef.current;
      scannerRef.current = null;
      const finish = () => onDetectedRef.current(code);
      if (s) {
        s.clear().catch(console.error).finally(finish);
      } else {
        finish();
      }
    };
    const onScanFailure = () => {};

    // Small delay so the "reader" div is painted in the DOM before
    // Html5QrcodeScanner attaches to it.
    const timer = setTimeout(() => {
      const el = document.getElementById(CONTAINER_ID);
      if (!el) return;
      el.innerHTML = "";
      const scanner = new Html5QrcodeScanner(
        CONTAINER_ID,
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        false,
      );
      scanner.render(onScanSuccess, onScanFailure);
      scannerRef.current = scanner;
    }, 100);

    return () => {
      clearTimeout(timer);
      const s = scannerRef.current;
      scannerRef.current = null;
      if (s) s.clear().catch(console.error);
    };
  }, [open, isCameraOpen]);

  const submitManual = (e: React.FormEvent) => {
    e.preventDefault();
    const c = manual.trim();
    if (!c) return;
    detectedRef.current = true;
    setIsCameraOpen(false);
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
        <div className="bg-carbon relative min-h-[260px]">
          {!isCameraOpen ? (
            <div className="flex flex-col items-center justify-center gap-4 p-8 text-carbon-foreground text-center">
              <Camera className="size-12 opacity-80" />
              <p className="text-sm opacity-90">
                A câmera está desligada. Clique para ativar e permitir o acesso.
              </p>
              <Button
                type="button"
                size="lg"
                onClick={() => setIsCameraOpen(true)}
                className="bg-security text-security-foreground hover:bg-security/90 px-6 py-6 text-base"
              >
                <Camera className="size-5" /> Permitir e Abrir Câmera
              </Button>
            </div>
          ) : (
            <div className="p-3 space-y-3">
              <div
                id={CONTAINER_ID}
                className="w-full [&_video]:w-full [&_video]:rounded-md"
              />
              <Button
                type="button"
                variant="destructive"
                className="w-full"
                onClick={() => setIsCameraOpen(false)}
              >
                <X className="size-4" /> Fechar Câmera
              </Button>
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
          <Button type="button" variant="ghost" className="w-full" onClick={() => { setIsCameraOpen(false); onClose(); }}>
            <X className="size-4" /> Cancelar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}