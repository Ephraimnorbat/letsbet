'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ChevronRight, TrendingUp, Star } from 'lucide-react';

// 1. Define the Props Interface
interface FeaturedSportsProps {
  onLeagueSelect: (key: string) => void;
  activeLeague: string;
}

const featuredLeagues = [
  { 
    name: 'UEFA Nations League', 
    sportKey: 'soccer_uefa_nations_league', // The API key
    country: 'Europe', 
    flag: '🏆',
    gradient: 'from-blue-500/20 to-purple-500/20',
    popularity: 98,
    liveMatches: 3
  },
  { 
    name: 'Spain. La Liga', 
    sportKey: 'soccer_spain_la_liga',
    country: 'Spain', 
    flag: '🇪🇸',
    gradient: 'from-red-500/20 to-yellow-500/20',
    popularity: 95,
    liveMatches: 2
  },
  { 
    name: 'UEFA Conference League', 
    sportKey: 'soccer_uefa_uecl',
    country: 'Europe', 
    flag: '🏆',
    gradient: 'from-green-500/20 to-emerald-500/20',
    popularity: 87,
    liveMatches: 4
  },
  { 
    name: 'England. Premier League', 
    sportKey: 'soccer_epl',
    country: 'England', 
    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    gradient: 'from-blue-600/20 to-red-600/20',
    popularity: 99,
    liveMatches: 5
  },
  // ... add others as needed
];

export default function FeaturedSports({ onLeagueSelect, activeLeague }: FeaturedSportsProps) {
  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            Featured Leagues
          </h2>
          <p className="text-sm text-gray-400 mt-1">Popular competitions around the world</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {featuredLeagues.map((league, index) => (
          <motion.div
            key={league.name}
            onClick={() => onLeagueSelect(league.sportKey)} // 2. Trigger selection on click
            className="group relative cursor-pointer"
          >
            <div className={`relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl p-5 border transition-all duration-300 ${
              activeLeague === league.sportKey ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-700/50'
            }`}>
              {/* Live Indicator */}
              {league.liveMatches > 0 && (
                <div className="absolute top-2 left-2">
                  <div className="flex items-center space-x-1 bg-red-500/20 px-2 py-1 rounded-full">
                    <span className="text-[10px] font-bold text-red-500">{league.liveMatches} LIVE</span>
                  </div>
                </div>
              )}
              
              <div className="text-4xl mb-3">{league.flag}</div>
              <h3 className="font-bold text-xs mb-1 line-clamp-1">{league.name}</h3>
              <p className="text-[10px] text-gray-400">{league.country}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}