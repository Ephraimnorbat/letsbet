'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api/interceptor';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { Trophy, Calendar, Plus, Edit2, Trash2, CheckCircle2, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdministrativeCrudPage() {
  const [activeTab, setActiveTab] = useState<'matches' | 'leagues'>('matches');
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [matches, setMatches] = useState<any[]>([]);
  const [leagues, setLeagues] = useState<any[]>([]);
  const [sports, setSports] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);

  // UI Modal Management
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [showLeagueModal, setShowLeagueModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Form Field Trackers
  const [matchForm, setMatchForm] = useState({
    league: '', home_team: '', away_team: '', match_date: '', status: 'scheduled',
    home_score: 0, away_score: 0, home_odds: '2.00', draw_odds: '3.00', away_odds: '2.00'
  });

  const [leagueForm, setLeagueForm] = useState({
    name: '', sport: '', country: '', is_active: true
  });

  // Pull active system resources concurrently
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [matchesRes, leaguesRes, sportsRes, teamsRes] = await Promise.allSettled([
        api.get(API_ENDPOINTS.matches.adminFixtures),
        api.get(API_ENDPOINTS.matches.leagues),
        api.get(API_ENDPOINTS.matches.sports),
        api.get(API_ENDPOINTS.matches.teams),
      ]);

      if (matchesRes.status === 'fulfilled') setMatches(matchesRes.value.data?.results || matchesRes.value.data || []);
      if (leaguesRes.status === 'fulfilled') setLeagues(leaguesRes.value.data?.results || leaguesRes.value.data || []);
      if (sportsRes.status === 'fulfilled') setSports(sportsRes.value.data?.results || sportsRes.value.data || []);
      if (teamsRes.status === 'fulfilled') setTeams(teamsRes.value.data?.results || teamsRes.value.data || []);
    } catch (err) {
      toast.error('Failed to parse administrative datasets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Handle Match CRUD Actions
  const handleMatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        // Update existing item via base details link url string parsing or generic base router path
        await api.put(`/matches/matches-crud/${editingItem.id}/`, matchForm);
        toast.success('Match layout modified successfully');
      } else {
        await api.post('/matches/matches-crud/', matchForm);
        toast.success('Custom match compiled successfully');
      }
      setShowMatchModal(false);
      setEditingItem(null);
      loadDashboardData();
    } catch (err) {
      toast.error('Operation aborted. Review form payloads.');
    }
  };

  const deleteMatch = async (id: number) => {
    if (!confirm('Permanently remove this custom ledger match fixture?')) return;
    try {
      await api.delete(`/matches/matches-crud/${id}/`);
      toast.success('Fixture purged.');
      loadDashboardData();
    } catch (err) {
      toast.error('Removal failed.');
    }
  };

  // Handle League CRUD Actions
  const handleLeagueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/matches/leagues/${editingItem.id}/`, leagueForm);
        toast.success('League variables modified');
      } else {
        await api.post('/matches/leagues/', leagueForm);
        toast.success('New division category deployed');
      }
      setShowLeagueModal(false);
      setEditingItem(null);
      loadDashboardData();
    } catch (err) {
      toast.error('Validation error writing league entry.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 p-4 md:p-8 pt-20">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER BRANDING CONTROL PANEL */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-white">Fixture Configuration Dashboard</h1>
            <p className="text-xs text-slate-400">Database manipulation portal for custom markets and regional rulesets</p>
          </div>
          
          <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab('matches')}
              className={`px-4 py-2 text-xs font-bold uppercase rounded-lg transition-all flex items-center gap-2 ${activeTab === 'matches' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
            >
              <Calendar size={14} /> Matches ({matches.length})
            </button>
            <button 
              onClick={() => setActiveTab('leagues')}
              className={`px-4 py-2 text-xs font-bold uppercase rounded-lg transition-all flex items-center gap-2 ${activeTab === 'leagues' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
            >
              <Trophy size={14} /> Leagues ({leagues.length})
            </button>
          </div>
        </div>

        {/* CONTROLS BUTTON BAR */}
        <div className="mb-6 flex justify-end">
          {activeTab === 'matches' ? (
            <button 
              onClick={() => { setEditingItem(null); setMatchForm({ league: '', home_team: '', away_team: '', match_date: '', status: 'scheduled', home_score: 0, away_score: 0, home_odds: '2.00', draw_odds: '3.00', away_odds: '2.00' }); setShowMatchModal(true); }}
              className="bg-green-600 hover:bg-green-500 text-white font-bold text-xs uppercase px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition"
            >
              <Plus size={16} /> Create Custom Match
            </button>
          ) : (
            <button 
              onClick={() => { setEditingItem(null); setLeagueForm({ name: '', sport: '', country: '', is_active: true }); setShowLeagueModal(true); }}
              className="bg-green-600 hover:bg-green-500 text-white font-bold text-xs uppercase px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition"
            >
              <Plus size={16} /> Register League
            </button>
          )}
        </div>

        {/* LOADING INDICATOR MATRIX FRAME */}
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm animate-pulse">Synchronizing systemic model instances...</div>
        ) : (
          <div className="bg-[#1e293b] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            {activeTab === 'matches' ? (
              /* MATCHES MATRIX GRID */
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800/60 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <th className="p-4">Fixture Teams</th>
                    <th className="p-4">League</th>
                    <th className="p-4">Status & Score</th>
                    <th className="p-4">1X2 Pricing Odds</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-sm">
                  {matches.map((match) => (
                    <tr key={match.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="p-4 font-bold text-white">
                        {match.home_team_name} <span className="text-slate-500 text-xs font-normal">vs</span> {match.away_team_name}
                      </td>
                      <td className="p-4 text-xs text-slate-300">{match.league_name || 'Custom'}</td>
                      <td className="p-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-900 border border-slate-700 rounded uppercase tracking-tight text-amber-400 mr-2">
                          {match.status}
                        </span>
                        <span className="font-mono font-bold text-white">{match.home_score} - {match.away_score}</span>
                      </td>
                      <td className="p-4 font-mono text-xs text-green-400">
                        {Number(match.home_odds).toFixed(2)} | {Number(match.draw_odds).toFixed(2)} | {Number(match.away_odds).toFixed(2)}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => {
                              setEditingItem(match);
                              setMatchForm({
                                league: match.league?.toString() || '',
                                home_team: match.home_team?.toString() || '',
                                away_team: match.away_team?.toString() || '',
                                match_date: match.match_date ? match.match_date.substring(0, 16) : '',
                                status: match.status,
                                home_score: match.home_score,
                                away_score: match.away_score,
                                home_odds: match.home_odds,
                                draw_odds: match.draw_odds,
                                away_odds: match.away_odds
                              });
                              setShowMatchModal(true);
                            }}
                            className="p-1.5 hover:bg-blue-600/20 text-blue-400 rounded transition"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => deleteMatch(match.id)} className="p-1.5 hover:bg-red-600/20 text-red-400 rounded transition">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              /* LEAGUES MATRIX GRID */
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800/60 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <th className="p-4">League Classification Title</th>
                    <th className="p-4">Region/Country</th>
                    <th className="p-4">System Registry Status</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-sm">
                  {leagues.map((league) => (
                    <tr key={league.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="p-4 font-bold text-white">{league.name}</td>
                      <td className="p-4 text-xs text-slate-300 uppercase tracking-wider">{league.country}</td>
                      <td className="p-4">
                        {league.is_active ? (
                          <span className="text-[10px] text-green-400 font-bold bg-green-950/40 px-2 py-0.5 rounded border border-green-900 flex items-center gap-1 w-max"><CheckCircle2 size={10} /> Active</span>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800 flex items-center gap-1 w-max">Suspended</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => {
                              setEditingItem(league);
                              setLeagueForm({ name: league.name, sport: league.sport?.toString() || '', country: league.country, is_active: league.is_active });
                              setShowLeagueModal(true);
                            }}
                            className="p-1.5 hover:bg-blue-600/20 text-blue-400 rounded transition"
                          >
                            <Edit2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* MATCH FORM MANIPULATION MODAL OVERLAY */}
      {showMatchModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1e293b] border border-slate-700 w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 bg-slate-800/60 border-b border-slate-700 flex justify-between items-center">
              <h3 className="font-bold text-white text-base uppercase tracking-tight">{editingItem ? 'Edit Match Variables' : 'Construct New Special Match'}</h3>
              <button onClick={() => setShowMatchModal(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleMatchSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Home Team</label>
                  <select required value={matchForm.home_team} onChange={e => setMatchForm({...matchForm, home_team: e.target.value})} className="w-full bg-slate-900 border border-slate-700 p-2 text-sm rounded-lg text-white">
                    <option value="">Select Team</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Away Team</label>
                  <select required value={matchForm.away_team} onChange={e => setMatchForm({...matchForm, away_team: e.target.value})} className="w-full bg-slate-900 border border-slate-700 p-2 text-sm rounded-lg text-white">
                    <option value="">Select Team</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">League System</label>
                  <select required value={matchForm.league} onChange={e => setMatchForm({...matchForm, league: e.target.value})} className="w-full bg-slate-900 border border-slate-700 p-2 text-sm rounded-lg text-white">
                    <option value="">Select League</option>
                    {leagues.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Kickoff Datetime</label>
                  <input required type="datetime-local" value={matchForm.match_date} onChange={e => setMatchForm({...matchForm, match_date: e.target.value})} className="w-full bg-slate-900 border border-slate-700 p-2 text-sm rounded-lg text-white" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Home Odds</label>
                  <input type="number" step="0.01" value={matchForm.home_odds} onChange={e => setMatchForm({...matchForm, home_odds: e.target.value})} className="w-full bg-slate-900 border border-slate-700 p-2 text-sm rounded-lg text-white font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Draw Odds</label>
                  <input type="number" step="0.01" value={matchForm.draw_odds} onChange={e => setMatchForm({...matchForm, draw_odds: e.target.value})} className="w-full bg-slate-900 border border-slate-700 p-2 text-sm rounded-lg text-white font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Away Odds</label>
                  <input type="number" step="0.01" value={matchForm.away_odds} onChange={e => setMatchForm({...matchForm, away_odds: e.target.value})} className="w-full bg-slate-900 border border-slate-700 p-2 text-sm rounded-lg text-white font-mono" />
                </div>
              </div>

              {editingItem && (
                <div className="border-t border-slate-800 pt-4 grid grid-cols-3 gap-2 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                  <div>
                    <label className="block text-[9px] font-bold text-amber-500 uppercase mb-1">Match State</label>
                    <select value={matchForm.status} onChange={e => setMatchForm({...matchForm, status: e.target.value})} className="w-full bg-slate-950 border border-slate-700 p-1.5 text-xs rounded text-white">
                      <option value="scheduled">Scheduled</option>
                      <option value="live">Live</option>
                      <option value="halftime">Half Time</option>
                      <option value="finished">Finished</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Home Score</label>
                    <input type="number" value={matchForm.home_score} onChange={e => setMatchForm({...matchForm, home_score: parseInt(e.target.value) || 0})} className="w-full bg-slate-950 border border-slate-700 p-1.5 text-xs rounded text-white font-mono" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Away Score</label>
                    <input type="number" value={matchForm.away_score} onChange={e => setMatchForm({...matchForm, away_score: parseInt(e.target.value) || 0})} className="w-full bg-slate-950 border border-slate-700 p-1.5 text-xs rounded text-white font-mono" />
                  </div>
                </div>
              )}

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 p-3 rounded-xl font-bold uppercase text-xs tracking-wider text-white transition mt-2">
                {editingItem ? 'Execute Mutation Update' : 'Publish Open Market Fixture'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* LEAGUE REGISTER MODAL OVERLAY */}
      {showLeagueModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1e293b] border border-slate-700 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 bg-slate-800/60 border-b border-slate-700 flex justify-between items-center">
              <h3 className="font-bold text-white text-base uppercase tracking-tight">{editingItem ? 'Edit League Registry' : 'Register New Division'}</h3>
              <button onClick={() => setShowLeagueModal(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleLeagueSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">League Name</label>
                <input required type="text" placeholder="e.g. Kenya Premier League" value={leagueForm.name} onChange={e => setLeagueForm({...leagueForm, name: e.target.value})} className="w-full bg-slate-900 border border-slate-700 p-2.5 text-sm rounded-lg text-white" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Sport Context</label>
                <select required value={leagueForm.sport} onChange={e => setLeagueForm({...leagueForm, sport: e.target.value})} className="w-full bg-slate-900 border border-slate-700 p-2.5 text-sm rounded-lg text-white">
                  <option value="">Select Sport Branch</option>
                  {sports.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Country/Region</label>
                <input required type="text" placeholder="e.g. Kenya" value={leagueForm.country} onChange={e => setLeagueForm({...leagueForm, country: e.target.value})} className="w-full bg-slate-900 border border-slate-700 p-2.5 text-sm rounded-lg text-white" />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="is_active" checked={leagueForm.is_active} onChange={e => setLeagueForm({...leagueForm, is_active: e.target.checked})} className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0 focus:ring-offset-0" />
                <label htmlFor="is_active" className="text-xs font-bold text-slate-300 uppercase tracking-tight">Enable Live In Betting Boards</label>
              </div>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 p-3 rounded-xl font-bold uppercase text-xs tracking-wider text-white transition mt-2">
                {editingItem ? 'Modify Registry Parameters' : 'Append Division Instantiation'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}