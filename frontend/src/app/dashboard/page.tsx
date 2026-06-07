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

  // Dynamic localization configuration tokens based on user profile settings
  const currencySymbol = user?.currency_symbol || 'KSh ';
  const localeFormat = user?.currency_code === 'USD' ? 'en-US' : 'en-KE';

  const [matches, setMatches] = useState<any[]>([]);
  const [wallet, setWallet] = useState({ balance: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // ================= FETCH DATA =================
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        const [matchesRes, walletRes] = await Promise.all([
          apiClient.get(API_ENDPOINTS.matches.upcoming),
          apiClient.get(API_ENDPOINTS.wallet.balance)
        ]);

        // ================= NORMALIZE MATCHES =================
        // Cast to any to safely navigate custom nested properties like .results or .data without Axios compilation blocks
        const responseData = (matchesRes as any);
        const rawMatches =
          responseData?.results ||
          responseData?.data?.results ||
          responseData?.data ||
          responseData ||
          [];

        // ================= NORMALIZE WALLET =================
        const walletData = (walletRes as any)?.data || walletRes || {};

        setMatches(Array.isArray(rawMatches) ? rawMatches : []);
        setWallet({
          balance: walletData.balance ?? 0
        });

      } catch (error) {
        console.error('Dashboard fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // ================= GROUP MATCHES =================
  const groupedMatches = matches.reduce((acc: any, match: any) => {
    const leagueName =
      match?.league?.name ||
      match?.league_name ||
      'Other Leagues';

    if (!acc[leagueName]) acc[leagueName] = [];
    acc[leagueName].push(match);

    return acc;
  }, {});

  // ================= STATS =================
  const stats = [
    {
      label: 'Balance',
      value: `${currencySymbol}${Number(wallet.balance).toLocaleString(localeFormat, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: Wallet,
      color: 'text-green-500'
    },
    {
      label: 'Total Bets',
      value: user?.total_bets ?? 0,
      icon: LayoutGrid,
      color: 'text-blue-500'
    },
    {
      label: 'Total Wins',
      value: user?.total_wins ?? 0,
      icon: Trophy,
      color: 'text-purple-500'
    },
    {
      label: 'Profit',
      value: `${currencySymbol}${Number(user?.total_profit ?? 0).toLocaleString(localeFormat, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: 'text-emerald-500'
    }
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-950 py-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">

          {/* ================= STATS ================= */}
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
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                      {stat.label}
                    </p>
                    <p className="text-xl font-bold text-white mt-1">
                      {stat.value}
                    </p>
                  </div>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </motion.div>
            ))}
          </div>

          <h2 className="text-2xl font-bold text-white mb-6">
            Available Matches
          </h2>

          {/* ================= LOADING ================= */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-40 bg-slate-900 animate-pulse rounded-xl"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-12">

              {Object.entries(groupedMatches).map(
                ([leagueName, leagueMatches]: any) => (
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

                    {/* Matches Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {leagueMatches.map((match: any) => (
                        <MatchCard key={match.id} match={match} />
                      ))}
                    </div>

                  </div>
                )
              )}

              {Object.keys(groupedMatches).length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  No upcoming sports events available right now.
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </ProtectedRoute>
  );
}