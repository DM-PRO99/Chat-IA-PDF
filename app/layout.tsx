import type { Metadata } from "next";
import { IBM_Plex_Mono, Syne } from "next/font/google";

import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PDF Agent",
  description: "Agente personal para analizar PDFs privados",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactNode {
  return (
    <html lang="es">
      <body className={`${syne.variable} ${plexMono.variable}`}>
        {children}
      </body>
    </html>
  );
}


