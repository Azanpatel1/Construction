import { useCallback, useEffect, useRef, useState } from "react";
import { Upload, X, FileImage, FileType2 } from "lucide-react";

const ACCEPT = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "application/pdf",
];
const ACCEPT_EXT = ".png,.jpg,.jpeg,.webp,.gif,.pdf";
const MAX_MB = 12;

export interface DrawingFile {
  file: File;
  previewUrl: string;
  isPdf: boolean;
}

interface Props {
  locationLabel?: string;
  /** Reset when scenario changes */
  resetKey?: string;
}

export function DrawingUpload({ locationLabel, resetKey }: Props) {
  const [drawing, setDrawing] = useState<DrawingFile | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (drawing?.previewUrl) URL.revokeObjectURL(drawing.previewUrl);
    };
  }, [drawing?.previewUrl]);

  useEffect(() => {
    setDrawing((prev) => {
      if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl);
      return null;
    });
    setError(null);
  }, [resetKey]);

  const applyFile = useCallback((file: File) => {
    setError(null);
    if (!ACCEPT.includes(file.type)) {
      setError("Use PNG, JPG, WebP, GIF, or PDF.");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`File must be under ${MAX_MB} MB.`);
      return;
    }
    setDrawing((prev) => {
      if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl);
      return {
        file,
        previewUrl: URL.createObjectURL(file),
        isPdf: file.type === "application/pdf",
      };
    });
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) applyFile(file);
    },
    [applyFile]
  );

  const clear = useCallback(() => {
    setDrawing((prev) => {
      if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl);
      return null;
    });
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  if (drawing) {
    return (
      <div className="aspect-[4/5] rounded-md border border-line bg-ink-850 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-line bg-ink-800/40">
          <div className="flex items-center gap-1.5 min-w-0 text-xs text-muted">
            {drawing.isPdf ? (
              <FileType2 className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <FileImage className="w-3.5 h-3.5 shrink-0" />
            )}
            <span className="truncate font-medium text-text/80">
              {drawing.file.name}
            </span>
          </div>
          <button
            type="button"
            onClick={clear}
            className="p-1 rounded text-muted hover:text-text hover:bg-ink-800 transition"
            aria-label="Remove drawing"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex-1 min-h-0 relative bg-ink-800/30">
          {drawing.isPdf ? (
            <iframe
              title="Drawing preview"
              src={drawing.previewUrl}
              className="absolute inset-0 w-full h-full border-0"
            />
          ) : (
            <img
              src={drawing.previewUrl}
              alt="Uploaded drawing"
              className="absolute inset-0 w-full h-full object-contain"
            />
          )}
        </div>
        {locationLabel && (
          <div className="px-3 py-2 text-xs text-muted truncate border-t border-line">
            {locationLabel}
          </div>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-xs text-gold-600 hover:text-gold-500 py-2 border-t border-line transition"
        >
          Replace file
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_EXT}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) applyFile(f);
          }}
        />
      </div>
    );
  }

  return (
    <div className="aspect-[4/5] flex flex-col">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_EXT}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) applyFile(f);
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragOver(false);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className={`flex-1 rounded-md border-2 border-dashed flex flex-col items-center justify-center gap-3 px-4 transition ${
          dragOver
            ? "border-gold-500/50 bg-gold-500/5"
            : "border-line bg-ink-800/30 hover:border-gold-500/30 hover:bg-ink-800/50"
        }`}
      >
        <div
          className={`p-3 rounded-full border transition ${
            dragOver ? "border-gold-500/40 bg-gold-500/10" : "border-line bg-ink-850"
          }`}
        >
          <Upload
            className={`w-5 h-5 ${dragOver ? "text-gold-600" : "text-muted"}`}
            strokeWidth={1.5}
          />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-text">
            Drop drawing here
          </p>
          <p className="mt-1 text-xs text-muted leading-relaxed">
            or click to browse
          </p>
          <p className="mt-2 text-[10px] text-muted/80">
            PNG, JPG, WebP, PDF · max {MAX_MB} MB
          </p>
        </div>
      </button>
      {error && (
        <p className="mt-2 text-xs text-signal-red" role="alert">
          {error}
        </p>
      )}
      {locationLabel && !error && (
        <p className="mt-2 text-xs text-muted truncate">{locationLabel}</p>
      )}
    </div>
  );
}
