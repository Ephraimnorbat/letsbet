'use client';

import { motion } from 'framer-motion';

interface FeaturedSportsProps {
  onLeagueSelect: (key: string | null) => void;
  activeLeague: string;
}

// ✅ Use the same sports as your sidebar
const sports = [
  { key: 'soccer_epl', name: 'Football (EPL)', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { key: 'soccer_uefa_champs_league', name: 'Champions League', flag: '🏆' },
  { key: 'basketball_nba', name: 'NBA Basketball', flag: '🏀' },
  { key: 'mma_mixed_martial_arts', name: 'MMA / UFC', flag: '🥊' },
  { key: 'boxing_boxing', name: 'Boxing', flag: '🥊' },
  { key: 'handball_germany_bundesliga', name: 'Handball', flag: '🤾' },
  { key: 'americanfootball_ncaaf', name: 'NCAAF', flag: '🏈' },
  { key: 'baseball_mlb', name: 'MLB Baseball', flag: '⚾' },
  { key: 'icehockey_nhl', name: 'NHL Hockey', flag: '🏒' },
];

export default function FeaturedSports({ onLeagueSelect, activeLeague }: FeaturedSportsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 py-2">
      <button
        onClick={() => onLeagueSelect(null)}
        className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
          activeLeague === 'all'
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
        }`}
      >
        All
      </button>
      {sports.map((sport) => (
        <motion.button
          key={sport.key}
          onClick={() => onLeagueSelect(sport.key)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
            activeLeague === sport.key
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <span className="mr-1">{sport.flag}</span>
          {sport.name}
        </motion.button>
      ))}
    </div>
  );
}