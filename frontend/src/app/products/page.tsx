'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api/interceptor'; // Your configured interceptor instance
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { useAuthStore } from '@/store/authStore';
import { Trophy, ShieldAlert, Sparkles, Activity, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function AllMatchesPage() {
  const { user } = useAuthStore();
  const [activeSource, setActiveSource] = useState<'all' | 'custom' | 'external'>('all');
  const [loading, setLoading] = useState(true);
  
  const [externalMatches, setExternalMatches] = useState<any[]>([]);
  const [adminMatches, setAdminMatches] = useState<any[]>([]);

  const currencySymbol = user?.currency_symbol || 'KSh';

  useEffect(() => {
    const fetchAllSources = async () => {
      try {
        setLoading(true);
        // Fire parallel asynchronous requests safely wrapped inside our token interceptor
        const [externalRes, adminRes] = await Promise.allSettled([
          api.get(API_ENDPOINTS.matches.upcoming),
          api.get(API_ENDPOINTS.matches.adminFixtures)
        ]);

        if (externalRes.status === 'fulfilled') {
          const data = externalRes.value.data;
          setExternalMatches(data?.data || data?.results || data || []);
        }
        
        if (adminRes.status === 'fulfilled') {
          const data = adminRes.value.data;
          setAdminMatches(data?.results || data || []);
        }
      } catch (err) {
        console.error('Error compiling fixtures feed:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllSources();
  }, []);

  // Normalization layer mapping differences between structural variations in API models
  const normalizedExternal = externalMatches.map(m => ({
    id: m.id || m.slug,
    homeTeam: m.home_team || m.home_team_name || 'Home Team',
    awayTeam: m.away_team || m.away_team_name || 'Away Team',
    league: m.league_name || m.sport_title || 'International',
    date: m.match_date || m.commence_time,
    odds: { home: m.home_odds || 1.95, draw: m.draw_odds || 3.40, away: m.away_odds || 3.10 },
    isCustom: false
  }));

  const normalizedAdmin = adminMatches.map(m => ({
    id: m.id,
    homeTeam: m.home_team_name,
    awayTeam: m.away_team_name,
    league: m.league_name || 'Local Custom Specials',
    date: m.match_date,
    odds: { home: Number(m.home_odds), draw: Number(m.draw_odds), away: Number(m.away_odds) },
    isCustom: true
  }));

  // Combine or filter items depending on user selection
  const combinedFixtures = [
    ...(activeSource === 'all' || activeSource === 'custom' ? normalizedAdmin : []),
    ...(activeSource === 'all' || activeSource === 'external' ? normalizedExternal : [])
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 pt-24 px-4 md:px-8 pb-12">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight uppercase text-white flex items-center gap-2">
              <Trophy className="text-amber-500" /> Sports Book Fixtures
            </h1>
            <p className="text-sm text-slate-400 mt-1">Select from real-time live events or regional custom match markets</p>
          </div>

          {/* VIEW CONTROLLER TABS */}
          <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl w-full md:w-auto">
            {(['all', 'custom', 'external'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveSource(tab)}
                className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold uppercase rounded-lg transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  activeSource === tab
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab === 'all' && <Activity size={14} />}
                {tab === 'custom' && <Sparkles size={14} className="text-amber-400" />}
                {tab === 'external' && <Clock size={14} />}
                {tab === 'all' ? 'All Matches' : tab === 'custom' ? 'Specials / Local' : 'Global Markets'}
              </button>
            ))}
          </div>
        </div>

        {/* LOADING & EMPTY STATES */}
        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-24 bg-slate-900/50 rounded-xl border border-slate-800 animate-pulse animate-duration-1000" />
            ))}
          </div>
        ) : combinedFixtures.length === 0 ? (
          <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-2xl">
            <ShieldAlert className="mx-auto text-slate-600 mb-3" size={40} />
            <p className="text-slate-400 font-medium">No matches available inside this category right now.</p>
          </div>
        ) : (
          /* FIXTURES MATRIX LISTING */
          <div className="space-y-3">
            {combinedFixtures.map((match) => (
              <div 
                key={`${match.isCustom ? 'c' : 'e'}-${match.id}`} 
                className={`p-4 bg-slate-900 border transition rounded-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                  match.isCustom ? 'border-amber-500/30 hover:border-amber-500/50 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/10' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* MATCH DATA */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider bg-blue-950/40 px-2 py-0.5 rounded border border-blue-900/40">
                      {match.league}
                    </span>
                    {match.isCustom && (
                      <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/40 flex items-center gap-1">
                        <Sparkles size={10} /> Local Boost
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                    <h3 className="font-bold text-base text-white tracking-tight">
                      {match.homeTeam} <span className="text-slate-500 text-xs font-normal px-1">vs</span> {match.awayTeam}
                    </h3>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {format(new Date(match.date), 'dd MMM yyyy • HH:mm')}
                    </span>
                  </div>
                </div>

                {/* ODDS SELECTION INTERFACE */}
                <div className="grid grid-cols-3 gap-2 w-full lg:w-80 shrink-0">
                  {/* Home Win Button */}
                  <button className="bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 p-2 rounded-lg text-center transition group">
                    <span className="block text-[9px] text-slate-500 font-bold uppercase group-hover:text-slate-400">1</span>
                    <span className="text-sm font-mono font-black text-green-400">{match.odds.home.toFixed(2)}</span>
                  </button>

                  {/* Draw Button */}
                  <button className="bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 p-2 rounded-lg text-center transition group">
                    <span className="block text-[9px] text-slate-500 font-bold uppercase group-hover:text-slate-400">X</span>
                    <span className="text-sm font-mono font-black text-slate-300">{match.odds.draw.toFixed(2)}</span>
                  </button>

                  {/* Away Win Button */}
                  <button className="bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 p-2 rounded-lg text-center transition group">
                    <span className="block text-[9px] text-slate-500 font-bold uppercase group-hover:text-slate-400">2</span>
                    <span className="text-sm font-mono font-black text-green-400">{match.odds.away.toFixed(2)}</span>
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}