// src/components/betting/ResultCard.tsx
export default function ResultCard({ result }: { result: any }) {
  // Find scores from the API response
  const homeScore = result.scores?.find((s: any) => s.name === result.home_team)?.score;
  const awayScore = result.scores?.find((s: any) => s.name === result.away_team)?.score;

  const isHomeWinner = Number(homeScore) > Number(awayScore);
  const isAwayWinner = Number(awayScore) > Number(homeScore);
  const isDraw = homeScore === awayScore && homeScore !== undefined;

  return (
    <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 hover:border-slate-600 transition-all flex flex-col h-full shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
          {result.sport_title}
        </span>
        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
          FINISHED
        </span>
      </div>

      <div className="space-y-4 mb-2 flex-1">
        {/* Home Team */}
        <div className="flex justify-between items-center">
          <span className={`text-sm font-bold ${isHomeWinner ? 'text-green-400' : 'text-slate-300'}`}>
            {result.home_team}
            {isHomeWinner && " ✓"}
          </span>
          <span className={`text-xl font-black font-mono ${isHomeWinner ? 'text-green-500' : 'text-slate-500'}`}>
            {homeScore ?? 0}
          </span>
        </div>

        {/* Away Team */}
        <div className="flex justify-between items-center">
          <span className={`text-sm font-bold ${isAwayWinner ? 'text-green-400' : 'text-slate-300'}`}>
            {result.away_team}
            {isAwayWinner && " ✓"}
          </span>
          <span className={`text-xl font-black font-mono ${isAwayWinner ? 'text-green-500' : 'text-slate-500'}`}>
            {awayScore ?? 0}
          </span>
        </div>
      </div>

      <div className="pt-4 mt-auto border-t border-slate-800/50 flex justify-between items-center">
        <span className="text-[10px] text-slate-500">
          {new Date(result.commence_time).toLocaleDateString()}
        </span>
        <span className="text-[10px] font-bold text-blue-500 uppercase italic">
          {isDraw ? 'DRAW' : 'SETTLED'}
        </span>
      </div>
    </div>
  );
}