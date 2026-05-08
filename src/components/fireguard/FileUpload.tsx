import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2, Paperclip } from "lucide-react";
import { uploadAnexo, type Anexo } from "@/lib/fireguard/services";
import { toast } from "sonner";

type Props = {
  label?: string;
  accept?: string;
  prefix?: string;
  multiple?: boolean;
  capture?: "user" | "environment";
  values: Anexo[];
  onChange: (next: Anexo[]) => void;
};

export function FileUpload({ label = "Anexar arquivo", accept, prefix, multiple = true, capture, values, onChange }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handle = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      const uploaded: Anexo[] = [];
      for (const f of Array.from(files)) {
        if (f.size > 10 * 1024 * 1024) { toast.error(`${f.name}: máximo 10MB`); continue; }
        const a = await uploadAnexo(f, prefix);
        uploaded.push(a);
      }
      onChange([...values, ...uploaded]);
      if (uploaded.length) toast.success(`${uploaded.length} arquivo(s) anexado(s)`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha no upload");
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => ref.current?.click()} disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          {label}
        </Button>
        <input
          ref={ref}
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          {...(capture ? { capture } : {})}
          onChange={(e) => handle(e.target.files)}
        />
      </div>
      {values.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {values.map((a, i) => {
            const isImg = a.type?.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/i.test(a.url);
            return (
              <div key={i} className="relative group border border-border rounded-lg overflow-hidden bg-secondary/30">
                {isImg ? (
                  <a href={a.url} target="_blank" rel="noreferrer">
                    <img src={a.url} alt={a.name} className="w-full h-24 object-cover" />
                  </a>
                ) : (
                  <a href={a.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-3 text-xs h-24">
                    <Paperclip className="size-4 shrink-0" />
                    <span className="truncate">{a.name}</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => onChange(values.filter((_, j) => j !== i))}
                  className="absolute top-1 right-1 bg-background/80 hover:bg-security hover:text-security-foreground rounded-full p-1 transition-colors"
                >
                  <X className="size-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}