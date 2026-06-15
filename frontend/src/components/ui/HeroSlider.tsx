'use client';

import { ShieldCheck, ArrowRight, Gift, Wallet, Zap, Trophy } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface BannerData {
  id: number;
  kicker: string;
  icon: any;
  titleNormal: string;
  titlePurple: string;
  description: string;
  btnText: string;
  btnLink: string;
  glowColor: string; 
}

export default function HeroSlider() {
  const banners: BannerData[] = [
    {
      id: 1,
      kicker: 'Combo Insurance',
      icon: ShieldCheck,
      titleNormal: 'ONE LEG FAILS?',
      titlePurple: 'GET 100% REFUNDED',
      description: 'Place any 5+ leg multi-bet. If exactly one selection lets you down, your stake is fully returned. Min odds 1.50.',
      btnText: 'Protect Bet',
      btnLink: '/betting',
      glowColor: 'bg-purple-600/15',
    },
    {
      id: 2,
      kicker: 'Welcome Special',
      icon: Gift,
      titleNormal: 'FUEL YOUR WALLET.',
      titlePurple: 'CLAIM 100% MATCH',
      description: 'Double your bankroll instantly up to your regional currency maximum on your very first deposit.',
      btnText: 'Claim Bonus',
      btnLink: '/auth?mode=register',
      glowColor: 'bg-purple-600/15',
    },
    {
      id: 3,
      kicker: 'Web3 Cashouts',
      icon: Wallet,
      titleNormal: 'LIGHTNING FAST',
      titlePurple: 'WALLET PAIRING',
      description: 'Zero processing delays. Secure encrypted deposits and instant local balance withdrawals directly to your keys.',
      btnText: 'Link Wallet',
      btnLink: '/wallet',
      glowColor: 'bg-purple-600/15',
    },
    {
      id: 4,
      kicker: 'Live Markets',
      icon: Zap,
      titleNormal: 'STAY IN THE GAME.',
      titlePurple: 'BET IN-PLAY REALTIME',
      description: 'Secure highly competitive industry odds dynamically updated every split-second as live matches develop.',
      btnText: 'View Live',
      btnLink: '/live-matches',
      glowColor: 'bg-purple-600/15',
    },
    {
      id: 5,
      kicker: 'Elite Championship',
      icon: Trophy,
      titleNormal: 'CLIMB THE TIER.',
      titlePurple: 'SHARE THE $10,000 POOL',
      description: 'Earn points on every settled multi-slip. Elite leaderboard contenders win cash prizes every single week.',
      btnText: 'Join Race',
      btnLink: '/promotions',
      glowColor: 'bg-purple-600/15',
    },
  ];

  return (
    <div className="w-full">
      {/* ─── Horizontal Scroll Container ─── */}
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-none snap-x snap-mandatory">
        {banners.map((banner) => {
          const IconComponent = banner.icon;
          
          return (
            <div
              key={banner.id}
              className="relative flex-none w-[310px] sm:w-[350px] snap-start overflow-hidden rounded-xl border border-slate-800/40 bg-slate-900/40 backdrop-blur-md h-[180px] p-5 flex flex-col justify-between shadow-xl transition-all duration-300 hover:border-slate-700/60 group"
            >
              {/* Premium Deep Background Ambient Glow (Behind Blur Layer) */}
              <div className="absolute right-[-20px] bottom-[-20px] pointer-events-none opacity-60 mix-blend-screen transition-transform duration-500 group-hover:scale-110">
                <div className={`w-44 h-44 rounded-full ${banner.glowColor} blur-[45px]`} />
              </div>

              {/* Banner Top Content */}
              <div className="relative z-10">
                <span className="text-[9px] font-black tracking-widest text-emerald-400 uppercase bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1 w-max">
                  <IconComponent className="w-2.5 h-2.5" />
                  {banner.kicker}
                </span>
                
                {/* Cleaned: Stripped gradients, implemented pure brand purple font */}
                <h3 className="mt-2 text-sm sm:text-base font-black text-white uppercase tracking-tight leading-tight">
                  {banner.titleNormal} <br />
                  <span className="text-purple-500 tracking-wide drop-shadow-[0_2px_8px_rgba(168,85,247,0.15)]">
                    {banner.titlePurple}
                  </span>
                </h3>
              </div>

              {/* Banner Footer & Solid Non-Gradient Blue Button */}
              <div className="relative z-10 flex flex-col gap-2">
                <p className="text-[10px] text-gray-400/90 leading-relaxed line-clamp-2">
                  {banner.description}
                </p>
                
                <div className="flex items-center justify-between border-t border-slate-800/30 pt-2 mt-0.5">
                  {/* Subtle decorative layout slide indicator lines for style */}
                  <div className="flex space-x-1 opacity-40">
                    <span className={`h-1 rounded-full transition-all ${banner.id === 1 ? 'w-3 bg-purple-500' : 'w-1 bg-slate-700'}`} />
                    <span className={`h-1 rounded-full transition-all ${banner.id === 2 ? 'w-3 bg-purple-500' : 'w-1 bg-slate-700'}`} />
                    <span className={`h-1 rounded-full transition-all ${banner.id === 3 ? 'w-3 bg-purple-500' : 'w-1 bg-slate-700'}`} />
                  </div>

                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Link
                      href={banner.btnLink}
                      className="inline-flex items-center justify-center space-x-1.5 text-[10px] font-black text-white bg-blue-600 hover:bg-blue-500 px-3.5 py-1.5 rounded shadow-sm shadow-blue-950/40 transition-colors uppercase tracking-wider"
                    >
                      <span>{banner.btnText}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </motion.div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}