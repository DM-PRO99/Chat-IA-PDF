"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import styles from "./login.module.css";

type LoginState = "idle" | "loading" | "error";

export default function LoginPage(): React.ReactNode {
  const router = useRouter();
  const params = useSearchParams();
  const from = useMemo(() => params.get("from") ?? "/dashboard", [params]);

  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [state, setState] = useState<LoginState>("idle");
  const [error, setError] = useState<string>("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setState("loading");
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const data: unknown = await res.json().catch(() => null);
      const msg =
        typeof data === "object" && data && "error" in data && typeof (data as { error?: unknown }).error === "string"
          ? (data as { error: string }).error
          : "No se pudo iniciar sesión.";
      setState("error");
      setError(msg);
      return;
    }

    setState("idle");
    router.push(from);
    router.refresh();
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.titleRow}>
          <div className={styles.logo} aria-hidden>
            ⬡
          </div>
          <h1 className={styles.title}>PDF Agent</h1>
        </div>
        <p className={styles.subtitle}>
          Inicia sesión para analizar tus PDFs privados. Tu sesión usa una cookie httpOnly con JWT.
        </p>

        <form className={styles.form} onSubmit={onSubmit}>
          <label className={styles.label}>
            Usuario
            <input
              className={styles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label className={styles.label}>
            Contraseña
            <input
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          <button className={styles.button} disabled={state === "loading"} type="submit">
            {state === "loading" ? "Entrando…" : "Entrar"}
          </button>
        </form>

        {error ? <p className={styles.error}>{error}</p> : null}
      </div>
    </div>
  );
}

