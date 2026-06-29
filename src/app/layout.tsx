import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Saber Mais - Angola",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body className="antialiased bg-black text-white overflow-hidden selection:bg-blue-500/30">
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}