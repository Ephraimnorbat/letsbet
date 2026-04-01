'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ChevronRight, TrendingUp, Star } from 'lucide-react';

const featuredLeagues = [
  { 
    name: 'UEFA Nations League', 
    country: 'Europe', 
    matches: 12, 
    flag: '🏆',
    gradient: 'from-blue-500/20 to-purple-500/20',
    popularity: 98,
    liveMatches: 3
  },
  { 
    name: 'Spain. La Liga', 
    country: 'Spain', 
    matches: 8, 
    flag: '🇪🇸',
    gradient: 'from-red-500/20 to-yellow-500/20',
    popularity: 95,
    liveMatches: 2
  },
  { 
    name: 'UEFA Conference League', 
    country: 'Europe', 
    matches: 15, 
    flag: '🏆',
    gradient: 'from-green-500/20 to-emerald-500/20',
    popularity: 87,
    liveMatches: 4
  },
  { 
    name: 'Copa Libertadores', 
    country: 'South America', 
    matches: 6, 
    flag: '🌎',
    gradient: 'from-yellow-500/20 to-orange-500/20',
    popularity: 92,
    liveMatches: 1
  },
  { 
    name: 'Russia. Premier League', 
    country: 'Russia', 
    matches: 7, 
    flag: '🇷🇺',
    gradient: 'from-red-600/20 to-blue-600/20',
    popularity: 82,
    liveMatches: 0
  },
  { 
    name: 'England. Premier League', 
    country: 'England', 
    matches: 10, 
    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    gradient: 'from-blue-600/20 to-red-600/20',
    popularity: 99,
    liveMatches: 5
  },
];

export default function FeaturedSports() {
  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            Featured Leagues
          </h2>
          <p className="text-sm text-gray-400 mt-1">Popular competitions around the world</p>
        </div>
        <Link 
          href="/leagues" 
          className="group flex items-center space-x-2 px-4 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-all duration-300 hover:scale-105"
        >
          <span className="text-sm font-medium">View All</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {featuredLeagues.map((league, index) => (
          <motion.div
            key={league.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.4 }}
            whileHover={{ y: -8, scale: 1.02 }}
            className="group relative"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${league.gradient} rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50 hover:border-slate-600 transition-all duration-300 shadow-lg hover:shadow-2xl">
              {/* Popularity Badge */}
              {league.popularity > 90 && (
                <div className="absolute top-2 right-2">
                  <div className="flex items-center space-x-1 bg-yellow-500/20 backdrop-blur-sm px-2 py-1 rounded-full">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs font-bold text-yellow-500">{league.popularity}%</span>
                  </div>
                </div>
              )}
              
              {/* Live Matches Indicator */}
              {league.liveMatches > 0 && (
                <div className="absolute top-2 left-2">
                  <div className="flex items-center space-x-1 bg-red-500/20 backdrop-blur-sm px-2 py-1 rounded-full">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-xs font-bold text-red-500">{league.liveMatches} LIVE</span>
                  </div>
                </div>
              )}
              
              <div className="text-4xl mb-3 transform group-hover:scale-110 transition-transform duration-300">
                {league.flag}
              </div>
              <h3 className="font-bold text-sm mb-1 line-clamp-1">{league.name}</h3>
              <p className="text-xs text-gray-400 mb-2">{league.country}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{league.matches} matches</span>
                <TrendingUp className="w-3 h-3 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              
              {/* Hover Glow Effect */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}