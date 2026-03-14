"use client";

import { useState } from "react";

import type { PDFDocumentMeta } from "@/types";

import styles from "./DocumentList.module.css";

function formatDate(d: Date): string {
  const date = new Date(d);
  return date.toLocaleString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

export function DocumentList(props: {
  documents: PDFDocumentMeta[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}): React.ReactNode {
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function remove(id: string): Promise<void> {
    setRemovingId(id);
    const res = await fetch(`/api/documents/${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => null);
    setRemovingId(null);
    if (res && res.ok) props.onRemove(id);
  }

  if (!props.documents.length) {
    return <p className={styles.empty}>Aún no has subido PDFs.</p>;
  }

  return (
    <div className={styles.list}>
      {props.documents.map((doc) => {
        const checked = props.selectedIds.includes(doc._id);
        return (
          <div className={styles.item} key={doc._id}>
            <div className={styles.topRow}>
              <input
                className={styles.checkbox}
                type="checkbox"
                checked={checked}
                onChange={() => props.onToggle(doc._id)}
                aria-label={`Usar ${doc.name} en el chat`}
              />
              <p className={styles.name} title={doc.name}>
                {doc.name}
              </p>
              <button
                className={styles.remove}
                onClick={() => void remove(doc._id)}
                disabled={removingId === doc._id}
                type="button"
                aria-label={`Eliminar ${doc.name}`}
                title="Eliminar"
              >
                ×
              </button>
            </div>
            <p className={styles.meta}>
              {doc.pageCount} pág · {doc.sizeKb} KB · {formatDate(doc.uploadedAt)}
            </p>
          </div>
        );
      })}
    </div>
  );
}

