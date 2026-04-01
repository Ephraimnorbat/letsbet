'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useBettingStore } from '@/store/bettingStore';
import { useAuthStore } from '@/store/authStore';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  Calendar,
  RefreshCw,
  DollarSign
} from 'lucide-react';
import { format } from 'date-fns';

export default function MyBetsPage() {
  const { myBets, fetchMyBets, cashoutBet, isLoading } = useBettingStore();
  const { user } = useAuthStore();
  const [filter, setFilter] = useState<'all' | 'pending' | 'won' | 'lost'>('all');

  useEffect(() => {
    fetchMyBets();
  }, []);

  const filteredBets = myBets.filter(bet => {
    if (filter === 'all') return true;
    return bet.status === filter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return { color: 'bg-yellow-500/20 text-yellow-500', icon: Clock, text: 'Pending' };
      case 'won':
        return { color: 'bg-green-500/20 text-green-500', icon: CheckCircle, text: 'Won' };
      case 'lost':
        return { color: 'bg-red-500/20 text-red-500', icon: XCircle, text: 'Lost' };
      case 'cashed_out':
        return { color: 'bg-blue-500/20 text-blue-500', icon: DollarSign, text: 'Cashed Out' };
      default:
        return { color: 'bg-gray-500/20 text-gray-500', icon: Clock, text: status };
    }
  };

  const canCashout = (bet: any) => {
    return bet.status === 'pending' && 
           new Date(bet.match_details?.match_date) > new Date();
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-950 py-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              My Bets
            </h1>
            <p className="text-gray-400 mt-2">Track your betting history and active bets</p>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="text-sm text-gray-400">Total Bets</div>
              <div className="text-2xl font-bold">{myBets.length}</div>
            </div>
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="text-sm text-gray-400">Active Bets</div>
              <div className="text-2xl font-bold text-yellow-500">
                {myBets.filter(b => b.status === 'pending').length}
              </div>
            </div>
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="text-sm text-gray-400">Total Won</div>
              <div className="text-2xl font-bold text-green-500">
                {myBets.filter(b => b.status === 'won').length}
              </div>
            </div>
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="text-sm text-gray-400">Win Rate</div>
              <div className="text-2xl font-bold">
                {myBets.length > 0 
                  ? ((myBets.filter(b => b.status === 'won').length / myBets.length) * 100).toFixed(1)
                  : 0}%
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex space-x-2 mb-6">
            {['all', 'pending', 'won', 'lost'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-4 py-2 rounded-lg capitalize transition ${
                  filter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
                }`}
              >
                {f}
              </button>
            ))}
            <button
              onClick={() => fetchMyBets()}
              className="px-4 py-2 rounded-lg bg-slate-800 text-gray-400 hover:bg-slate-700 transition ml-auto"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Bets List */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredBets.length === 0 ? (
            <div className="text-center py-12 bg-slate-800 rounded-lg">
              <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No bets found</h3>
              <p className="text-gray-400">Start placing bets to see them here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBets.map((bet, index) => {
                const StatusIcon = getStatusBadge(bet.status).icon;
                const statusInfo = getStatusBadge(bet.status);
                
                return (
                  <motion.div
                    key={bet.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-slate-800 rounded-lg p-4 hover:bg-slate-750 transition"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Match Info */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-xs text-gray-400">{bet.match_details?.league_name}</span>
                          <span className="text-xs text-gray-500">•</span>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3 text-gray-500" />
                            <span className="text-xs text-gray-500">
                              {format(new Date(bet.match_details?.match_date), 'MMM dd, HH:mm')}
                            </span>
                          </div>
                        </div>
                        <div className="font-semibold">
                          {bet.match_details?.home_team_name} vs {bet.match_details?.away_team_name}
                        </div>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-sm">
                            Selection: <span className="capitalize font-medium">{bet.selection}</span>
                          </span>
                          <span className="text-sm">
                            Odds: <span className="text-green-500 font-bold">{bet.odds}</span>
                          </span>
                        </div>
                      </div>

                      {/* Bet Amount */}
                      <div className="text-center">
                        <div className="text-sm text-gray-400">Stake</div>
                        <div className="font-bold">{bet.stake} KSH</div>
                      </div>

                      {/* Potential Win */}
                      <div className="text-center">
                        <div className="text-sm text-gray-400">Potential Win</div>
                        <div className="font-bold text-green-500">{bet.potential_win} KSH</div>
                      </div>

                      {/* Status & Actions */}
                      <div className="flex flex-col items-end space-y-2">
                        <div className={`flex items-center space-x-1 px-3 py-1 rounded-full ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          <span className="text-xs font-medium">{statusInfo.text}</span>
                        </div>
                        
                        {canCashout(bet) && (
                          <button
                            onClick={() => cashoutBet(bet.id)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition"
                          >
                            Cash Out
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}