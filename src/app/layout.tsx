import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import QueryProvider from '@/providers/query-provider';
import { Toaster } from '@/components/ui/sonner'; // Pastikan sudah install toast

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Sneakers Flash Admin',
  description: 'Backoffice System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          {children}
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}