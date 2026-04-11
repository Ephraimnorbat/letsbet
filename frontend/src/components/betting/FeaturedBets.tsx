'use client';

import { motion } from 'framer-motion';
import { useBettingStore } from '@/store/bettingStore';
import { useAuthStore } from '@/store/authStore';

const featuredBets = [
  { id: 1, match: 'Manchester United vs Liverpool', odds: 2.5, prediction: 'Home Win' },
  { id: 2, match: 'Real Madrid vs Barcelona', odds: 3.2, prediction: 'Draw' },
  { id: 3, match: 'Bayern Munich vs Dortmund', odds: 1.8, prediction: 'Away Win' },
];

export default function FeaturedBets() {
  const { addToBetSlip } = useBettingStore();
  const { user } = useAuthStore(); // Assuming user profile contains currency info
  const currencySymbol = user?.currency_symbol || '$';

  const handleQuickBet = (bet: any) => {
    addToBetSlip({
      id: `featured-${bet.id}`,
      matchId: bet.id,
      matchName: bet.match,
      selection: bet.prediction,
      odds: bet.odds,
    });
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <h2 className="text-2xl font-bold mb-6">Featured Bets</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {featuredBets.map((bet, index) => (
          <motion.div
            key={bet.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all"
          >
            <h3 className="font-semibold text-lg mb-2 text-white">{bet.match}</h3>
            <p className="text-gray-400 mb-4">{bet.prediction}</p>
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold text-green-500">{bet.odds}</span>
              <button 
                onClick={() => handleQuickBet(bet)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition font-bold"
              >
                Bet Now
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}