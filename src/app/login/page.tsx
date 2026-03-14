"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useMemo, useState, Suspense } from "react";

import styles from "./login.module.css";

type LoginState = "idle" | "loading" | "error";
type AuthMode = "login" | "register";

function LoginContent(): React.ReactNode {
  const router = useRouter();
  const params = useSearchParams();
  const from = useMemo(() => params.get("from") ?? "/dashboard", [params]);

  const [mode, setMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [state, setState] = useState<LoginState>("idle");
  const [error, setError] = useState<string>("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setState("loading");
    setError("");

    // Validaciones básicas
    if (!username.trim()) {
      setError("El usuario es requerido.");
      setState("idle");
      return;
    }

    if (!password) {
      setError("La contraseña es requerida.");
      setState("idle");
      return;
    }

    if (mode === "register" && password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      setState("idle");
      return;
    }

    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username.toLowerCase().trim(), password }),
    });

    if (!res.ok) {
      const data: unknown = await res.json().catch(() => null);
      const msg =
        typeof data === "object" && data && "error" in data && typeof (data as { error?: unknown }).error === "string"
          ? (data as { error: string }).error
          : mode === "login"
            ? "No se pudo iniciar sesión."
            : "No se pudo registrar el usuario.";
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
          {mode === "login"
            ? "Inicia sesión para analizar tus PDFs privados."
            : "Crea una cuenta para comenzar a analizar PDFs."}
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
              minLength={3}
              maxLength={100}
            />
          </label>
          <label className={styles.label}>
            Contraseña
            <input
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              minLength={6}
              maxLength={200}
            />
          </label>
          {mode === "register" && (
            <label className={styles.label}>
              Confirmar Contraseña
              <input
                className={styles.input}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                maxLength={200}
              />
            </label>
          )}
          <button className={styles.button} disabled={state === "loading"} type="submit">
            {state === "loading" ? "Procesando…" : mode === "login" ? "Entrar" : "Registrarse"}
          </button>
        </form>

        {error ? <p className={styles.error}>{error}</p> : null}

        <div className={styles.toggleMode}>
          {mode === "login" ? (
            <>
              ¿No tienes cuenta?{" "}
              <button
                className={styles.linkButton}
                onClick={() => {
                  setMode("register");
                  setError("");
                  setPassword("");
                  setConfirmPassword("");
                }}
                type="button"
              >
                Regístrate
              </button>
            </>
          ) : (
            <>
              ¿Ya tienes cuenta?{" "}
              <button
                className={styles.linkButton}
                onClick={() => {
                  setMode("login");
                  setError("");
                  setPassword("");
                  setConfirmPassword("");
                }}
                type="button"
              >
                Inicia sesión
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage(): React.ReactNode {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <LoginContent />
    </Suspense>
  );
}

