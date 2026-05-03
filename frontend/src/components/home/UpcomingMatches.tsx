'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Bell, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useUpcomingMatches } from '@/lib/api/hooks/useMatches';
import { useBettingStore } from '@/store/bettingStore';
import toast from 'react-hot-toast';

// 1. Define Props to accept the league filter
interface UpcomingMatchesProps {
  sportKey?: string;
}

export default function UpcomingMatches({ sportKey = 'upcoming' }: UpcomingMatchesProps) {
  // 2. Pass sportKey to the hook so it refetches when you change leagues
  const { data: matchesData, isLoading, error, refetch } = useUpcomingMatches(sportKey);
  const { addToBetSlip } = useBettingStore();
  const [selectedOdds, setSelectedOdds] = useState<{ matchId: string | number; selection: string } | null>(null);

  const isErrorResponse = matchesData?.status === 'error';
  const errorMessage = matchesData?.message || 'Unable to load upcoming matches';

  // Extract matches array safely
  const upcomingMatches = Array.isArray(matchesData) 
    ? matchesData 
    : matchesData?.data || [];

  const handleAddToBetSlip = (match: any, selection: string, odds: number) => {
    const matchId = match.id;
    const homeTeam = match.home_team;
    const awayTeam = match.away_team;
    
    addToBetSlip({
      id: `${matchId}-${selection}`,
      matchId: matchId,
      matchName: `${homeTeam} vs ${awayTeam}`,
      selection: selection,
      odds: odds,
    });
    
    setSelectedOdds({ matchId: matchId, selection });
    toast.success(`${selection.toUpperCase()} added to slip`, { icon: '📋' });
    setTimeout(() => setSelectedOdds(null), 1000);
  };

  if (isLoading) return <div className="py-20 text-center animate-pulse">Loading upcoming fixtures...</div>;

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
            Upcoming Fixtures
          </h2>
          <p className="text-sm text-gray-400 mt-1 capitalize">{sportKey.replace(/_/g, ' ')} schedule</p>
        </div>
        <Link href="/matches" className="group flex items-center space-x-2 px-4 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-all">
          <span className="text-sm font-medium">View Schedule</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {upcomingMatches.slice(0, 6).map((match: any, index: number) => {
          // --- DATA MAPPING FOR THE ODDS API ---
          const matchId = match.id;
          const homeTeam = match.home_team;
          const awayTeam = match.away_team;
          
          // Date formatting
          const dateObj = new Date(match.commence_time);
          const matchTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const matchDay = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
          
          // Pull Odds from Bookmakers
          const market = match.bookmakers?.[0]?.markets?.find((m: any) => m.key === 'h2h');
          const hOdds = market?.outcomes?.find((o: any) => o.name === homeTeam)?.price || 1.0;
          const aOdds = market?.outcomes?.find((o: any) => o.name === awayTeam)?.price || 1.0;
          const dOdds = market?.outcomes?.find((o: any) => o.name === 'Draw')?.price || 1.0;
          
          return (
            <motion.div
              key={matchId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              className="group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all">
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">{match.sport_title}</span>
                    <div className="flex items-center space-x-2 text-[10px] text-gray-400">
                      <Calendar className="w-3 h-3" />
                      <span>{matchDay}</span>
                      <Clock className="w-3 h-3 ml-1" />
                      <span>{matchTime}</span>
                    </div>
                  </div>

                  <div className="text-center mb-5">
                    <div className="text-md font-bold truncate">{homeTeam}</div>
                    <div className="text-[10px] text-gray-600 my-1 font-black">VS</div>
                    <div className="text-md font-bold truncate">{awayTeam}</div>
                  </div>

                  {/* Odds Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: '1', val: hOdds, type: homeTeam },
                      { label: 'X', val: dOdds, type: 'Draw' },
                      { label: '2', val: aOdds, type: awayTeam }
                    ].map((odd) => (
                      <button
                        key={odd.label}
                        onClick={() => handleAddToBetSlip(match, odd.type, odd.val)}
                        className="bg-slate-800 border border-slate-700 rounded-xl py-2 hover:bg-purple-600 hover:border-purple-500 transition-all"
                      >
                        <div className="text-[10px] text-gray-500 uppercase">{odd.label}</div>
                        <div className="font-bold text-green-500 group-hover:text-white">{odd.val}</div>
                      </button>
                    ))}
                  </div>

                  <button className="w-full mt-4 py-2 rounded-lg bg-slate-800/50 text-[10px] text-gray-500 hover:text-white flex items-center justify-center space-x-2 transition-colors">
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