'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import MatchCard from '@/components/matches/MatchCard';
import { motion } from 'framer-motion';
import { Wallet, Trophy, TrendingUp, LayoutGrid } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [matches, setMatches] = useState([]);
  const [wallet, setWallet] = useState({ balance: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [matchRes, walletRes] = await Promise.all([
          apiClient.get('/api/matches/'), // Adjust to your actual endpoint
          apiClient.get(API_ENDPOINTS.wallet.balance)
        ]);
        setMatches(matchRes.results || matchRes);
        setWallet(walletRes);
      } catch (error) {
        console.error("Data fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Group matches by league name for the categorization view
  const groupedMatches = matches.reduce((acc: any, match: any) => {
    const leagueName = match.league?.name || 'Other Leagues';
    if (!acc[leagueName]) acc[leagueName] = [];
    acc[leagueName].push(match);
    return acc;
  }, {});

  const stats = [
    { label: 'Balance', value: `KSh ${Number(wallet.balance).toLocaleString()}`, icon: Wallet, color: 'text-green-500' },
    { label: 'Total Bets', value: user?.total_bets || 0, icon: LayoutGrid, color: 'text-blue-500' },
    { label: 'Total Wins', value: user?.total_wins || 0, icon: Trophy, color: 'text-purple-500' },
    { label: 'Profit', value: `KSh ${Number(user?.total_profit || 0).toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-500' },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-950 py-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {stats.map((stat, i) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-slate-900 border border-slate-800 p-5 rounded-2xl"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{stat.label}</p>
                    <p className="text-xl font-bold text-white mt-1">{stat.value}</p>
                  </div>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </motion.div>
            ))}
          </div>

          <h2 className="text-2xl font-bold text-white mb-6">Available Matches</h2>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => <div key={i} className="h-40 bg-slate-900 animate-pulse rounded-xl" />)}
            </div>
          ) : (
            <div className="space-y-12">
              {Object.entries(groupedMatches).map(([leagueName, leagueMatches]: any) => (
                <div key={leagueName}>
                  {/* League Header */}
                  <div className="flex items-center gap-3 mb-5 border-l-4 border-blue-600 pl-4">
                    <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest">
                      {leagueName}
                    </h3>
                    <span className="text-[10px] bg-slate-800 text-slate-500 px-2 py-0.5 rounded">
                      {leagueMatches.length} events
                    </span>
                  </div>

                  {/* Grid Layout for Match Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {leagueMatches.map((match: any) => (
                      <MatchCard key={match.id} match={match} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}