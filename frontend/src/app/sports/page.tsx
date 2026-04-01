'use client';

import FeaturedSports from '@/components/home/FeaturedSports';
import UpcomingMatches from '@/components/home/UpcomingMatches';

export default function SportsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">All Sports</h1>
      <FeaturedSports />
      <UpcomingMatches />
    </div>
  );
}