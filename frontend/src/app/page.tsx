'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Zap, Shield, Gift } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import FeaturedSports from '@/components/home/FeaturedSports';
import HeroSlider from '@/components/ui/HeroSlider';
import { useUpcomingOdds } from '@/lib/api/hooks/useMatches';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function Home() {
  const { user } = useAuthStore();
  const [activeLeague, setActiveLeague] = useState<string | null>(null);

  const currencySymbol = user?.currency_symbol || '$';
  const exchangeRate = user?.exchange_rate || 1;
  const dynamicBonusCap = 100 / exchangeRate;

  // ✅ Fetch matches from Odds API
  const { data: oddsData, isLoading, error } = useUpcomingOdds();
  
  // ✅ Extract matches - the API returns data directly in the response
const allMatches = Array.isArray(oddsData?.data?.data)
  ? oddsData.data.data
  : [];

  // ✅ Filter by league if selected
  const matches = activeLeague 
    ? allMatches.filter((match: any) => {
        const matchSportKey = match.sport_key || match.sportKey;
        return matchSportKey === activeLeague;
      })
    : allMatches;

  // Get unique sports for display
  const uniqueSports = [...new Set(allMatches.map((m: any) => m.sport_key || m.sportKey))];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      
      {/* ─── 1. FEATURED LEAGUES ─── */}
      <div className="bg-slate-900/40 border-b border-slate-900 -mt-8 -mx-4 px-4 pt-4 pb-2 mb-6">
        <div className="container mx-auto max-w-6xl">
          <FeaturedSports 
            onLeagueSelect={setActiveLeague} 
            activeLeague={activeLeague || 'all'} 
          />
        </div>
      </div>

      {/* MAIN CONTAINER LAYOUT */}
      <div className="container mx-auto px-4 space-y-8 max-w-6xl">
        
        {/* ─── 2. HERO SLIDER ─── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full"
        >
          <HeroSlider />
        </motion.div>

        {/* ─── 3. MATCHES DISPLAY ─── */}
        <div className="space-y-8 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">
              {activeLeague ? `Matches (${activeLeague})` : 'All Matches'}
            </h2>
            <span className="text-xs text-slate-400">
              {matches.length} matches found
            </span>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="text-center text-red-500 p-8 bg-red-500/10 rounded-xl border border-red-500/20">
              <p>Failed to load matches. Please refresh the page.</p>
              <p className="text-xs mt-2 text-red-400/70">
                {error.message || 'Unknown error occurred'}
              </p>
            </div>
          ) : matches.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/30 rounded-xl border border-slate-800">
              <p className="text-slate-400">No matches available right now</p>
              <p className="text-xs text-slate-500 mt-1">
                Check back later for upcoming fixtures
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matches.map((match: any, index: number) => {
                // Extract data from API response
                const homeTeam = match.home_team || 'Home';
                const awayTeam = match.away_team || 'Away';
                const leagueName = match.sport_title || match.sport_key || 'Match';
                
                // Get odds from bookmakers
                let homeOdds = '-', awayOdds = '-';
                let hasOdds = false;
                
                if (match.bookmakers && match.bookmakers.length > 0) {
                  const bookmaker = match.bookmakers[0];
                  if (bookmaker.markets && bookmaker.markets.length > 0) {
                    const market = bookmaker.markets[0];
                    if (market.outcomes && market.outcomes.length >= 2) {
                      // Outcomes order: [away, home] or [home, away] depending on API
                      const outcome1 = market.outcomes[0];
                      const outcome2 = market.outcomes[1];
                      
                      // Determine which is home and away
                      if (outcome1.name === homeTeam) {
                        homeOdds = outcome1.price;
                        awayOdds = outcome2.price;
                      } else if (outcome1.name === awayTeam) {
                        homeOdds = outcome2.price;
                        awayOdds = outcome1.price;
                      } else {
                        homeOdds = outcome2?.price || '-';
                        awayOdds = outcome1?.price || '-';
                      }
                      hasOdds = true;
                    }
                  }
                }
                
                // Format date
                const matchDate = match.commence_time ? 
                  new Date(match.commence_time).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'TBD';
                
                return (
                  <motion.div
                    key={match.id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-all hover:shadow-lg"
                  >
                    <div className="p-4">
                      {/* League/Status */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-slate-400 truncate">
                          {leagueName}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-500 text-white">
                          Upcoming
                        </span>
                      </div>

                      {/* Teams */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-white truncate flex-1">
                            {homeTeam}
                          </span>
                          {hasOdds && (
                            <span className="text-sm font-bold text-green-400 min-w-[40px] text-right">
                              {homeOdds}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-white truncate flex-1">
                            {awayTeam}
                          </span>
                          {hasOdds && (
                            <span className="text-sm font-bold text-red-400 min-w-[40px] text-right">
                              {awayOdds}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Time */}
                      <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
                        <div className="text-xs text-slate-400">
                          🗓️ {matchDate}
                        </div>
                        <div className="text-xs text-blue-400 font-medium hover:text-blue-300 transition cursor-pointer">
                          Bet →
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* VALUE FOOTER UTILITIES */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-900">
          <div className="bg-slate-900/40 border border-slate-900 rounded-xl p-4 text-center">
            <Zap className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
            <h3 className="font-bold text-white text-xs uppercase tracking-tight">Instant Bets</h3>
            <p className="text-[11px] text-gray-400">Place and settle slips immediately</p>
          </div>
          <div className="bg-slate-900/40 border border-slate-900 rounded-xl p-4 text-center">
            <Shield className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            <h3 className="font-bold text-white text-xs uppercase tracking-tight">Secure & Safe</h3>
            <p className="text-[11px] text-gray-400">100% protected allocations</p>
          </div>
          <div className="bg-slate-900/40 border border-slate-900 rounded-xl p-4 text-center">
            <TrendingUp className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <h3 className="font-bold text-white text-xs uppercase tracking-tight">Best Odds</h3>
            <p className="text-[11px] text-gray-400">Competitive global match lines</p>
          </div>
          <div className="bg-slate-900/40 border border-slate-900 rounded-xl p-4 text-center">
            <Gift className="w-6 h-6 text-purple-500 mx-auto mb-2" />
            <h3 className="font-bold text-white text-xs uppercase tracking-tight">Welcome Bonus</h3>
            <p className="text-[11px] text-gray-400">100% up to {currencySymbol}{dynamicBonusCap.toFixed(0)}</p>
          </div>
        </div>

      </div>
    </div>
  );
}