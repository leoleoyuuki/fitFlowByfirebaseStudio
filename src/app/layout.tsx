
import type {Metadata} from 'next';
import {Geist, Geist_Mono} from 'next/font/google';
import './globals.css';
import './print-styles.css'; // Adicionado para estilos de impressão
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/auth-context';
import { APP_NAME } from '@/lib/constants';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: `FitFlow Pro | Otimize a Entrega de Planos de Treino na sua Academia`,
  description: `A ferramenta de IA para academias que desejam agilizar a prescrição de treinos, padronizar a qualidade e aumentar a retenção de alunos. Entregue valor desde o primeiro dia.`,
  verification: {
    google: 'LanYmw2rzu3NmtiBG-OAQXNiuT-i_A0QkI-6F9qmRM4',
  },
  icons: {
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_NAME,
  },
  other: {
    'mobile-web-app-capable': 'yes',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
