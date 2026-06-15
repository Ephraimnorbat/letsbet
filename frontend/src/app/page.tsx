'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Zap, Shield, Gift } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import LiveMatchesSection from '@/components/home/LiveMatchesSection';
import FeaturedSports from '@/components/home/FeaturedSports';
import UpcomingMatches from '@/components/home/UpcomingMatches';
import HeroSlider from '@/components/ui/HeroSlider';

export default function Home() {
  const { user } = useAuthStore();
  const [activeLeague, setActiveLeague] = useState('upcoming');

  const currencySymbol = user?.currency_symbol || '$';
  const exchangeRate = user?.exchange_rate || 1;
  const dynamicBonusCap = 100 / exchangeRate;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      
      {/* ─── 1. FEATURED LEAGUES AT THE VERY TOP ─── */}
      <div className="bg-slate-900/40 border-b border-slate-900 -mt-8 -mx-4 px-4 pt-4 pb-2 mb-6">
        <div className="container mx-auto max-w-6xl">
          {/* Kept smaller and clean as requested */}
          <div className="scale-95 origin-top-left transform-gpu">
            <FeaturedSports onLeagueSelect={setActiveLeague} activeLeague={activeLeague} />
          </div>
        </div>
      </div>

      {/* MAIN CONTAINER LAYOUT */}
      <div className="container mx-auto px-4 space-y-8 max-w-6xl">
        
        {/* ─── 2. UPGRADED HERO SLIDER BANNERS WITH BLUE BUTTONS ─── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full"
        >
          <HeroSlider />
        </motion.div>

        {/* ─── 3. MATCH FEEDS AND DATA SECTIONS ─── */}
        <div className="space-y-8 pt-2">
          <LiveMatchesSection sportKey={activeLeague} />
          <UpcomingMatches sportKey={activeLeague} />
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