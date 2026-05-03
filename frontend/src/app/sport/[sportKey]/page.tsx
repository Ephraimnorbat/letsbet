'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { useBettingStore } from '@/store/bettingStore';
import toast from 'react-hot-toast';

export default function SportPage() {
  const params = useParams();
  const sportKey = params.sportKey;
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Get the store actions to add bets to the slip
  const { addToBetSlip, selections } = useBettingStore();

  useEffect(() => {
    let isMounted = true;
    if (sportKey && isMounted) {
      fetchGames();
    }
    return () => { isMounted = false; };
  }, [sportKey]);

  const fetchGames = async () => {
    try {
      setLoading(true);
      // ✅ Using the environment variable as requested
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const response = await fetch(`${baseUrl}/matches/odds/${sportKey}/`);
      const result = await response.json();
      
      if (result.status === 'success') {
        setGames(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch games:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOdd = (game: any, outcome: any) => {
    addToBetSlip({
      id: `${game.id}-${outcome.name}`, // Unique ID for the selection
      matchId: game.id,
      matchName: `${game.home_team} vs ${game.away_team}`,
      selection: outcome.name,
      odds: outcome.price,
    });
    toast.success(`Added ${outcome.name} to slip`);
  };

  return (
    <div className="p-6 text-white bg-slate-900 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold uppercase tracking-tight">
          {sportKey?.toString().replace(/_/g, ' ')}
        </h1>
        <div className="text-sm text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
          {games.length} Live Events
        </div>
      </div>
      
      {loading ? (
        <div className="flex flex-col justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-slate-400 animate-pulse">Fetching latest odds...</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {games.length > 0 ? (
            games.map((game) => {
              const bookmaker = game.bookmakers?.[0];
              const market = bookmaker?.markets?.find((m: any) => m.key === 'h2h');
              
              // Map outcomes for 1X2 display
              const outcomes = ['Home', 'Draw', 'Away'].map(type => {
                return market?.outcomes?.find((o: any) => 
                  type === 'Draw' ? o.name === 'Draw' : o.name === (type === 'Home' ? game.home_team : game.away_team)
                );
              });

              return (
                <div key={game.id} className="bg-slate-800 p-5 rounded-2xl border border-slate-700 flex flex-col md:flex-row justify-between items-center hover:border-blue-500/50 transition-all group">
                  <div className="flex-1 mb-4 md:mb-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
                      <p className="text-xs text-blue-400 font-semibold uppercase">{game.sport_title}</p>
                      <span className="text-slate-600">|</span>
                      <p className="text-xs text-slate-400">
                        {new Date(game.commence_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-xl font-bold flex items-center">
                      <span className="group-hover:text-blue-400 transition-colors">{game.home_team}</span>
                      <span className="text-slate-500 mx-3 font-light text-sm italic">vs</span>
                      <span className="group-hover:text-blue-400 transition-colors">{game.away_team}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    {outcomes.map((outcome, index) => {
                      // Check if this specific outcome is already in the slip
                      const isSelected = selections.some(s => s.id === `${game.id}-${outcome?.name}`);
                      
                      return (
                        <button 
                          key={index}
                          disabled={!outcome}
                          onClick={() => outcome && handleSelectOdd(game, outcome)}
                          className={`px-6 py-3 rounded-xl min-w-[90px] transition-all flex flex-col items-center border 
                            ${isSelected 
                              ? 'bg-blue-600 border-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.4)]' 
                              : 'bg-slate-900 border-slate-700 hover:border-blue-400 hover:bg-slate-800'
                            } disabled:opacity-50`}
                        >
                          <span className={`text-[10px] uppercase font-bold ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                            {index === 0 ? '1' : index === 1 ? 'X' : '2'}
                          </span>
                          <span className={`font-mono font-bold ${isSelected ? 'text-white' : 'text-blue-400'}`}>
                            {outcome ? outcome.price.toFixed(2) : 'N/A'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-20 bg-slate-800/50 rounded-3xl border-2 border-dashed border-slate-700">
              <p className="text-slate-400 text-lg">No active matches for this category.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}