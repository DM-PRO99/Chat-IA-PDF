"use client";

import { useMemo, useRef, useState } from "react";

import type { PDFDocumentMeta, UploadResponse } from "@/types";

import styles from "./PDFUploader.module.css";

type UploadState = "idle" | "uploading" | "success" | "error";

export function PDFUploader(props: {
  sessionId: string | null;
  onUploadSuccess: (doc: PDFDocumentMeta, sessionId: string) => void;
}): React.ReactNode {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState<number>(0);
  const [message, setMessage] = useState<string>("");

  const canInteract = state !== "uploading";

  const progressStyle = useMemo(() => {
    const w = `${Math.max(0, Math.min(100, progress))}%`;
    return { ["--w" as const]: w } as React.CSSProperties;
  }, [progress]);

  function openPicker(): void {
    fileInputRef.current?.click();
  }

  function validateFile(file: File): string | null {
    if (!file.name.toLowerCase().endsWith(".pdf") || file.type !== "application/pdf") {
      return "Solo se permiten archivos PDF.";
    }
    if (file.size > 10 * 1024 * 1024) {
      return "El PDF excede 10MB.";
    }
    return null;
  }

  function upload(file: File): void {
    const error = validateFile(file);
    if (error) {
      setState("error");
      setMessage(error);
      return;
    }

    setState("uploading");
    setProgress(0);
    setMessage("Subiendo y extrayendo texto…");

    const fd = new FormData();
    fd.set("file", file);
    if (props.sessionId) fd.set("sessionId", props.sessionId);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");

    xhr.upload.onprogress = (evt: ProgressEvent<EventTarget>) => {
      if (!evt.lengthComputable) return;
      const pct = Math.round((evt.loaded / evt.total) * 100);
      setProgress(pct);
    };

    xhr.onerror = () => {
      setState("error");
      setMessage("Error de red al subir el PDF.");
    };

    xhr.onload = () => {
      const ok = xhr.status >= 200 && xhr.status < 300;
      const parsed: UploadResponse | null = (() => {
        try {
          const json: unknown = JSON.parse(xhr.responseText);
          return json as UploadResponse;
        } catch {
          return null;
        }
      })();

      if (!ok || !parsed?.success || !parsed.document || !parsed.sessionId) {
        setState("error");
        setMessage(parsed?.error ?? "No se pudo procesar el PDF.");
        return;
      }

      const doc: PDFDocumentMeta = {
        ...parsed.document,
        uploadedAt: new Date(parsed.document.uploadedAt),
      };

      setState("success");
      setProgress(100);
      setMessage("PDF listo. Ya puedes hacer preguntas.");
      props.onUploadSuccess(doc, parsed.sessionId);
    };

    xhr.send(fd);
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>): void {
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (file) upload(file);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>): void {
    e.preventDefault();
    if (!canInteract) return;
    const file = e.dataTransfer.files?.[0] ?? null;
    if (file) upload(file);
  }

  return (
    <div
      className={styles.box}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      role="region"
      aria-label="Subir PDF"
    >
      <div className={styles.row}>
        <p className={styles.title}>Subir PDF</p>
      </div>

      <p className={styles.hint}>
        Arrastra y suelta un PDF aquí o selecciónalo. Máximo 10MB. El texto se guarda en MongoDB para poder consultarlo.
      </p>

      <div className={styles.actions}>
        <button className={`${styles.button} ${styles.buttonPrimary}`} onClick={openPicker} disabled={!canInteract} type="button">
          Seleccionar PDF
        </button>
        <button
          className={styles.button}
          onClick={() => {
            setState("idle");
            setMessage("");
            setProgress(0);
          }}
          disabled={!canInteract}
          type="button"
        >
          Reiniciar
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={onPick}
        style={{ display: "none" }}
      />

      {state === "uploading" ? (
        <div className={styles.progress} aria-label="Progreso">
          <div className={styles.bar} style={progressStyle} />
        </div>
      ) : null}

      {message ? (
        <p
          className={`${styles.status} ${state === "error" ? styles.error : ""} ${state === "success" ? styles.success : ""}`}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}

