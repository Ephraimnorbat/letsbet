'use client';

import { useState } from 'react';
import { Calendar, Trophy, Plus, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api/interceptor';
import { FixtureSubTab, MatchFormData, LeagueFormData } from '../types/admin.types';
import AdminMatchModal from './AdminMatchModal';
import AdminLeagueModal from './AdminLeagueModal';

interface AdminFixturesProps {
  matches: any[];
  leagues: any[];
  sports: any[];
  teams: any[];
  onRefresh: () => void;
}

export default function AdminFixtures({ matches, leagues, sports, teams, onRefresh }: AdminFixturesProps) {
  const [fixtureSubTab, setFixtureSubTab] = useState<FixtureSubTab>('matches');
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [showLeagueModal, setShowLeagueModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const [matchForm, setMatchForm] = useState<MatchFormData>({
    league: '',
    home_team: '',
    away_team: '',
    match_date: '',
    status: 'scheduled',
    home_score: 0,
    away_score: 0,
    home_odds: '2.00',
    draw_odds: '3.00',
    away_odds: '2.00'
  });

  const [leagueForm, setLeagueForm] = useState<LeagueFormData>({
    name: '',
    sport: '',
    country: '',
    is_active: true
  });

  const deleteMatch = async (id: number) => {
    if (!confirm('Permanently remove this custom ledger match fixture?')) return;
    try {
      await api.delete(`/matches/matches-crud/${id}/`);
      toast.success('Fixture purged.');
      onRefresh();
    } catch (err) {
      toast.error('Removal failed.');
    }
  };

  const handleEditMatch = (match: any) => {
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
  };

  const handleEditLeague = (league: any) => {
    setEditingItem(league);
    setLeagueForm({
      name: league.name,
      sport: league.sport?.toString() || '',
      country: league.country,
      is_active: league.is_active
    });
    setShowLeagueModal(true);
  };

  return (
    <div className="flex flex-col gap-4 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0f1422] p-4 rounded-xl border border-slate-800">
        <div className="flex bg-slate-950 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setFixtureSubTab('matches')}
            className={`px-4 py-2 text-xs font-mono font-bold uppercase rounded-lg transition-all flex items-center gap-2 ${
              fixtureSubTab === 'matches' ? 'bg-red-600 text-white' : 'text-slate-400'
            }`}
          >
            <Calendar size={14} /> Matches Custom Matrix ({matches.length})
          </button>
          <button
            onClick={() => setFixtureSubTab('leagues')}
            className={`px-4 py-2 text-xs font-mono font-bold uppercase rounded-lg transition-all flex items-center gap-2 ${
              fixtureSubTab === 'leagues' ? 'bg-red-600 text-white' : 'text-slate-400'
            }`}
          >
            <Trophy size={14} /> Leagues Division ({leagues.length})
          </button>
        </div>

        <button
          onClick={() => {
            setEditingItem(null);
            if (fixtureSubTab === 'matches') {
              setMatchForm({
                league: '',
                home_team: '',
                away_team: '',
                match_date: '',
                status: 'scheduled',
                home_score: 0,
                away_score: 0,
                home_odds: '2.00',
                draw_odds: '3.00',
                away_odds: '2.00'
              });
              setShowMatchModal(true);
            } else {
              setLeagueForm({ name: '', sport: '', country: '', is_active: true });
              setShowLeagueModal(true);
            }
          }}
          className="bg-green-600 hover:bg-green-500 text-white font-mono font-bold text-xs uppercase px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition self-stretch sm:self-auto justify-center"
        >
          <Plus size={16} /> Create {fixtureSubTab === 'matches' ? 'Custom Match' : 'Register League'}
        </button>
      </div>

      <div className="bg-[#0c101b] border border-slate-800/80 rounded-xl overflow-hidden shadow-2xl">
        {fixtureSubTab === 'matches' ? (
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead className="bg-[#111726] text-slate-400 font-mono text-[10px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-4">Fixture Teams</th>
                <th className="p-4">League</th>
                <th className="p-4">Status & Score</th>
                <th className="p-4">1X2 Pricing Odds</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 font-mono">
              {matches.map((match) => (
                <tr key={match.id} className="hover:bg-slate-900/30 transition">
                  <td className="p-4 font-bold text-white font-sans text-sm">
                    {match.home_team_name} <span className="text-slate-500 text-xs font-normal">vs</span> {match.away_team_name}
                  </td>
                  <td className="p-4 text-slate-400">{match.league_name || 'Custom Spec'}</td>
                  <td className="p-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 bg-slate-950 border border-slate-800 rounded uppercase mr-2 ${
                      match.status === 'live' ? 'text-red-400' :
                      match.status === 'finished' ? 'text-green-400' :
                      'text-amber-400'
                    }`}>
                      {match.status}
                    </span>
                    <span className="font-bold text-white text-sm">{match.home_score} - {match.away_score}</span>
                  </td>
                  <td className="p-4 text-green-400 font-bold">
                    {Number(match.home_odds).toFixed(2)} | {Number(match.draw_odds).toFixed(2)} | {Number(match.away_odds).toFixed(2)}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEditMatch(match)}
                        className="p-1.5 bg-slate-900 hover:bg-blue-600/20 text-blue-400 rounded-lg border border-slate-800 transition"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => deleteMatch(match.id)}
                        className="p-1.5 bg-slate-900 hover:bg-red-600/20 text-red-400 rounded-lg border border-slate-800 transition"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead className="bg-[#111726] text-slate-400 font-mono text-[10px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-4">League Classification Title</th>
                <th className="p-4">Region/Country</th>
                <th className="p-4">Registry State</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 font-mono">
              {leagues.map((league) => (
                <tr key={league.id} className="hover:bg-slate-900/30 transition">
                  <td className="p-4 font-bold text-white font-sans text-sm">{league.name}</td>
                  <td className="p-4 text-slate-400 uppercase tracking-wider">{league.country}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase ${
                      league.is_active
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                        : 'bg-slate-900 text-slate-500'
                    }`}>
                      {league.is_active ? 'Active Market' : 'Suspended'}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleEditLeague(league)}
                      className="p-1.5 bg-slate-900 hover:bg-blue-600/20 text-blue-400 rounded-lg border border-slate-800 transition"
                    >
                      <Edit2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      {showMatchModal && (
        <AdminMatchModal
          isOpen={showMatchModal}
          onClose={() => setShowMatchModal(false)}
          matchForm={matchForm}
          setMatchForm={setMatchForm}
          editingItem={editingItem}
          leagues={leagues}
          teams={teams}
          onRefresh={onRefresh}
        />
      )}

      {showLeagueModal && (
        <AdminLeagueModal
          isOpen={showLeagueModal}
          onClose={() => setShowLeagueModal(false)}
          leagueForm={leagueForm}
          setLeagueForm={setLeagueForm}
          editingItem={editingItem}
          sports={sports}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
}