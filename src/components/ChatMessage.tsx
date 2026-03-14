"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import type { ChatMessage as ChatMessageT } from "@/types";

import styles from "./ChatMessage.module.css";

function formatTime(d: Date): string {
  const date = new Date(d);
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export function ChatMessage(props: { message: ChatMessageT }): React.ReactNode {
  const isUser = props.message.role === "user";

  return (
    <div className={`${styles.row} ${isUser ? styles.rowUser : ""}`}>
      {!isUser ? (
        <div className={styles.avatar} aria-hidden>
          ⬡
        </div>
      ) : null}

      <div className={`${styles.bubble} ${isUser ? styles.bubbleUser : ""}`}>
        <div className={styles.content}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{props.message.content}</ReactMarkdown>
        </div>
        <div className={styles.time}>{formatTime(props.message.timestamp)}</div>
      </div>
    </div>
  );
}

