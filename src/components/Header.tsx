"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import styles from "./Header.module.css";

export function Header(): React.ReactNode {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);

  async function logout(): Promise<void> {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    router.push("/login");
    router.refresh();
  }

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <div className={styles.logo} aria-hidden>
          ⬡
        </div>
        <div>PDF Agent</div>
      </div>

      <div className={styles.right}>
        <button className={styles.button} onClick={logout} disabled={loading} type="button">
          {loading ? "Saliendo…" : "Salir"}
        </button>
      </div>
    </header>
  );
}

