'use client';

import { Users, TrendingUp, Settings, Trophy } from 'lucide-react';
import { SystemMetric } from '../types/admin.types';

interface AdminStatsProps {
  metrics: SystemMetric;
  matchesCount: number;
}

export default function AdminStats({ metrics, matchesCount }: AdminStatsProps) {
  const stats = [
    {
      label: 'Live Sockets',
      value: `${metrics.active_players} Connected`,
      icon: Users,
      iconColor: 'text-blue-400',
      subText: 'Active Connections'
    },
    {
      label: 'Capital Fluidity Pool',
      value: `KSh ${metrics.total_pool_value.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      iconColor: 'text-emerald-400',
      subText: 'Total Pool Value'
    },
    {
      label: 'Multiplier Max Ceiling',
      value: `${metrics.system_multiplier_ceiling.toFixed(2)}x`,
      icon: Settings,
      iconColor: 'text-amber-400',
      subText: 'Current Limit'
    },
    {
      label: 'Bookmakers Custom Load',
      value: `${matchesCount} Fixtures`,
      icon: Trophy,
      iconColor: 'text-amber-400',
      subText: 'Active Matches'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div key={index} className="bg-[#0f1422] border border-slate-800/80 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
            <h3 className="text-2xl font-black font-mono text-white mt-1">
              {stat.value}
              {stat.subText && (
                <span className="text-xs text-green-400 font-normal ml-1">{stat.subText}</span>
              )}
            </h3>
          </div>
          <stat.icon size={20} className={stat.iconColor} />
        </div>
      ))}
    </div>
  );
}