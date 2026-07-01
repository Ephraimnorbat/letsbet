'use client';

import { ActiveTab } from '../types/admin.types';

interface AdminTabsProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  userCount: number;
}

const tabs: { id: ActiveTab; label: string; count?: number }[] = [
  { id: 'telemetry', label: 'System Debugger Terminal' },
  { id: 'users', label: 'Identity & User Registries' },
  { id: 'wallets', label: 'Wallet Liquidity Audits' },
  { id: 'fixtures', label: 'Sports Book Bookmaking' },
  { id: 'deposits', label: 'Payment Transactions Matrix (Deposits)' },
  { id: 'withdrawals', label: 'Settlements Queue (Withdrawals)' },
 { id: 'vouchers', label: 'Voucher Generator' },
];

export default function AdminTabs({ activeTab, onTabChange, userCount }: AdminTabsProps) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-800 pb-px overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-5 py-3 text-xs font-mono font-black uppercase tracking-wider border-b-2 transition whitespace-nowrap ${
            activeTab === tab.id
              ? 'border-red-500 text-white bg-red-500/5'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          {tab.label}
          {tab.count !== undefined && ` (${tab.count})`}
          {tab.id === 'users' && ` (${userCount})`}
        </button>
      ))}
    </div>
  );
}