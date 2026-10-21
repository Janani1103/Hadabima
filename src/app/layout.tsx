import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import { LanguageProvider } from '@/lib/i18n/context';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Hadabima Sri Lanka Food Shop Management System',
  description:
    'Comprehensive role-based food shop management system for daily food assignment, preparation, locked staff pricing, POS billing, automatic kitchen staff settlements, advances, and P&L financial reconciliation.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`h-full antialiased ${poppins.variable}`}>
      <body className={`min-h-full flex flex-col bg-stone-50/60 text-stone-900 font-sans ${poppins.className}`}>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
