'use client';

import { useState } from 'react';
import { Wallet, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api/client';
import { AdminWalletPayload } from '../types/admin.types';
import AdminSearch from './AdminSearch';

interface AdminWalletsProps {
  wallets: AdminWalletPayload[];
  onRefresh: () => void;
}

export default function AdminWallets({ wallets, onRefresh }: AdminWalletsProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleModifyBalance = async (userId: number, type: 'credit' | 'debit') => {
    const value = prompt(`Specify transactional KSh value to ${type}:`);
    const parsedAmount = parseFloat(value || '0');
    if (isNaN(parsedAmount) || parsedAmount <= 0) return toast.error('Invalid monetary amount requested.');

    try {
      await apiClient.post(`/wallet/admin-adjust/`, { user_id: userId, amount: parsedAmount, action: type });
      toast.success('Ledger sequence adjusted cleanly');
      onRefresh();
    } catch (err) {
      toast.error('Balance shift operation aborted by server authority.');
    }
  };

  const filteredWallets = wallets.filter(
    (w) => w.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4">
      <AdminSearch
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Filter ledger systems by username mapping..."
      />

      <div className="bg-[#0c101b] border border-slate-800/80 rounded-xl overflow-hidden">
        <table className="w-full border-collapse text-left text-xs text-slate-300">
          <thead className="bg-[#111726] text-slate-400 font-mono text-[10px] uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="p-4">Owner Node</th>
              <th className="p-4">Liquid Balance</th>
              <th className="p-4">Transactional Volumes</th>
              <th className="p-4 text-right">Ledger Adjustments</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {filteredWallets.map((wallet) => (
              <tr key={wallet.id} className="hover:bg-slate-900/30 transition">
                <td className="p-4 font-bold text-white font-sans text-sm flex items-center gap-2">
                  <Wallet size={15} className="text-slate-500" /> {wallet.username}
                </td>
                <td className="p-4 text-sm font-black text-emerald-400">
                  KSh {wallet.balance.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                </td>
                <td className="p-4 font-sans text-slate-400 space-y-1">
                  <div className="flex items-center gap-1">
                    <ArrowUpRight size={12} className="text-green-500" />
                    Deposited: <span className="font-mono text-xs text-slate-200">KSh {wallet.total_deposited}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ArrowDownLeft size={12} className="text-red-500" />
                    Outflows: <span className="font-mono text-xs text-slate-200">KSh {wallet.total_withdrawn}</span>
                  </div>
                </td>
                <td className="p-4 text-right space-x-2">
                  <button
                    onClick={() => handleModifyBalance(wallet.id, 'credit')}
                    className="bg-green-500/10 hover:bg-green-500/20 text-green-400 font-black px-3 py-2 border border-green-500/20 rounded-lg transition"
                  >
                    + Credit
                  </button>
                  <button
                    onClick={() => handleModifyBalance(wallet.id, 'debit')}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 font-black px-3 py-2 border border-red-500/20 rounded-lg transition"
                  >
                    - Debit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}