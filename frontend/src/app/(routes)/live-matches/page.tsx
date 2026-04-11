"use client";

import React, { useEffect, useState } from 'react';
import { fetchLeagueOdds } from '@/lib/api/liveMatches';
import { Match } from '@/types/matches';
import MatchCard from '@/components/matches/MatchCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function LiveMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [leagueName, setLeagueName] = useState('Loading...');
  const [loading, setLoading] = useState(true);

  // Defaulting to 39 (EPL) as discussed
  const LEAGUE_ID = 39; 

  useEffect(() => {
    const getOdds = async () => {
      try {
        const data = await fetchLeagueOdds(LEAGUE_ID);
        setMatches(data.matches);
        setLeagueName(data.league_name);
      } catch (err) {
        // Error handling is managed by the interceptor toast
      } finally {
        setLoading(false);
      }
    };

    getOdds();
    
    // Production tip: Refresh odds every 60 seconds
    const interval = setInterval(getOdds, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="h-96 flex items-center justify-center"><LoadingSpinner /></div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">{leagueName}</h1>
          <p className="text-gray-400 mt-1">Live Betting Markets</p>
        </div>
        <div className="text-xs text-green-500 flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          Live Updates Active
        </div>
      </div>

      <div className="grid gap-4">
        {matches.length > 0 ? (
          matches.map((match) => (
            <MatchCard key={match.match_id} match={match} />
          ))
        ) : (
          <div className="bg-gray-800 p-10 rounded-xl text-center">
            <p className="text-gray-400">No active matches found for {leagueName}.</p>
          </div>
        )}
      </div>
    </div>
  );
}