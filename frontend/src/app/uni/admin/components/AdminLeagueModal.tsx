'use client';

import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api/interceptor';
import { LeagueFormData } from '../types/admin.types';

interface AdminLeagueModalProps {
  isOpen: boolean;
  onClose: () => void;
  leagueForm: LeagueFormData;
  setLeagueForm: (form: LeagueFormData) => void;
  editingItem: any;
  sports: any[];
  onRefresh: () => void;
}

export default function AdminLeagueModal({
  isOpen,
  onClose,
  leagueForm,
  setLeagueForm,
  editingItem,
  sports,
  onRefresh
}: AdminLeagueModalProps) {
  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/matches/leagues/${editingItem.id}/`, leagueForm);
        toast.success('League variables modified');
      } else {
        await api.post('/matches/leagues/', leagueForm);
        toast.success('New division category deployed');
      }
      onClose();
      onRefresh();
    } catch (err) {
      toast.error('Validation error writing league entry.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0f1422] border border-slate-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
          <h3 className="font-bold text-white text-xs uppercase font-mono tracking-wider">
            {editingItem ? 'Edit League Registry' : 'Register New Division'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase mb-1">
              League Name
            </label>
            <input
              required
              type="text"
              placeholder="e.g. Kenya Premier League"
              value={leagueForm.name}
              onChange={e => setLeagueForm({ ...leagueForm, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 p-2.5 text-xs rounded-lg text-white"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase mb-1">
              Sport Context
            </label>
            <select
              required
              value={leagueForm.sport}
              onChange={e => setLeagueForm({ ...leagueForm, sport: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 p-2.5 text-xs rounded-lg text-white"
            >
              <option value="">Select Sport Branch</option>
              {sports.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase mb-1">
              Country/Region
            </label>
            <input
              required
              type="text"
              placeholder="e.g. Kenya"
              value={leagueForm.country}
              onChange={e => setLeagueForm({ ...leagueForm, country: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 p-2.5 text-xs rounded-lg text-white"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="is_active"
              checked={leagueForm.is_active}
              onChange={e => setLeagueForm({ ...leagueForm, is_active: e.target.checked })}
              className="rounded bg-slate-950 border-slate-800 text-red-600 focus:ring-0 focus:ring-offset-0"
            />
            <label htmlFor="is_active" className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-tight">
              Enable Live In Betting Boards
            </label>
          </div>

          <button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-500 p-3 rounded-xl font-mono font-bold uppercase text-xs tracking-wider text-white transition"
          >
            {editingItem ? 'Modify Registry Parameters' : 'Append Division Instantiation'}
          </button>
        </form>
      </div>
    </div>
  );
}