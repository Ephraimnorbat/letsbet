'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Bell, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useUpcomingMatches } from '@/lib/api/hooks/useMatches';
import { useBettingStore } from '@/store/bettingStore';
import toast from 'react-hot-toast';

interface UpcomingMatchesProps {
  sportKey?: string;
}

export default function UpcomingMatches({ sportKey = 'upcoming' }: UpcomingMatchesProps) {
  const { data: matchesData, isLoading, error, refetch } = useUpcomingMatches(sportKey);
  const { addToBetSlip } = useBettingStore();
  const [selectedOdds, setSelectedOdds] = useState<{ matchId: string | number; selection: string } | null>(null);

  // ================= NORMALIZE MATCHES ARRAY SAFELY =================
  // Checks all possible payload variations (direct array, .results wrap, or .data envelope)
  const normalizeMatches = (data: any): any[] => {
    if (Array.isArray(data)) return data;

    if (Array.isArray(data?.results)) return data.results;

    if (Array.isArray(data?.data)) return data.data;

    // deep fallback (VERY IMPORTANT)
    if (Array.isArray(data?.results?.data)) return data.results.data;

    return [];
  };

const upcomingMatches = normalizeMatches(matchesData);

  const isErrorResponse = 
    (matchesData as any)?.status === 'error' || 
    (typeof matchesData?.status === 'number' && matchesData.status >= 400) || 
    !!error;
    
  // ✅ FIXED: Entirely wrapped as any to clear the secondary property access flag
  const errorMessage = 
    (matchesData as any)?.data?.message || 
    (matchesData as any)?.message || 
    'Unable to load upcoming matches';

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

  // ================= STATE RENDER HANDLING =================
  if (isLoading) {
    return <div className="py-20 text-center text-slate-400 font-medium animate-pulse">Loading upcoming fixtures...</div>;
  }

  if (isErrorResponse || upcomingMatches.length === 0) {
    return (
      <div className="mb-12 p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center">
        <AlertCircle className="w-8 h-8 text-slate-600 mb-2" />
        <p className="text-sm text-slate-400 mb-4">{upcomingMatches.length === 0 ? 'No upcoming matches found for this selection.' : errorMessage}</p>
        <button 
          onClick={() => refetch()} 
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white rounded-xl transition"
        >
          <RefreshCw className="w-3.5 h-3.5" /> REFRESH SCHEDULE
        </button>
      </div>
    );
  }

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
          const matchId = match.id;
          const homeTeam = match.home_team;
          const awayTeam = match.away_team;
          
          // Date formatting safely
          const dateObj = new Date(match.commence_time || match.date || Date.now());
          const matchTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const matchDay = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
          
          // Pull Odds dynamically from underlying array structures safely
          const bookmaker = match.bookmakers?.[0];
          const market = bookmaker?.markets?.find((m: any) => m.key === 'h2h');
          const hOdds = market?.outcomes?.find((o: any) => o.name === homeTeam)?.price || 1.0;
          const aOdds = market?.outcomes?.find((o: any) => o.name === awayTeam)?.price || 1.0;
          const dOdds = market?.outcomes?.find((o: any) => o.name === 'Draw' || o.name === 'Tie')?.price || 1.0;
          
          return (
            <motion.div
              key={matchId || index}
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
                    <span className="text-[10px] font-bold text-gray-500 uppercase">{match.sport_title || 'Sports Match'}</span>
                    <div className="flex items-center space-x-2 text-[10px] text-gray-400">
                      <Calendar className="w-3 h-3" />
                      <span>{matchDay}</span>
                      <Clock className="w-3 h-3 ml-1" />
                      <span>{matchTime}</span>
                    </div>
                  </div>

                  <div className="text-center mb-5">
                    <div className="text-md font-bold truncate text-white">{homeTeam}</div>
                    <div className="text-[10px] text-gray-600 my-1 font-black tracking-widest">VS</div>
                    <div className="text-md font-bold truncate text-white">{awayTeam}</div>
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
                        type="button"
                        onClick={() => handleAddToBetSlip(match, odd.type, odd.val)}
                        className="bg-slate-800 border border-slate-700 rounded-xl py-2 hover:bg-purple-600 hover:border-purple-500 transition-all group/odd"
                      >
                        <div className="text-[10px] text-gray-500 uppercase group-hover/odd:text-purple-200">{odd.label}</div>
                        <div className="font-bold text-green-500 group-hover/odd:text-white">{odd.val.toFixed(2)}</div>
                      </button>
                    ))}
                  </div>

                  <button type="button" className="w-full mt-4 py-2 rounded-lg bg-slate-800/50 text-[10px] text-gray-500 hover:text-white flex items-center justify-center space-x-2 transition-colors">
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