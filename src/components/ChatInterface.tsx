"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

import type { ChatMessage } from "@/types";

import { ChatMessage as ChatMessageComponent } from "./ChatMessage";
import styles from "./ChatInterface.module.css";

type ChatState = "idle" | "loading";

function lastNHistory(messages: ChatMessage[], n: number): Array<{ role: "user" | "assistant"; content: string }> {
  const trimmed = messages.slice(-n);
  return trimmed.map((m) => ({ role: m.role, content: m.content }));
}

export function ChatInterface(props: {
  sessionId: string | null;
  selectedDocIds: string[];
  hasDocuments: boolean;
}): React.ReactNode {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>("");
  const [state, setState] = useState<ChatState>("idle");

  const listRef = useRef<HTMLDivElement | null>(null);

  const disabledReason = useMemo(() => {
    if (!props.hasDocuments) return "Sube un PDF para empezar.";
    if (!props.selectedDocIds.length) return "Selecciona al menos un documento.";
    if (!props.sessionId) return "Sube un PDF para crear una sesión.";
    return null;
  }, [props.hasDocuments, props.selectedDocIds.length, props.sessionId]);

  const canSend = !disabledReason && state !== "loading" && input.trim().length > 0;

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, state]);

  async function send(): Promise<void> {
    if (!props.sessionId) return;
    const text = input.trim();
    if (!text) return;

    setInput("");
    setState("loading");

    const userMsg: ChatMessage = {
      id: uuidv4(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    const assistantId = uuidv4();
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
    };

    let baseMessages: ChatMessage[] = [];
    setMessages((prev) => {
      baseMessages = [...prev, userMsg, assistantMsg];
      return baseMessages;
    });

    const history = lastNHistory(baseMessages.filter((m) => m.id !== assistantId), 20);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        sessionId: props.sessionId,
        documentIds: props.selectedDocIds,
        history,
      }),
    }).catch(() => null);

    if (!res || !res.ok || !res.body) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: "No se pudo obtener respuesta del servidor." } : m
        )
      );
      setState("idle");
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let assistantText = "";

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        assistantText += decoder.decode(value, { stream: true });
        setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: assistantText } : m)));
      }
    } finally {
      reader.releaseLock();
      setState("idle");
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.messages} ref={listRef}>
        {!messages.length ? (
          <div className={styles.empty}>
            {disabledReason ? (
              <p style={{ margin: 0 }}>{disabledReason}</p>
            ) : (
              <p style={{ margin: 0 }}>
                Pregunta cualquier cosa sobre los documentos seleccionados. El asistente responderá solo con lo que esté
                en tus PDFs.
              </p>
            )}
          </div>
        ) : null}

        {messages.map((m) => (
          <ChatMessageComponent key={m.id} message={m} />
        ))}
      </div>

      <div className={styles.composer}>
        <div className={styles.composerInner}>
          <textarea
            className={styles.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={disabledReason ?? "Escribe tu pregunta…"}
            disabled={!!disabledReason || state === "loading"}
            rows={2}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                void send();
              }
            }}
          />
          <button className={styles.send} disabled={!canSend} type="button" onClick={() => void send()}>
            {state === "loading" ? "…" : "Enviar"}
          </button>
        </div>
        <p className={styles.helper}>Tip: Ctrl/⌘ + Enter para enviar.</p>
      </div>
    </div>
  );
}

