import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import LayoutWrapper from '@/components/layout/LayoutWrapper';
import BettingSlip from '@/components/betting/BettingSlip';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Lets Bet - Sports Betting Platform',
  description: 'Experience the thrill of sports betting with Lets Bet',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
          <BettingSlip />
        </Providers>
      </body>
    </html>
  );
}