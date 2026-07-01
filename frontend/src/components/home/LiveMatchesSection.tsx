'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, ChevronRight, Activity, Zap, Target, AlertCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useLiveMatches } from '@/lib/api/hooks/useMatches';
import { useBettingStore } from '@/store/bettingStore';
import toast from 'react-hot-toast';

interface LiveMatchesSectionProps {
  sportKey?: string;
}

export default function LiveMatchesSection({ sportKey = 'upcoming' }: LiveMatchesSectionProps) {
  const { addToBetSlip } = useBettingStore();
  const [hoveredMatch, setHoveredMatch] = useState<string | number | null>(null);
  const [selectedOdds, setSelectedOdds] = useState<{ matchId: string | number; selection: string } | null>(null);
  
  // ✅ useLiveMatches doesn't accept parameters - it fetches all live matches
  const { data: response, isLoading, error } = useLiveMatches();
  
  // Extract matches from response
  const liveMatches = Array.isArray(response?.data) ? response.data : 
                      Array.isArray(response) ? response : [];

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
    toast.success(`${selection.toUpperCase()} @ ${odds} added`, { icon: '🎲' });
    setTimeout(() => setSelectedOdds(null), 1000);
  };

  if (isLoading) return <div className="p-12 animate-pulse text-center">Loading Live Data...</div>;
  if (error || !liveMatches) return <div className="p-12 text-center text-red-500">Error loading matches.</div>;

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <h2 className="text-2xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent capitalize">
              Live Matches
            </h2>
            <span className="text-xs px-2 py-1 bg-red-500/20 text-red-500 rounded-full">
              {liveMatches.length} Active
            </span>
          </div>
        </div>
        <Link href="/live-sport" className="text-sm font-medium flex items-center group">
          View All <ChevronRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {liveMatches.map((match: any, index: number) => {
          const matchId = match.id;
          const homeTeam = match.home_team || match.home?.name || 'Home';
          const awayTeam = match.away_team || match.away?.name || 'Away';
          
          // Scores
          const homeScore = match.home_score ?? match.home?.score ?? 0;
          const awayScore = match.away_score ?? match.away?.score ?? 0;
          
          // Odds from bookmakers
          let hOdds = 0, aOdds = 0, dOdds = 0;
          if (match.bookmakers && match.bookmakers.length > 0) {
            const market = match.bookmakers[0]?.markets?.find((m: any) => m.key === 'h2h');
            if (market?.outcomes) {
              const homeOutcome = market.outcomes.find((o: any) => o.name === homeTeam);
              const awayOutcome = market.outcomes.find((o: any) => o.name === awayTeam);
              const drawOutcome = market.outcomes.find((o: any) => o.name === 'Draw');
              hOdds = homeOutcome?.price || 0;
              aOdds = awayOutcome?.price || 0;
              dOdds = drawOutcome?.price || 0;
            }
          }

          const isSelected = selectedOdds?.matchId === matchId;
          
          return (
            <motion.div
              key={matchId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all"
            >
              <div className="px-4 py-2 bg-slate-800/50 flex justify-between items-center">
                <span className="text-[10px] text-gray-400 uppercase tracking-widest">
                  {match.sport_title || match.league?.name || 'Match'}
                </span>
                <div className="flex items-center text-red-500 text-[10px] font-bold">
                  <Activity className="w-3 h-3 mr-1" /> LIVE
                </div>
              </div>

              <div className="p-5 text-center">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex-1">
                    <p className="text-sm font-bold truncate">{homeTeam}</p>
                    <p className="text-3xl font-black text-white mt-1">{homeScore}</p>
                  </div>
                  <div className="px-4 opacity-30 text-xs">VS</div>
                  <div className="flex-1">
                    <p className="text-sm font-bold truncate">{awayTeam}</p>
                    <p className="text-3xl font-black text-white mt-1">{awayScore}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: '1', val: hOdds, type: homeTeam },
                    { label: 'X', val: dOdds, type: 'Draw' },
                    { label: '2', val: aOdds, type: awayTeam }
                  ].map((odd) => (
                    <button
                      key={odd.label}
                      onClick={() => handleAddToBetSlip(match, odd.type, odd.val)}
                      disabled={odd.val === 0}
                      className={`py-2 rounded-lg border transition-all ${
                        odd.val === 0 
                        ? 'bg-slate-800 border-slate-800 opacity-50 cursor-not-allowed' 
                        : 'bg-slate-800 border-slate-700 hover:bg-blue-600 hover:border-blue-500'
                      }`}
                    >
                      <div className="text-[10px] text-gray-400">{odd.label}</div>
                      <div className="font-bold text-sm">{odd.val || '-'}</div>
                    </button>
                  ))}
                </div>
                
                {hOdds === 0 && <p className="text-[10px] text-gray-500 mt-3 italic">Odds currently suspended</p>}
              </div>

              <div className="px-4 py-3 bg-slate-950/50 flex justify-between items-center">
                 <Link href={`/matches/${matchId}`} className="text-[10px] text-blue-400 hover:underline">
                   Analysis & Stats →
                 </Link>
                 <Zap className="w-3 h-3 text-yellow-500" />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}