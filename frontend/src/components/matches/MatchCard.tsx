'use client';

import { useBettingStore } from '@/store/bettingStore';
import toast from 'react-hot-toast';

export default function MatchCard({ match }: { match: any }) {
  const { addToBetSlip, selections } = useBettingStore();

  const bookmaker = match.bookmakers?.[0];
  const h2hMarket = bookmaker?.markets?.find((m: any) => m.key === 'h2h');
  
  // Standard 1X2 Mapping
  const outcomes = ['Home', 'Draw', 'Away'].map(type => {
    return h2hMarket?.outcomes?.find((o: any) => 
      type === 'Draw' ? o.name === 'Draw' : o.name === (type === 'Home' ? match.home_team : match.away_team)
    );
  });

  const handleBetClick = (outcome: any) => {
    if (!outcome) return;
    addToBetSlip({
      id: `${match.id}-${outcome.name}`,
      matchId: match.id,
      matchName: `${match.home_team} vs ${match.away_team}`,
      selection: outcome.name,
      odds: outcome.price,
    });
    toast.success(`Added to slip`);
  };

  return (
    <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 hover:border-blue-500/50 transition-all group flex flex-col justify-between h-full">
      <div>
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-1.5">
             <span className="text-[10px] text-slate-500 font-bold uppercase">{match.sport_title || 'EPL'}</span>
             <span className="text-slate-700">|</span>
             <span className="text-[10px] text-slate-500 uppercase">
               {new Date(match.commence_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
             </span>
          </div>
          {match.status === 'live' && (
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] text-red-500 font-black">LIVE</span>
            </div>
          )}
        </div>

        {/* Team vs Team (Vertical) */}
        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-slate-200 truncate pr-2">{match.home_team}</span>
            <span className="text-lg font-black text-blue-500 font-mono">{match.home_score ?? 0}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-slate-200 truncate pr-2">{match.away_team}</span>
            <span className="text-lg font-black text-blue-500 font-mono">{match.away_score ?? 0}</span>
          </div>
        </div>
      </div>
      
      {/* Odds Buttons (1-X-2 Grid) */}
      <div className="grid grid-cols-3 gap-2 mt-auto">
        {outcomes.map((outcome, idx) => {
          const isSelected = selections.some(s => s.id === `${match.id}-${outcome?.name}`);
          const label = idx === 0 ? '1' : idx === 1 ? 'X' : '2';
          
          return (
            <button 
              key={idx}
              disabled={!outcome}
              onClick={() => handleBetClick(outcome)}
              className={`py-2.5 rounded-lg border transition-all flex flex-col items-center justify-center
                ${isSelected 
                  ? 'bg-blue-600 border-blue-400' 
                  : 'bg-slate-800/40 border-slate-700 hover:bg-slate-700 hover:border-slate-500'
                } disabled:opacity-20`}
            >
              <span className={`text-[9px] font-black ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>{label}</span>
              <span className="text-sm font-black text-white">{outcome ? outcome.price.toFixed(2) : '-'}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}