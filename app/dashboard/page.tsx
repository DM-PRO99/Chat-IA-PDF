 "use client";

import { useEffect, useMemo, useState } from "react";

import { ChatInterface } from "@/components/ChatInterface";
import { DocumentList } from "@/components/DocumentList";
import { Header } from "@/components/Header";
import { PDFUploader } from "@/components/PDFUploader";
import type { PDFDocumentMeta } from "@/types";

import styles from "./dashboard.module.css";

type DocsState = "idle" | "loading" | "error";

export default function DashboardPage(): React.ReactNode {
  const [documents, setDocuments] = useState<PDFDocumentMeta[]>([]);
  const [docsState, setDocsState] = useState<DocsState>("loading");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const hasDocuments = documents.length > 0;
  const selectedDocIds = useMemo(
    () => selectedIds.filter((id) => documents.some((d) => d._id === id)),
    [selectedIds, documents]
  );

  useEffect(() => {
    let cancelled = false;
    async function load(): Promise<void> {
      setDocsState("loading");
      const res = await fetch("/api/documents", { cache: "no-store" });
      if (!res.ok) {
        if (!cancelled) setDocsState("error");
        return;
      }
      const data: unknown = await res.json();
      if (!Array.isArray(data)) {
        if (!cancelled) setDocsState("error");
        return;
      }

      const parsed: PDFDocumentMeta[] = data
        .map((d) => {
          if (!d || typeof d !== "object") return null;
          const obj = d as Record<string, unknown>;
          const _id = typeof obj._id === "string" ? obj._id : null;
          const name = typeof obj.name === "string" ? obj.name : null;
          const pageCount = typeof obj.pageCount === "number" ? obj.pageCount : null;
          const sizeKb = typeof obj.sizeKb === "number" ? obj.sizeKb : null;
          const uploadedAt =
            typeof obj.uploadedAt === "string" || obj.uploadedAt instanceof Date
              ? new Date(String(obj.uploadedAt))
              : null;
          if (!_id || !name || !uploadedAt || pageCount === null || sizeKb === null) return null;
          return { _id, name, uploadedAt, pageCount, sizeKb };
        })
        .filter((x): x is PDFDocumentMeta => x !== null);

      if (!cancelled) {
        setDocuments(parsed);
        setDocsState("idle");
        if (parsed.length && selectedIds.length === 0) {
          setSelectedIds([parsed[0]._id]);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onToggle(id: string): void {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function onRemove(id: string): void {
    setDocuments((prev) => prev.filter((d) => d._id !== id));
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  }

  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.main}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarInner}>
            <PDFUploader
              sessionId={sessionId}
              onUploadSuccess={(doc, newSessionId) => {
                setSessionId(newSessionId);
                setDocuments((prev) => [doc, ...prev]);
                setSelectedIds((prev) => (prev.includes(doc._id) ? prev : [doc._id, ...prev]));
              }}
            />

            <p className={styles.sectionTitle}>Documentos</p>
            <DocumentList
              documents={documents}
              selectedIds={selectedDocIds}
              onToggle={onToggle}
              onRemove={onRemove}
            />
            {docsState === "error" ? (
              <p style={{ color: "var(--error)", margin: 0, fontSize: 13 }}>
                No se pudo cargar la lista de documentos.
              </p>
            ) : null}
          </div>
        </aside>

        <section className={styles.chat}>
          <ChatInterface
            sessionId={sessionId}
            selectedDocIds={selectedDocIds}
            hasDocuments={hasDocuments}
          />
        </section>
      </div>
    </div>
  );
}



