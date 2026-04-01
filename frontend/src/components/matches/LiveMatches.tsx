'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { liveMatchesService } from '@/lib/api/liveMatches';

interface MatchData {
  id: number;
  home: {
    name?: string;
    score?: number;
    id?: number;
  };
  away: {
    name?: string;
    score?: number;
    id?: number;
  };
  status: {
    description?: string;
    code?: number;
  };
  leagueId: number;
  time: string;
  timeTS: number;
  statusId: number;
  tournamentStage: string;
  eliminatedTeamId: number | null;
}

export default function LiveMatches() {
  const { data: liveMatches = [], isLoading, error } = useQuery({
    queryKey: ['liveMatches'],
    queryFn: () => liveMatchesService.getLiveMatches(),
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        Failed to load matches. Please try again later.
      </div>
    );
  }

  if (!liveMatches || liveMatches.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
          Live Matches
        </h1>
        <div className="text-center text-gray-500 dark:text-gray-400 py-12">
          No live matches at the moment. Check back soon!
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
        Live Matches
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {liveMatches.map((match: MatchData, index: number) => {
          const homeTeam = match.home?.name || 'Home Team';
          const awayTeam = match.away?.name || 'Away Team';
          const homeScore = match.home?.score || 0;
          const awayScore = match.away?.score || 0;
          const statusText = match.status?.description || 'LIVE';
          const matchTime = match.time || 'LIVE';

          return (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="p-6">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 flex justify-between">
                  <span>League ID: {match.leagueId}</span>
                  <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full animate-pulse">
                    {statusText}
                  </span>
                </div>

                <div className="flex justify-between items-center mb-4">
                  <div className="flex-1 text-center">
                    <p className="font-semibold text-lg truncate" title={homeTeam}>
                      {homeTeam}
                    </p>
                    <p className="text-2xl font-bold text-green-500">{homeScore}</p>
                  </div>

                  <div className="px-4">
                    <span className="text-xl font-bold text-gray-400">VS</span>
                  </div>

                  <div className="flex-1 text-center">
                    <p className="font-semibold text-lg truncate" title={awayTeam}>
                      {awayTeam}
                    </p>
                    <p className="text-2xl font-bold text-green-500">{awayScore}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {matchTime}
                  </div>

                  <Link
                    href={`/matches/${match.id}`}
                    className="text-blue-500 hover:text-blue-600 font-medium"
                  >
                    Bet Now →
                  </Link>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}