import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Mascot from '@/components/Mascot';

export const metadata: Metadata = {
  title: 'PaperVault',
  description: 'Previous year papers and class tests, organised by semester.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="app-shell">
          <Header />
          {children}
        </div>
        <Mascot/>
      </body>
    </html>
  );
}
