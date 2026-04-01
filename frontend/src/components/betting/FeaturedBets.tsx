'use client';

import { motion } from 'framer-motion';

const featuredBets = [
  { id: 1, match: 'Manchester United vs Liverpool', odds: 2.5, prediction: 'Home Win' },
  { id: 2, match: 'Real Madrid vs Barcelona', odds: 3.2, prediction: 'Draw' },
  { id: 3, match: 'Bayern Munich vs Dortmund', odds: 1.8, prediction: 'Away Win' },
];

export default function FeaturedBets() {
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
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <h3 className="font-semibold text-lg mb-2">{bet.match}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{bet.prediction}</p>
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold text-green-500">{bet.odds}</span>
              <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
                Bet Now
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}