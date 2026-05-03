"use client";

import React from 'react';
import { useLiveMatches } from '@/lib/api/hooks/useLiveMatches';
import MatchCard from '@/components/matches/MatchCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function LiveMatches() {
  const { data: matches, isLoading, error } = useLiveMatches();

  if (isLoading) return <div className="h-96 flex items-center justify-center"><LoadingSpinner /></div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Upcoming Matches</h1>

      <div className="grid gap-4">
        {Array.isArray(matches) && matches.length > 0 ? (
          matches.map((match: any) => (
            <MatchCard key={match.id} match={match} />
          ))
        ) : (
          <div className="bg-gray-800 p-10 rounded-xl text-center">
            <p className="text-gray-400">No matches available right now.</p>
          </div>
        )}
      </div>
    </div>
  );
}