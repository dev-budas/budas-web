"use client";

import { useState, useRef } from "react";
import { Paperclip, Trash2, Download, Loader2, UploadCloud, FileText, Image } from "lucide-react";
import type { LeadFile } from "@/types";

interface FilesSectionProps {
  leadId: string;
  initialFiles: LeadFile[];
}

function fileIcon(contentType: string) {
  if (contentType.startsWith("image/")) return <Image className="w-4 h-4 text-blue-500" />;
  return <FileText className="w-4 h-4 text-muted-foreground" />;
}

function formatBytes(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FilesSection({ leadId, initialFiles }: FilesSectionProps) {
  const [files, setFiles] = useState<LeadFile[]>(initialFiles);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("leadId", leadId);

      const res = await fetch("/api/files/upload", { method: "POST", body: formData });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Error al subir el archivo");
        return;
      }

      // Optimistically add the new file to the list
      const newFile: LeadFile = {
        id: json.fileId,
        lead_id: leadId,
        filename: file.name,
        storage_path: json.storagePath,
        content_type: file.type,
        size_bytes: file.size,
        created_at: new Date().toISOString(),
      };
      setFiles((prev) => [newFile, ...prev]);
    } catch {
      setError("Error de conexión al subir el archivo");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleDownload(fileId: string, filename: string) {
    const res = await fetch(`/api/files/${fileId}`);
    if (!res.ok) return;
    const { url } = await res.json();
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.target = "_blank";
    a.click();
  }

  async function handleDelete(fileId: string) {
    setDeletingId(fileId);
    try {
      const res = await fetch(`/api/files/${fileId}`, { method: "DELETE" });
      if (res.ok) {
        setFiles((prev) => prev.filter((f) => f.id !== fileId));
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      {/* Upload button */}
      <div className="mb-4">
        <label
          className={`flex items-center gap-2 w-full justify-center border-2 border-dashed border-border rounded-lg px-4 py-3 text-sm text-muted-foreground cursor-pointer hover:border-accent/60 hover:text-foreground transition-colors ${
            uploading ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <UploadCloud className="w-4 h-4" />
          )}
          {uploading ? "Subiendo..." : "Subir archivo o foto"}
          <input
            ref={inputRef}
            type="file"
            className="sr-only"
            accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
        <p className="text-[11px] text-muted-foreground mt-1.5 text-center">
          JPG, PNG, WEBP, HEIC, PDF · Máx. 20 MB
        </p>
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-500 mb-3">{error}</p>
      )}

      {/* File list */}
      {files.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">No hay archivos adjuntos</p>
      ) : (
        <ul className="space-y-2">
          {files.map((file) => (
            <li
              key={file.id}
              className="flex items-center gap-3 bg-background/60 border border-border rounded-lg px-3 py-2.5"
            >
              <div className="flex-shrink-0">{fileIcon(file.content_type)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{file.filename}</p>
                {file.size_bytes && (
                  <p className="text-[10px] text-muted-foreground">{formatBytes(file.size_bytes)}</p>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => handleDownload(file.id, file.filename)}
                  className="p-1.5 rounded-md hover:bg-border/60 text-muted-foreground hover:text-foreground transition-colors"
                  title="Descargar"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(file.id)}
                  disabled={deletingId === file.id}
                  className="p-1.5 rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-40"
                  title="Eliminar"
                >
                  {deletingId === file.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
