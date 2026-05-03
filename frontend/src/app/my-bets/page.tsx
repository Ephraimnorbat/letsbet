'use client';
import { useEffect } from 'react';
import { useBettingStore } from '@/store/bettingStore';
import { Clock, CheckCircle, XCircle, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function MyBetsPage() {
  const { myBets = [], fetchMyBets, isLoading } = useBettingStore();

  useEffect(() => { fetchMyBets(); }, []);

  if (isLoading) return <div className="p-10 text-center text-white">Loading your slips...</div>;

  return (
    <div className="min-h-screen bg-[#0f172a] p-4 md:p-8 text-slate-200">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Betting History</h1>

        <div className="space-y-4">
          {myBets.map((slip) => (
            <div key={slip.id} className="bg-[#1e293b] border border-slate-700 rounded-lg overflow-hidden">
              {/* Slip Header */}
              <div className="p-4 bg-slate-800/50 flex justify-between items-center border-b border-slate-700">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Slip #{slip.id}</p>
                  <p className="text-sm font-medium">{format(new Date(slip.created_at), 'dd MMM yyyy, HH:mm')}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Status</p>
                  <span className={`text-xs font-bold uppercase ${slip.status === 'won' ? 'text-green-500' : 'text-yellow-500'}`}>
                    {slip.status}
                  </span>
                </div>
              </div>

              {/* Selections List */}
              <div className="p-4 space-y-3">
                {slip.selections?.map((bet: any) => (
                  <div key={bet.id} className="flex justify-between text-sm">
                    <div className="flex-1">
                      <p className="font-semibold">{bet.match_details.home_team_name} vs {bet.match_details.away_team_name}</p>
                      <p className="text-slate-400 text-xs">{bet.match_details.league_name} • {bet.selection}</p>
                    </div>
                    <div className="text-right font-mono text-blue-400">@{bet.odds}</div>
                  </div>
                ))}
              </div>

              {/* Financial Summary */}
              <div className="p-4 bg-slate-900/30 grid grid-cols-3 gap-2 border-t border-slate-700 text-center">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase">Stake</p>
                  <p className="font-bold">{slip.total_stake} KSH</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase">Total Odds</p>
                  <p className="font-bold">{slip.total_odds}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase text-green-500">Potential Win</p>
                  <p className="font-bold text-green-500">{slip.potential_win} KSH</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}