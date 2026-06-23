'use client';

import { useEffect } from 'react';
import { useBettingStore } from '@/store/bettingStore';
import { useAuthStore } from '@/store/authStore'; // 🚀 Added to read user preferences
import { Trophy, Clock, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function MyBetsPage() {
  const { myBets = [], fetchMyBets, isLoading } = useBettingStore();
  const { user } = useAuthStore(); // 🚀 Pull user profile metrics

  // Fallback gracefully if currency properties are undefined
  const activeCurrency = user?.currency_code || 'KES';

  useEffect(() => { 
    fetchMyBets(); 
  }, []);

  if (isLoading) return <div className="p-10 text-center text-white">Loading your slips...</div>;

  return (
    <div className="min-h-screen bg-[#0f172a] p-4 md:p-8 text-slate-200">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black uppercase tracking-tighter mb-8">My Bet History</h1>

        <div className="space-y-6">
          {myBets.length === 0 ? (
            <div className="text-center p-12 bg-[#1e293b] border border-slate-800 rounded-xl text-gray-400">
              You haven't placed any bets yet.
            </div>
          ) : (
            myBets.map((slip) => (
              <div key={slip.id} className={`bg-[#1e293b] border ${slip.status === 'won' ? 'border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'border-slate-700'} rounded-xl overflow-hidden transition-all`}>
                
                {/* Slip Header */}
                <div className={`p-4 ${slip.status === 'won' ? 'bg-green-500/10' : 'bg-slate-800/50'} flex justify-between items-center border-b border-slate-700`}>
                  <div className="flex items-center gap-3">
                    {slip.status === 'won' && <Trophy className="text-green-500" size={20} />}
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Slip ID: {slip.id}</p>
                      <p className="text-sm font-bold">
                        {slip.created_at ? format(new Date(slip.created_at), 'dd MMM, HH:mm') : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                      slip.status === 'won' ? 'bg-green-500 text-white' : 
                      slip.status === 'lost' ? 'bg-red-500 text-white' : 'bg-blue-600 text-white'
                    }`}>
                      {slip.status}
                    </span>
                  </div>
                </div>

                {/* Selections */}
                <div className="p-5 space-y-4">
                  {slip.selections?.map((bet: any) => (
                    <div key={bet.id} className="flex justify-between items-start border-l-2 border-slate-700 pl-4 py-1">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-white">
                          {bet.match_details?.home_team_name || 'Home'} vs {bet.match_details?.away_team_name || 'Away'}
                        </p>
                        <p className="text-slate-400 text-xs mt-1">
                           Selected: <span className="text-blue-400 font-bold uppercase">{bet.selection}</span>
                        </p>
                        {bet.result && (
                          <p className="text-[10px] bg-slate-800 text-slate-300 w-fit px-2 py-0.5 mt-2 rounded">
                            Final Score: {bet.result}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-blue-400 font-bold">@{bet.odds}</p>
                        <p className={`text-[10px] mt-1 font-bold ${bet.status === 'won' ? 'text-green-500' : 'text-slate-500'}`}>
                          {bet.status?.toUpperCase()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="p-4 bg-black/20 grid grid-cols-3 gap-4 border-t border-slate-700/50">
                  <div className="text-center">
                    <p className="text-[9px] text-slate-500 uppercase">Stake</p>
                    {/* 🚀 CHANGED: Using dynamic backend currency symbol/code */}
                    <p className="text-sm font-black uppercase">{activeCurrency} {slip.total_stake}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] text-slate-500 uppercase">Odds</p>
                    <p className="text-sm font-black">{slip.total_odds}</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-[9px] uppercase ${slip.status === 'won' ? 'text-green-500' : 'text-slate-500'}`}>
                      {slip.status === 'won' ? 'Paid Out' : 'Potential'}
                    </p>
                    {/* 🚀 CHANGED: Using dynamic backend currency symbol/code */}
                    <p className={`text-sm font-black uppercase ${slip.status === 'won' ? 'text-green-500' : 'text-white'}`}>
                      {activeCurrency} {slip.potential_win}
                    </p>
                  </div>
                </div>

              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}