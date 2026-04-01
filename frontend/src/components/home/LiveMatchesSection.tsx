'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, ChevronRight, Activity, Zap, Target, AlertCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useLiveMatches } from '@/lib/api/hooks/useLiveMatches';
import { useBettingStore } from '@/store/bettingStore';
import toast from 'react-hot-toast';

export default function LiveMatchesSection() {
  const { data: liveMatchesData, isLoading, error, refetch } = useLiveMatches();
  const { addToBetSlip } = useBettingStore();
  const [hoveredMatch, setHoveredMatch] = useState<number | null>(null);
  const [selectedOdds, setSelectedOdds] = useState<{ matchId: number; selection: string } | null>(null);

  // Check if the response is an error
  const isErrorResponse = liveMatchesData?.status === 'error';
  const errorMessage = liveMatchesData?.message || 'Service unavailable';

  // Safely extract matches array from response
  let liveMatches: any[] = [];
  
  if (!isErrorResponse && liveMatchesData) {
    // Handle different possible response structures
    if (liveMatchesData.data?.response && Array.isArray(liveMatchesData.data.response)) {
      liveMatches = liveMatchesData.data.response;
    } else if (liveMatchesData.response && Array.isArray(liveMatchesData.response)) {
      liveMatches = liveMatchesData.response;
    } else if (Array.isArray(liveMatchesData)) {
      liveMatches = liveMatchesData;
    } else if (liveMatchesData.data && Array.isArray(liveMatchesData.data)) {
      liveMatches = liveMatchesData.data;
    } else {
      console.warn('Unexpected live matches data structure:', liveMatchesData);
      liveMatches = [];
    }
  }

  const handleAddToBetSlip = (match: any, selection: string, odds: number) => {
    const matchId = match.fixture?.id || match.id;
    const homeTeam = match.teams?.home?.name || match.home_team_name;
    const awayTeam = match.teams?.away?.name || match.away_team_name;
    const league = match.league?.name || match.league_name;
    const matchDate = match.fixture?.date || match.match_date;
    
    addToBetSlip({
      matchId: matchId,
      matchName: `${homeTeam} vs ${awayTeam}`,
      homeTeam: homeTeam,
      awayTeam: awayTeam,
      selection: selection,
      odds: odds,
      league: league,
      matchDate: matchDate,
    });
    
    setSelectedOdds({ matchId: matchId, selection });
    toast.success(`${selection.toUpperCase()} @ ${odds} added to bet slip`, {
      icon: '🎲',
      style: {
        background: '#1e293b',
        color: '#fff',
        border: '1px solid #3b82f6',
      },
    });
    setTimeout(() => setSelectedOdds(null), 1000);
  };

  if (isLoading) {
    return (
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <h2 className="text-2xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                Live Now
              </h2>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-slate-800/50 rounded-2xl p-6 animate-pulse">
              <div className="h-4 bg-slate-700 rounded w-1/3 mb-4"></div>
              <div className="h-8 bg-slate-700 rounded w-full mb-2"></div>
              <div className="h-8 bg-slate-700 rounded w-full mb-4"></div>
              <div className="grid grid-cols-3 gap-2">
                <div className="h-16 bg-slate-700 rounded"></div>
                <div className="h-16 bg-slate-700 rounded"></div>
                <div className="h-16 bg-slate-700 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Handle error from React Query
  if (error) {
    return (
      <div className="mb-12">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Unable to Load Live Matches</h3>
          <p className="text-gray-400 mb-4">
            There was a network error. Please check your connection and try again.
          </p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  // Handle API error response (like odds service unavailable)
  if (isErrorResponse) {
    return (
      <div className="mb-12">
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Service Temporarily Unavailable</h3>
          <p className="text-gray-400 mb-4">
            {errorMessage}
          </p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-yellow-500/20 hover:bg-yellow-500/30 rounded-lg transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  if (!liveMatches || liveMatches.length === 0) {
    return (
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <h2 className="text-2xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                Live Now
              </h2>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-2xl p-12 text-center">
          <Activity className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Live Matches</h3>
          <p className="text-gray-400">Check back later for live matches!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <h2 className="text-2xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
              Live Now
            </h2>
            <span className="text-xs px-2 py-1 bg-red-500/20 text-red-500 rounded-full">
              {liveMatches.length} Active
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-1">Watch and bet on live matches</p>
        </div>
        <Link 
          href="/live-sport" 
          className="group flex items-center space-x-2 px-4 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-all duration-300 hover:scale-105"
        >
          <span className="text-sm font-medium">All Live Matches</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {liveMatches.map((match: any, index: number) => {
          const matchId = match.fixture?.id || match.id;
          const leagueName = match.league?.name || match.league_name;
          const homeTeam = match.teams?.home?.name || match.home_team_name;
          const awayTeam = match.teams?.away?.name || match.away_team_name;
          const homeScore = match.goals?.home ?? match.home_score ?? 0;
          const awayScore = match.goals?.away ?? match.away_score ?? 0;
          const matchTime = match.fixture?.status?.elapsed || match.fixture?.status?.short || match.time || 'LIVE';
          
          // Get REAL odds from API (if available)
          const odds = match.odds || {};
          const homeOdds = odds.home || 0;
          const drawOdds = odds.draw || 0;
          const awayOdds = odds.away || 0;
          
          const isSelected = selectedOdds?.matchId === matchId && selectedOdds?.selection;
          
          return (
            <motion.div
              key={matchId}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              onHoverStart={() => setHoveredMatch(matchId)}
              onHoverEnd={() => setHoveredMatch(null)}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl overflow-hidden border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300">
                {/* Match Header */}
                <div className="px-5 py-3 bg-gradient-to-r from-slate-800 to-slate-900/50 border-b border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-400">{leagueName}</span>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-red-500" />
                        <span className="text-xs font-mono text-red-500 font-bold">
                          {matchTime}'
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Activity className="w-3 h-3 text-green-500" />
                        <span className="text-xs text-green-500">LIVE</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Teams and Scores */}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1 text-center">
                      <motion.div
                        animate={hoveredMatch === matchId ? { scale: 1.05 } : { scale: 1 }}
                        className="text-lg font-bold mb-1 line-clamp-1"
                      >
                        {homeTeam}
                      </motion.div>
                      <div className="text-3xl font-bold text-green-500">{homeScore}</div>
                    </div>
                    <div className="px-4">
                      <div className="text-xs text-gray-500 mb-1">VS</div>
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-blue-500" />
                      </div>
                    </div>
                    <div className="flex-1 text-center">
                      <motion.div
                        animate={hoveredMatch === matchId ? { scale: 1.05 } : { scale: 1 }}
                        className="text-lg font-bold mb-1 line-clamp-1"
                      >
                        {awayTeam}
                      </motion.div>
                      <div className="text-3xl font-bold text-green-500">{awayScore}</div>
                    </div>
                  </div>

                  {/* Betting Odds - Only show if odds are available */}
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    {homeOdds > 0 && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleAddToBetSlip(match, 'home', homeOdds)}
                        className={`relative overflow-hidden rounded-xl p-3 text-center transition-all duration-300 ${
                          isSelected?.selection === 'home'
                            ? 'bg-green-500 text-white'
                            : 'bg-slate-700/50 hover:bg-slate-700 border border-slate-600'
                        }`}
                      >
                        <div className="relative">
                          <div className="text-xs capitalize mb-1">Home</div>
                          <div className="font-bold text-lg">{homeOdds}</div>
                        </div>
                      </motion.button>
                    )}
                    
                    {drawOdds > 0 && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleAddToBetSlip(match, 'draw', drawOdds)}
                        className={`relative overflow-hidden rounded-xl p-3 text-center transition-all duration-300 ${
                          isSelected?.selection === 'draw'
                            ? 'bg-green-500 text-white'
                            : 'bg-slate-700/50 hover:bg-slate-700 border border-slate-600'
                        }`}
                      >
                        <div className="relative">
                          <div className="text-xs capitalize mb-1">Draw</div>
                          <div className="font-bold text-lg">{drawOdds}</div>
                        </div>
                      </motion.button>
                    )}
                    
                    {awayOdds > 0 && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleAddToBetSlip(match, 'away', awayOdds)}
                        className={`relative overflow-hidden rounded-xl p-3 text-center transition-all duration-300 ${
                          isSelected?.selection === 'away'
                            ? 'bg-green-500 text-white'
                            : 'bg-slate-700/50 hover:bg-slate-700 border border-slate-600'
                        }`}
                      >
                        <div className="relative">
                          <div className="text-xs capitalize mb-1">Away</div>
                          <div className="font-bold text-lg">{awayOdds}</div>
                        </div>
                      </motion.button>
                    )}
                  </div>
                  
                  {/* Show message if no odds available */}
                  {homeOdds === 0 && drawOdds === 0 && awayOdds === 0 && (
                    <div className="text-center text-xs text-gray-500 mt-4">
                      Odds coming soon
                    </div>
                  )}
                </div>

                {/* Match Stats Footer */}
                <div className="px-5 py-3 bg-slate-900/50 border-t border-slate-700/50">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center space-x-2">
                      <Target className="w-3 h-3" />
                      <span>Live Match</span>
                    </div>
                    <Link href={`/matches/${matchId}`} className="text-blue-500 hover:text-blue-400 transition-colors">
                      Match Stats →
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}