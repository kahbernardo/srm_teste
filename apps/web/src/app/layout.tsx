import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SRM Credit Engine',
  description: 'Plataforma de Cessão de Crédito Multimoedas',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
