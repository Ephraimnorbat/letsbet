'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, TrendingUp, Clock, Bell, Star, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useUpcomingMatches } from '@/lib/api/hooks/useMatches';
import { useBettingStore } from '@/store/bettingStore';
import toast from 'react-hot-toast';

export default function UpcomingMatches() {
  const { data: matchesData, isLoading, error, refetch } = useUpcomingMatches();
  const { addToBetSlip } = useBettingStore();
  const [selectedOdds, setSelectedOdds] = useState<{ matchId: number; selection: string } | null>(null);

  // Check if the response is an error
  const isErrorResponse = matchesData?.status === 'error';
  const errorMessage = matchesData?.message || 'Unable to load upcoming matches';

  // Safely extract matches array from response
  let upcomingMatches: any[] = [];
  
  if (!isErrorResponse && matchesData) {
    // Handle different possible response structures
    if (matchesData.data?.response && Array.isArray(matchesData.data.response)) {
      upcomingMatches = matchesData.data.response;
    } else if (matchesData.response && Array.isArray(matchesData.response)) {
      upcomingMatches = matchesData.response;
    } else if (Array.isArray(matchesData)) {
      upcomingMatches = matchesData;
    } else if (matchesData.data && Array.isArray(matchesData.data)) {
      upcomingMatches = matchesData.data;
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
      icon: '📋',
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
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              Upcoming Matches
            </h2>
            <p className="text-sm text-gray-400 mt-1">Don't miss these exciting fixtures</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-slate-800/50 rounded-2xl p-6 animate-pulse">
              <div className="h-4 bg-slate-700 rounded w-1/3 mb-4"></div>
              <div className="h-8 bg-slate-700 rounded w-3/4 mx-auto mb-2"></div>
              <div className="h-4 bg-slate-700 rounded w-1/2 mx-auto mb-2"></div>
              <div className="h-8 bg-slate-700 rounded w-3/4 mx-auto mb-4"></div>
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

  // Handle React Query error
  if (error) {
    return (
      <div className="mb-12">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Unable to Load Upcoming Matches</h3>
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

  // Handle API error response
  if (isErrorResponse) {
    return (
      <div className="mb-12">
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Service Temporarily Unavailable</h3>
          <p className="text-gray-400 mb-4">{errorMessage}</p>
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

  if (!upcomingMatches || upcomingMatches.length === 0) {
    return (
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              Upcoming Matches
            </h2>
            <p className="text-sm text-gray-400 mt-1">Don't miss these exciting fixtures</p>
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-2xl p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Upcoming Matches</h3>
          <p className="text-gray-400">Check back later for upcoming fixtures!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
            Upcoming Matches
          </h2>
          <p className="text-sm text-gray-400 mt-1">Don't miss these exciting fixtures</p>
        </div>
        <Link 
          href="/matches" 
          className="group flex items-center space-x-2 px-4 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-all duration-300 hover:scale-105"
        >
          <span className="text-sm font-medium">View Schedule</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {upcomingMatches.slice(0, 6).map((match: any, index: number) => {
          const matchId = match.fixture?.id || match.id;
          const leagueName = match.league?.name || match.league_name;
          const homeTeam = match.teams?.home?.name || match.home_team_name;
          const awayTeam = match.teams?.away?.name || match.away_team_name;
          const matchDate = match.fixture?.date || match.match_date;
          const matchTime = match.fixture?.date ? new Date(match.fixture.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD';
          const matchDay = match.fixture?.date ? new Date(match.fixture.date).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'TBD';
          
          // Get odds from match data (if available)
          const odds = match.odds || {};
          const homeOdds = odds.home || 2.0;
          const drawOdds = odds.draw || 3.2;
          const awayOdds = odds.away || 2.5;
          
          const isSelected = selectedOdds?.matchId === matchId;
          
          return (
            <motion.div
              key={matchId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{ y: -8 }}
              className="group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl overflow-hidden border border-slate-700/50 hover:border-purple-500/50 transition-all duration-300">
                <div className="p-5">
                  {/* League and Date */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-medium text-gray-400">{leagueName}</span>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-3 h-3 text-gray-500" />
                      <span className="text-xs text-gray-500">{matchDay}</span>
                      <Clock className="w-3 h-3 text-gray-500 ml-1" />
                      <span className="text-xs text-gray-500">{matchTime}</span>
                    </div>
                  </div>

                  {/* Teams */}
                  <div className="text-center mb-5">
                    <div className="text-lg font-bold mb-2 line-clamp-1">{homeTeam}</div>
                    <div className="text-sm text-gray-500 mb-2">vs</div>
                    <div className="text-lg font-bold mb-3 line-clamp-1">{awayTeam}</div>
                  </div>

                  {/* Betting Odds */}
                  <div className="grid grid-cols-3 gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleAddToBetSlip(match, 'home', homeOdds)}
                      className={`rounded-xl p-3 text-center transition-all duration-300 ${
                        isSelected?.selection === 'home'
                          ? 'bg-green-500 text-white'
                          : 'bg-slate-700/50 hover:bg-slate-700 border border-slate-600 hover:border-blue-500'
                      }`}
                    >
                      <div className="text-xs capitalize mb-1 text-gray-400">Home</div>
                      <div className="font-bold text-lg text-green-500">{homeOdds}</div>
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleAddToBetSlip(match, 'draw', drawOdds)}
                      className={`rounded-xl p-3 text-center transition-all duration-300 ${
                        isSelected?.selection === 'draw'
                          ? 'bg-green-500 text-white'
                          : 'bg-slate-700/50 hover:bg-slate-700 border border-slate-600 hover:border-blue-500'
                      }`}
                    >
                      <div className="text-xs capitalize mb-1 text-gray-400">Draw</div>
                      <div className="font-bold text-lg text-green-500">{drawOdds}</div>
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleAddToBetSlip(match, 'away', awayOdds)}
                      className={`rounded-xl p-3 text-center transition-all duration-300 ${
                        isSelected?.selection === 'away'
                          ? 'bg-green-500 text-white'
                          : 'bg-slate-700/50 hover:bg-slate-700 border border-slate-600 hover:border-blue-500'
                      }`}
                    >
                      <div className="text-xs capitalize mb-1 text-gray-400">Away</div>
                      <div className="font-bold text-lg text-green-500">{awayOdds}</div>
                    </motion.button>
                  </div>

                  {/* Set Reminder */}
                  <button className="w-full mt-4 py-2 rounded-lg border border-slate-600 text-xs text-gray-400 hover:bg-slate-700 hover:text-white transition-all duration-300 flex items-center justify-center space-x-2">
                    <Bell className="w-3 h-3" />
                    <span>Set Reminder</span>
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}