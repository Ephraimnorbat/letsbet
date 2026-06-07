'use client';

import { useState } from 'react';
import FeaturedSports from '@/components/home/FeaturedSports';
import UpcomingMatches from '@/components/home/UpcomingMatches';

export default function SportsPage() {
  // Manage the selected sportKey state, defaulting to 'upcoming'
  const [selectedLeague, setSelectedLeague] = useState<string>('upcoming');

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-white">All Sports</h1>
      
      {/* Pass state and state controller dynamically down to child components */}
      <FeaturedSports 
        activeLeague={selectedLeague} 
        onLeagueSelect={setSelectedLeague} 
      />
      
      {/* The upcoming matches grid will now automatically refetch when selectedLeague updates */}
      <UpcomingMatches sportKey={selectedLeague} />
    </div>
  );
}