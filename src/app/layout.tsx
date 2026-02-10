import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Programa Saber Mais',
  description: 'Plataforma de Cooperação Educativa.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body className="font-body antialiased bg-black" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}