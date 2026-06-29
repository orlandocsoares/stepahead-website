import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "Saber Mais - Angola",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" suppressHydrationWarning>
      <head>
        {/* Aplica modo antes do primeiro render para evitar flash */}
        <script dangerouslySetInnerHTML={{ __html: `
(function(){
  try {
    var mode = localStorage.getItem('sabermais-mode') || 'escuro';
    var html = document.documentElement;
    if (mode === 'claro') html.classList.add('light');
    else if (mode === 'meio-escuro') html.classList.add('meio-escuro');
    else if (mode === 'meio-claro') html.classList.add('meio-claro');
    var thumbs = {
      'escuro': '/modos/escuro.png',
      'meio-escuro': '/modos/meio-escuro.webp',
      'meio-claro': '/modos/meio-claro.webp',
      'claro': '/modos/claro.webp'
    };
    html.style.setProperty('--dash-bg-image', "url('" + (thumbs[mode] || thumbs['escuro']) + "')");
  } catch(e) {}
})();
        ` }} />
      </head>
      <body className="antialiased bg-black text-white overflow-hidden selection:bg-blue-500/30">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}