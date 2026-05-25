import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Suspense } from 'react';
import './globals.css';
import { Providers } from './providers';
import LayoutWrapper from '@/components/layout/LayoutWrapper';
import BettingSlip from '@/components/betting/BettingSlip';
import ShareParamsListener from '@/components/betting/ShareParamsListener';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Unibet 360 - Sports Betting Platform',
  description: 'Experience the thrill of sports betting with Lets Bet',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-slate-950 text-white`}>
        <Providers>
          {/* Suspense fallback guarantees Next.js build optimization tags stay clean */}
          <Suspense fallback={null}>
            <ShareParamsListener />
          </Suspense>

          <LayoutWrapper>
            <div className="flex flex-col lg:flex-row gap-6 container mx-auto px-4 py-8">
              {/* Main Feed */}
              <main className="flex-1 min-w-0">
                {children}
              </main>

              {/* Desktop Betting Slip */}
              <aside className="hidden lg:block w-80 shrink-0 sticky top-24 h-[calc(100vh-120px)]">
                <BettingSlip />
              </aside>
            </div>
            
            {/* Mobile Betting Slip */}
            <div className="lg:hidden">
              <BettingSlip isMobile={true} />
            </div>
          </LayoutWrapper>
        </Providers>
      </body>
    </html>
  );
}