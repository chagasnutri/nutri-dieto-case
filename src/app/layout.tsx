import React from 'react';
import Footer from '../components/Footer';
import { Analytics } from '@vercel/analytics/react';

export const metadata = {
  title: 'DietoCase - Laboratório interativo de Nutrição Clínica',
  description: 'Laboratório interativo de Nutrição Clínica: Simulação clínica, anamnese interativa e prontuário virtual.',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png'
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log('Analytics ativado no root');
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <script
          dangerouslySetInnerHTML={{
            __html: `console.log('Analytics ativado no root');`,
          }}
        />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="bg-slate-900 text-slate-100 min-h-screen flex flex-col justify-between antialiased selection:bg-emerald-500 selection:text-white">
        <div className="flex-1 w-full">
          {children}
        </div>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
