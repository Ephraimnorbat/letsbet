'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';
import { Search, RefreshCw, Layers, CheckCircle, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

interface DepositTransaction {
  id: string;
  order_id: string;
  payment_id: string | null;
  pay_address: string | null;
  price_amount: string;
  price_currency: string;
  pay_amount: string | null;
  pay_currency: string | null;
  status: 'waiting' | 'confirming' | 'confirmed' | 'finished' | 'failed' | 'expired';
  is_credited: boolean;
  created_at: string;
  user: {
    username: string;
    email: string;
  };
}

export default function AdminDeposits() {
  const [deposits, setDeposits] = useState<DepositTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchDeposits = async () => {
    setLoading(true);
    try {
      // Adjusted route to align with your URL patterns
      const response = await apiClient.get('wallet/admin-deposits/');
      setDeposits(response.data?.results || response.data || []);
    } catch (err) {
      toast.error('Failed to sync payment transactions ledger.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'finished':
      case 'confirmed':
        return <span className="px-2 py-0.5 rounded font-black text-[9px] uppercase tracking-tighter bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 w-max"><CheckCircle size={10} /> {status}</span>;
      case 'failed':
      case 'expired':
        return <span className="px-2 py-0.5 rounded font-black text-[9px] uppercase tracking-tighter bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1 w-max"><XCircle size={10} /> {status}</span>;
      default:
        return <span className="px-2 py-0.5 rounded font-black text-[9px] uppercase tracking-tighter bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1 w-max"><Clock size={10} /> {status}</span>;
    }
  };

  const filteredDeposits = deposits.filter(d => 
    d.order_id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.user?.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3 bg-[#0c101b] border border-slate-800 rounded-xl px-4 py-3 max-w-md w-full">
          <Search size={16} className="text-slate-500" />
          <input 
            type="text" 
            placeholder="Filter deposits by Order ID or Username..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-slate-200 placeholder-slate-500 w-full"
          />
        </div>
        <button 
          onClick={fetchDeposits} 
          disabled={loading}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 font-mono text-xs px-4 py-2.5 rounded-xl transition text-white self-stretch sm:self-auto justify-center"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin text-blue-400' : 'text-slate-400'} /> Reload Gateway
        </button>
      </div>

      <div className="bg-[#0c101b] border border-slate-800/80 rounded-xl overflow-hidden">
        <table className="w-full border-collapse text-left text-xs text-slate-300">
          <thead className="bg-[#111726] text-slate-400 font-mono text-[10px] uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="p-4">Order ID & Date</th>
              <th className="p-4">Account Node</th>
              <th className="p-4">Fiat Cost</th>
              <th className="p-4">Crypto Paid Out</th>
              <th className="p-4">Status Matrix</th>
              <th className="p-4 text-center">Double Spend Guard</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {filteredDeposits.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500 font-sans">No production deposit logs fetched matching criteria.</td>
              </tr>
            ) : filteredDeposits.map((tx) => (
              <tr key={tx.id} className="hover:bg-slate-900/30 transition">
                <td className="p-4">
                  <div className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Layers size={13} className="text-slate-500" /> {tx.order_id}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{new Date(tx.created_at).toLocaleString()}</div>
                </td>
                <td className="p-4">
                  <div className="font-bold text-slate-200 font-sans text-xs">{tx.user?.username || 'Unknown'}</div>
                  <div className="text-[10px] text-slate-500">{tx.user?.email}</div>
                </td>
                <td className="p-4 text-slate-200 font-sans font-medium">
                  ${parseFloat(tx.price_amount).toFixed(2)} <span className="text-[10px] font-mono text-slate-500 uppercase">{tx.price_currency}</span>
                </td>
                <td className="p-4 text-blue-400">
                  {tx.pay_amount ? parseFloat(tx.pay_amount).toFixed(6) : '—'} <span className="text-[10px] text-slate-500 uppercase">{tx.pay_currency || ''}</span>
                </td>
                <td className="p-4">{getStatusBadge(tx.status)}</td>
                <td className="p-4 text-center">
                  <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase tracking-wider ${tx.is_credited ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-slate-900 text-slate-500 border border-slate-800'}`}>
                    {tx.is_credited ? 'Credited' : 'Pending Core'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}