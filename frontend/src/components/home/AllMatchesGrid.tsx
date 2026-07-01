'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Calendar, Clock, Trophy, Users } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface Match {
  id: string | number;
  home_team: string;
  away_team: string;
  home_score?: number;
  away_score?: number;
  status?: string;
  commence_time?: string;
  sport_title?: string;
  league_name?: string;
  home_odds?: number;
  draw_odds?: number;
  away_odds?: number;
}

interface AllMatchesGridProps {
  matches: Match[] | any;
  isLoading: boolean;
  error: any;
}

export default function AllMatchesGrid({ matches, isLoading, error }: AllMatchesGridProps) {
  // ✅ Ensure matches is always an array
  const allMatches = Array.isArray(matches) ? matches : [];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-8 bg-red-500/10 rounded-xl border border-red-500/20">
        <p>Failed to load matches. Please try again.</p>
      </div>
    );
  }

  if (allMatches.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-900/30 rounded-xl border border-slate-800">
        <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400">No matches available at the moment</p>
        <p className="text-xs text-slate-500 mt-1">Check back later for upcoming fixtures</p>
      </div>
    );
  }

  const getMatchStatus = (status: string) => {
    if (status === 'live' || status === 'in_play') {
      return { label: 'LIVE', className: 'bg-red-500 text-white animate-pulse' };
    }
    if (status === 'halftime' || status === 'HT') {
      return { label: 'HT', className: 'bg-yellow-500 text-white' };
    }
    if (status === 'finished' || status === 'FT') {
      return { label: 'FT', className: 'bg-gray-600 text-white' };
    }
    return { label: 'Upcoming', className: 'bg-blue-500 text-white' };
  };

  const formatTime = (time: string) => {
    if (!time) return 'TBD';
    const date = new Date(time);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          All Matches
        </h2>
        <span className="text-xs text-slate-400">{allMatches.length} matches</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allMatches.map((match, index) => {
          const status = getMatchStatus(match.status || 'scheduled');
          const isLive = match.status === 'live' || match.status === 'in_play';
          
          return (
            <motion.div
              key={match.id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-all hover:shadow-lg hover:shadow-blue-500/5"
            >
              <Link href={`/matches/${match.id}`}>
                <div className="p-4">
                  {/* League/Sport */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-slate-400 truncate">
                      {match.league_name || match.sport_title || 'Match'}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${status.className}`}>
                      {status.label}
                    </span>
                  </div>

                  {/* Teams & Score */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white truncate flex-1">
                        {match.home_team}
                      </span>
                      <span className="text-lg font-bold text-white min-w-[30px] text-right">
                        {match.home_score !== undefined ? match.home_score : '-'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white truncate flex-1">
                        {match.away_team}
                      </span>
                      <span className="text-lg font-bold text-white min-w-[30px] text-right">
                        {match.away_score !== undefined ? match.away_score : '-'}
                      </span>
                    </div>
                  </div>

                  {/* Time & Odds */}
                  <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="w-3 h-3" />
                      {isLive ? 'Live Now' : formatTime(match.commence_time)}
                    </div>
                    {!isLive && match.home_odds && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-green-400 font-mono">{match.home_odds}</span>
                        <span className="text-yellow-400 font-mono">{match.draw_odds || '-'}</span>
                        <span className="text-red-400 font-mono">{match.away_odds}</span>
                      </div>
                    )}
                    <div className="text-xs text-blue-400 font-medium">
                      Bet →
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}