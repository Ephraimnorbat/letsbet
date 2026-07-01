'use client';

import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api/interceptor';
import { MatchFormData } from '../types/admin.types';

interface AdminMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchForm: MatchFormData;
  setMatchForm: (form: MatchFormData) => void;
  editingItem: any;
  leagues: any[];
  teams: any[];
  onRefresh: () => void;
}

export default function AdminMatchModal({
  isOpen,
  onClose,
  matchForm,
  setMatchForm,
  editingItem,
  leagues,
  teams,
  onRefresh
}: AdminMatchModalProps) {
  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/matches/matches-crud/${editingItem.id}/`, matchForm);
        toast.success('Match layout modified successfully');
      } else {
        await api.post('/matches/matches-crud/', matchForm);
        toast.success('Custom match compiled successfully');
      }
      onClose();
      onRefresh();
    } catch (err) {
      toast.error('Operation aborted. Review form payloads.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0f1422] border border-slate-800 w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
          <h3 className="font-bold text-white text-xs uppercase font-mono tracking-wider">
            {editingItem ? 'Edit Fixture Variables' : 'Construct New Special Match'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase mb-1">
                Home Team
              </label>
              <select
                required
                value={matchForm.home_team}
                onChange={e => setMatchForm({ ...matchForm, home_team: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 p-2.5 text-xs rounded-lg text-white"
              >
                <option value="">Select Team</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase mb-1">
                Away Team
              </label>
              <select
                required
                value={matchForm.away_team}
                onChange={e => setMatchForm({ ...matchForm, away_team: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 p-2.5 text-xs rounded-lg text-white"
              >
                <option value="">Select Team</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase mb-1">
                League Integration
              </label>
              <select
                required
                value={matchForm.league}
                onChange={e => setMatchForm({ ...matchForm, league: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 p-2.5 text-xs rounded-lg text-white"
              >
                <option value="">Select League</option>
                {leagues.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase mb-1">
                Kickoff Time
              </label>
              <input
                required
                type="datetime-local"
                value={matchForm.match_date}
                onChange={e => setMatchForm({ ...matchForm, match_date: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 p-2.5 text-xs rounded-lg text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div>
              <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase mb-1">Home Odds</label>
              <input
                type="number"
                step="0.01"
                value={matchForm.home_odds}
                onChange={e => setMatchForm({ ...matchForm, home_odds: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 p-2 text-xs rounded text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase mb-1">Draw Odds</label>
              <input
                type="number"
                step="0.01"
                value={matchForm.draw_odds}
                onChange={e => setMatchForm({ ...matchForm, draw_odds: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 p-2 text-xs rounded text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase mb-1">Away Odds</label>
              <input
                type="number"
                step="0.01"
                value={matchForm.away_odds}
                onChange={e => setMatchForm({ ...matchForm, away_odds: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 p-2 text-xs rounded text-white font-mono"
              />
            </div>
          </div>

          {editingItem && (
            <div className="grid grid-cols-3 gap-2 bg-red-500/5 p-3 rounded-xl border border-red-900/30">
              <div>
                <label className="block text-[9px] font-mono font-bold text-red-400 uppercase mb-1">Match State</label>
                <select
                  value={matchForm.status}
                  onChange={e => setMatchForm({ ...matchForm, status: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 p-1.5 text-xs rounded text-white"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="live">Live</option>
                  <option value="halftime">Half Time</option>
                  <option value="finished">Finished</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase mb-1">Home Score</label>
                <input
                  type="number"
                  value={matchForm.home_score}
                  onChange={e => setMatchForm({ ...matchForm, home_score: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-800 p-1.5 text-xs rounded text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase mb-1">Away Score</label>
                <input
                  type="number"
                  value={matchForm.away_score}
                  onChange={e => setMatchForm({ ...matchForm, away_score: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-800 p-1.5 text-xs rounded text-white font-mono"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-500 p-3 rounded-xl font-mono font-bold uppercase text-xs tracking-wider text-white transition"
          >
            {editingItem ? 'Execute Mutation Update' : 'Publish Open Market Fixture'}
          </button>
        </form>
      </div>
    </div>
  );
}