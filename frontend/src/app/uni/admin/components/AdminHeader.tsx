'use client';

import { ShieldAlert, RefreshCw } from 'lucide-react';

interface AdminHeaderProps {
  isSyncing: boolean;
  onSync: () => void;
}

export default function AdminHeader({ isSyncing, onSync }: AdminHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
      <div className="flex items-center gap-3">
        <div className="bg-red-500/10 border border-red-500/30 p-2.5 rounded-xl text-red-500">
          <ShieldAlert size={26} />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white uppercase font-mono">
            UNI // SUPER ENGINES SYSTEM
          </h1>
          <p className="text-xs text-slate-400">
            Production Ledger Gateway Matrix & Real-time Cluster State Controller
          </p>
        </div>
      </div>
      <button
        onClick={onSync}
        className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 font-mono text-xs px-4 py-2.5 rounded-xl transition"
      >
        <RefreshCw size={13} className={isSyncing ? 'animate-spin text-red-400' : 'text-slate-400'} />
        Sync Core Ecosystem
      </button>
    </div>
  );
}