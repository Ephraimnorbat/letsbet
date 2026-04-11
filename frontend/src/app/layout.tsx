import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import LayoutWrapper from '@/components/layout/LayoutWrapper';
import BettingSlip from '@/components/betting/BettingSlip';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Unibet 360 - Sports Betting Platform',
  description: 'Experience the thrill of sports betting with Lets Bet',
};

// src/app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-slate-950 text-white`}>
        <Providers>
          <LayoutWrapper>
            <div className="flex flex-col lg:flex-row gap-6 container mx-auto px-4 py-8">
              {/* Main Feed */}
              <main className="flex-1 min-w-0">
                {children}
              </main>

              {/* Desktop Betting Slip (Hidden on mobile via CSS or prop) */}
              <aside className="hidden lg:block w-80 shrink-0 sticky top-24 h-[calc(100vh-120px)]">
                <BettingSlip />
              </aside>
            </div>
            
            {/* Mobile Betting Slip (Triggered by FAB) */}
            <div className="lg:hidden">
              <BettingSlip isMobile={true} />
            </div>
          </LayoutWrapper>
        </Providers>
      </body>
    </html>
  );
}