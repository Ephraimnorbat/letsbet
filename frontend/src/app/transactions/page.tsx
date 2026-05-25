'use client';
import { useEffect } from 'react';
import { useBettingStore } from '@/store/bettingStore';
import { ArrowUpRight, ArrowDownLeft, Receipt, Search } from 'lucide-react';
import { format } from 'date-fns';

export default function TransactionHistoryPage() {
  const { transactions = [], fetchTransactions, isLoading } = useBettingStore();

  useEffect(() => { fetchTransactions(); }, []);

  return (
    <div className="min-h-screen bg-[#0f172a] p-4 md:p-8 text-slate-200">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-white">Financial History</h1>
            <p className="text-slate-500 text-sm">Track your deposits, stakes, and winnings</p>
          </div>
          <div className="hidden md:block text-right">
             <p className="text-[10px] text-slate-500 uppercase font-bold">Current Balance</p>
             <p className="text-2xl font-black text-green-500">KSH 62,482.50</p>
          </div>
        </div>

        <div className="bg-[#1e293b] border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/50 text-[10px] uppercase tracking-widest text-slate-400">
                <th className="p-4 font-bold">Transaction Details</th>
                <th className="p-4 font-bold">Category</th>
                <th className="p-4 font-bold">Reference</th>
                <th className="p-4 font-bold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${tx.transaction_type === 'credit' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {tx.transaction_type === 'credit' ? <ArrowUpRight size={18}/> : <ArrowDownLeft size={18}/>}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-200">{tx.description}</p>
                        <p className="text-[10px] text-slate-500">{format(new Date(tx.created_at), 'dd MMM yyyy • HH:mm')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-[10px] font-black uppercase px-2 py-1 bg-slate-700 rounded text-slate-300">
                      {tx.category || 'General'}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-[10px] text-slate-500">
                    {tx.reference}
                  </td>
                  <td className={`p-4 text-right font-black ${tx.transaction_type === 'credit' ? 'text-green-400' : 'text-slate-300'}`}>
                    {tx.transaction_type === 'credit' ? '+' : '-'}{tx.amount} KSH
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {transactions.length === 0 && !isLoading && (
            <div className="p-20 text-center">
              <Receipt className="mx-auto text-slate-700 mb-4" size={48} />
              <p className="text-slate-500">No transactions found yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}