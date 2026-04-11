// src/components/matches/MatchCard.tsx
export default function MatchCard({ match }: { match: any }) {
  return (
    <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
      <p>{match?.home_team} vs {match?.away_team}</p>
    </div>
  );
}