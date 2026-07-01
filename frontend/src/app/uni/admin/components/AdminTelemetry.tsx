'use client';

import { useState } from 'react';
import { Terminal, Play, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api/client';
import { EndpointRoute } from '../types/admin.types';

const systemEndpoints: EndpointRoute[] = [
  { name: 'Fetch System State', method: 'GET', path: '/casino/crash/state/', category: 'Game Control', description: 'Returns current multiplier sequence metrics and timeline.' },
  { name: 'Force Crash Engine', method: 'POST', path: '/casino/crash/force-crash/', category: 'Game Control', description: 'Triggers emergency sequence flight drop execution sequence.' },
  { name: 'Adjust House Edge', method: 'POST', path: '/casino/crash/settings/', category: 'Game Control', description: 'Updates math margins, calculation seeds, and maximum limits.' },
  { name: 'Bulk Fetch Accounts', method: 'GET', path: '/auth/profiles/admin-list/', category: 'User Registry', description: 'Fetches structural user payload registry records.' },
  { name: 'Flush Connection Sockets', method: 'DELETE', path: '/security/flush-sessions/', category: 'Security', description: 'Terminals zombie WebSocket channels and flushes memory pools.' },
];

export default function AdminTelemetry() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointRoute | null>(null);
  const [apiResponsePayload, setApiResponsePayload] = useState<string>('// Execute an endpoint control to view live JSON output data.');

  const handleTriggerEndpoint = async (route: EndpointRoute) => {
    setSelectedEndpoint(route);
    setApiResponsePayload('// Connecting to backend cluster endpoint instance...');
    try {
      let res: any = await apiClient({ method: route.method, url: route.path });
      setApiResponsePayload(JSON.stringify(res?.data || { success: true }, null, 2));
      toast.success(`Executed ${route.name}`);
    } catch (error: any) {
      setApiResponsePayload(JSON.stringify(error?.response?.data || { error: 'EXEC_ERROR' }, null, 2));
      toast.error(`Execution failed.`);
    }
  };

  const getMethodColor = (method: string) => {
    const colors = {
      GET: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      POST: 'bg-green-500/10 text-green-400 border-green-500/20',
      PUT: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      DELETE: 'bg-red-500/10 text-red-400 border-red-500/20',
    };
    return colors[method as keyof typeof colors] || 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      <div className="lg:col-span-7 flex flex-col gap-3">
        <h4 className="text-xs font-black tracking-widest text-slate-400 uppercase mb-1 flex items-center gap-2">
          <Terminal size={14} className="text-red-500" /> Endpoint Matrix Core
        </h4>
        <div className="grid grid-cols-1 gap-2.5">
          {systemEndpoints.map((route) => (
            <div
              key={route.path}
              className={`bg-[#0c101b] border transition-all rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                selectedEndpoint?.path === route.path
                  ? 'border-red-500/50 shadow-[0_0_15px_rgba(220,38,38,0.05)]'
                  : 'border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded font-mono border ${getMethodColor(route.method)}`}>
                    {route.method}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500">{route.path}</span>
                  <span className="bg-slate-900 px-1.5 py-0.5 rounded text-[9px] font-black tracking-wider uppercase text-slate-400 border border-slate-800">
                    {route.category}
                  </span>
                </div>
                <h5 className="text-sm font-black text-white tracking-wide">{route.name}</h5>
                <p className="text-xs text-slate-400 max-w-xl">{route.description}</p>
              </div>
              <button
                onClick={() => handleTriggerEndpoint(route)}
                className="flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-mono font-black text-xs px-4 py-3 rounded-lg transition shrink-0 uppercase tracking-wider"
              >
                <Play size={12} fill="currentColor" /> Execute
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="lg:col-span-5 flex flex-col gap-3">
        <h4 className="text-xs font-black tracking-widest text-slate-400 uppercase mb-1 flex items-center gap-2">
          <AlertTriangle size={14} className="text-amber-500" /> Telemetry Stream Monitor
        </h4>
        <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[520px] lg:h-[580px] shadow-2xl">
          <div className="bg-[#0b0f19] px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/40" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
              {selectedEndpoint ? `${selectedEndpoint.method} // Debug Pipe` : 'System Idle'}
            </span>
          </div>
          <pre className="p-4 overflow-auto font-mono text-[11px] leading-relaxed text-emerald-400 bg-slate-950/90 flex-1 whitespace-pre-wrap">
            <code>{apiResponsePayload}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}