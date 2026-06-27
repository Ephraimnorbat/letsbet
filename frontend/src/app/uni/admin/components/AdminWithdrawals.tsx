'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';
import { Search, RefreshCw, ArrowDownLeft, Check, X, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

interface WithdrawalRequest {
  id: number;
  amount: string;
  currency: string;
  withdrawal_method: string;
  address_details: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  created_at: string;
  user: {
    username: string;
  };
}

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/wallet/admin-withdrawals/');
      setWithdrawals(response.data?.results || response.data || []);
    } catch (err) {
      toast.error('Failure synchronization with the outgoing pool logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const handleAction = async (id: number, action: 'approve' | 'reject') => {
    const notes = prompt(`Provide administrative context or confirmation references notes for this execution:`);
    if (notes === null) return; // Action cancelled

    try {
      await apiClient.post(`/wallet/admin-withdrawals/${id}/process/`, { action, admin_notes: notes });
      toast.success(`Withdrawal sequence flags updated successfully.`);
      fetchWithdrawals();
    } catch (err) {
      toast.error('Server rejected processing transaction step changes.');
    }
  };

  const filteredWithdrawals = withdrawals.filter(w => 
    w.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.withdrawal_method.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3 bg-[#0c101b] border border-slate-800 rounded-xl px-4 py-3 max-w-md w-full">
          <Search size={16} className="text-slate-500" />
          <input 
            type="text" 
            placeholder="Search outflux allocations by profile username or type..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-slate-200 placeholder-slate-500 w-full"
          />
        </div>
        <button 
          onClick={fetchWithdrawals} 
          disabled={loading}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 font-mono text-xs px-4 py-2.5 rounded-xl transition text-white self-stretch sm:self-auto justify-center"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin text-red-400' : 'text-slate-400'} /> Force Fluidity Sync
        </button>
      </div>

      <div className="bg-[#0c101b] border border-slate-800/80 rounded-xl overflow-hidden">
        <table className="w-full border-collapse text-left text-xs text-slate-300">
          <thead className="bg-[#111726] text-slate-400 font-mono text-[10px] uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="p-4">User Target</th>
              <th className="p-4">Outflow Metrics</th>
              <th className="p-4">Gateway Destination / Method</th>
              <th className="p-4">Address Parameters</th>
              <th className="p-4">State</th>
              <th className="p-4 text-right">Execution Sequence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {filteredWithdrawals.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500 font-sans">No structural settlement operations active.</td>
              </tr>
            ) : filteredWithdrawals.map((req) => (
              <tr key={req.id} className="hover:bg-slate-900/30 transition">
                <td className="p-4 font-bold text-white font-sans text-xs flex items-center gap-2">
                  <ArrowDownLeft size={14} className="text-red-400" /> {req.user?.username || 'System User'}
                </td>
                <td className="p-4 text-sm font-black text-red-400">
                  ${parseFloat(req.amount).toFixed(2)} <span className="text-[10px] font-mono text-slate-500 uppercase">{req.currency}</span>
                </td>
                <td className="p-4">
                  <span className="bg-slate-900 border border-slate-800 text-slate-300 px-2 py-1 rounded text-xs font-sans font-medium flex items-center gap-1.5 w-max">
                    <CreditCard size={12} className="text-blue-400" /> {req.withdrawal_method}
                  </span>
                </td>
                <td className="p-4 font-mono text-xs text-slate-300 max-w-xs truncate" title={req.address_details}>
                  {req.address_details}
                </td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase tracking-wider ${req.status === 'approved' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : req.status === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'}`}>
                    {req.status}
                  </span>
                </td>
                <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                  {req.status === 'pending' ? (
                    <>
                      <button 
                        onClick={() => handleAction(req.id, 'approve')}
                        className="bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 font-black p-1.5 rounded-lg transition inline-flex items-center"
                        title="Approve & Commit Ledger"
                      >
                        <Check size={14} />
                      </button>
                      <button 
                        onClick={() => handleAction(req.id, 'reject')}
                        className="bg-red-600/10 hover:bg-red-600/20 border border-red-500/30 text-red-400 font-black p-1.5 rounded-lg transition inline-flex items-center"
                        title="Reject Fluidity Event"
                      >
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <span className="text-[10px] text-slate-500 italic max-w-xs block truncate" title={req.admin_notes || ''}>
                      {req.admin_notes || 'Handled'}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}