'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuthStore } from '@/store/authStore';
import { useWalletBalance } from '@/lib/api/hooks/useWallet';
import { useMyBets } from '@/lib/api/hooks/useBetting';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data: wallet } = useWalletBalance();
  const { data: bets } = useMyBets();

  const stats = [
    { label: 'Total Bets', value: user?.total_bets || 0, color: 'bg-blue-500' },
    { label: 'Total Wins', value: user?.total_wins || 0, color: 'bg-green-500' },
    { label: 'Total Profit', value: `$${user?.total_profit || 0}`, color: 'bg-purple-500' },
    { label: 'Balance', value: `$${wallet?.balance || 0}`, color: 'bg-yellow-500' },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
              >
                <p className="text-gray-500 dark:text-gray-400 text-sm">{stat.label}</p>
                <p className="text-2xl font-bold mt-2">{stat.value}</p>
                <div className={`h-1 w-full ${stat.color} mt-4 rounded-full`}></div>
              </motion.div>
            ))}
          </div>
          
          {/* Recent Bets */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Recent Bets</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3">Match</th>
                    <th className="text-left py-3">Selection</th>
                    <th className="text-left py-3">Odds</th>
                    <th className="text-left py-3">Stake</th>
                    <th className="text-left py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bets?.results?.slice(0, 5).map((bet: any) => (
                    <tr key={bet.id} className="border-b border-gray-200 dark:border-gray-700">
                      <td className="py-3">
                        {bet.match_details?.home_team_name} vs {bet.match_details?.away_team_name}
                      </td>
                      <td className="py-3 capitalize">{bet.selection}</td>
                      <td className="py-3">{bet.odds}</td>
                      <td className="py-3">${bet.stake}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          bet.status === 'won' ? 'bg-green-500 text-white' :
                          bet.status === 'lost' ? 'bg-red-500 text-white' :
                          bet.status === 'pending' ? 'bg-yellow-500 text-white' :
                          'bg-gray-500 text-white'
                        }`}>
                          {bet.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}