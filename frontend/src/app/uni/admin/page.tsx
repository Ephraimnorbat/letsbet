'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/lib/api/client';
import { api } from '@/lib/api/interceptor'; // For match and league operations
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { useRouter } from 'next/navigation';
import { 
  ShieldAlert, Users, Terminal, RefreshCw, Key,
  Settings, Play, TrendingUp, AlertTriangle, CheckCircle2,
  Wallet, Search, ArrowUpRight, ArrowDownLeft, Trophy, Calendar, Plus, Edit2, Trash2, X
} from 'lucide-react';
import toast from 'react-hot-toast';

import AdminDeposits from './components/AdminDeposits';
import AdminWithdrawals from './components/AdminWithdrawals';

// --- TS Type Definitions ---
interface SystemMetric {
  active_players: number;
  total_pool_value: number;
  system_multiplier_ceiling: number;
  websocket_status: 'healthy' | 'degraded' | 'offline';
}

interface EndpointRoute {
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  category: 'Game Control' | 'Wallet Engine' | 'User Registry' | 'Security';
  description: string;
}

interface AdminUserPayload {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  total_bets: number;
  wallet_balance: number;
  created_at: string;
}

interface AdminWalletPayload {
  id: number;
  username: string;
  balance: number;
  total_deposited: number;
  total_withdrawn: number;
  total_won: number;
}

export default function SuperAdminDashboard() {
  const {
    user: currentAdmin,
    isAuthenticated,
  } = useAuthStore();
  console.log({
  isAuthenticated,
  currentAdmin
});
  const router = useRouter();
  
  // Adjusted for Fixtures Matrix integration
  const [activeTab, setActiveTab] = useState<'telemetry' | 'users' | 'wallets' | 'fixtures' | 'deposits' | 'withdrawals'>('telemetry');
  const [fixtureSubTab, setFixtureSubTab] = useState<'matches' | 'leagues'>('matches');
  
  // Real-time Dynamic Data Matrix Hooks
  const [metrics, setMetrics] = useState<SystemMetric>({ 
    active_players: 0, 
    total_pool_value: 0, 
    system_multiplier_ceiling: 100, 
    websocket_status: 'healthy' 
  });
  const [userRegistry, setUserRegistry] = useState<AdminUserPayload[]>([]);
  const [walletRegistry, setWalletRegistry] = useState<AdminWalletPayload[]>([]);
  
  // Sports Book Resource Hooks
  const [matches, setMatches] = useState<any[]>([]);
  const [leagues, setLeagues] = useState<any[]>([]);
  const [sports, setSports] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);

  // Fixture Modals
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [showLeagueModal, setShowLeagueModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Form Field Trackers
  const [matchForm, setMatchForm] = useState({
    league: '', home_team: '', away_team: '', match_date: '', status: 'scheduled',
    home_score: 0, away_score: 0, home_odds: '2.00', draw_odds: '3.00', away_odds: '2.00'
  });

  const [leagueForm, setLeagueForm] = useState({
    name: '', sport: '', country: '', is_active: true
  });
  
  // Interaction Filters & Loaders
  const [searchTerm, setSearchTerm] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointRoute | null>(null);
  const [apiResponsePayload, setApiResponsePayload] = useState<string>('// Execute an endpoint control to view live JSON output data.');

  const systemEndpoints: EndpointRoute[] = [
    { name: 'Fetch System State', method: 'GET', path: '/casino/crash/state/', category: 'Game Control', description: 'Returns current multiplier sequence metrics and timeline.' },
    { name: 'Force Crash Engine', method: 'POST', path: '/casino/crash/force-crash/', category: 'Game Control', description: 'Triggers emergency sequence flight drop execution sequence.' },
    { name: 'Adjust House Edge', method: 'POST', path: '/casino/crash/settings/', category: 'Game Control', description: 'Updates math margins, calculation seeds, and maximum limits.' },
    { name: 'Bulk Fetch Accounts', method: 'GET', path: '/auth/profiles/admin-list/', category: 'User Registry', description: 'Fetches structural user payload registry records.' },
    { name: 'Flush Connection Sockets', method: 'DELETE', path: '/security/flush-sessions/', category: 'Security', description: 'Terminals zombie WebSocket channels and flushes memory pools.' },
  ];

  // --- IDENTITY ENFORCEMENT GUARD ---
 useEffect(() => {
  // Wait for Zustand persistence to finish loading


  // Not logged in
  if (!isAuthenticated) {
    toast.error("Please login first.");
    router.push('/auth');
    return;
  }

  // Logged in but not admin
  if (
    currentAdmin &&
    !currentAdmin.is_staff &&
    !currentAdmin.is_superuser
  ) {
    toast.error("Access Denied: Administrative Scopes Required.");
    router.push('/');
  }
}, [isAuthenticated, currentAdmin, router]);

  // --- Dynamic Core Data Synchronizers ---
  const syncPlatformState = async () => {
    if (!isAuthenticated || (currentAdmin && !currentAdmin.is_staff && !currentAdmin.is_superuser)) return;
    
    setIsSyncing(true);
    try {
      const metricRes = await apiClient.get('/casino/crash/admin-metrics/');
      if (metricRes?.data) setMetrics(metricRes.data);

      const usersRes = await apiClient.get('/auth/profiles/admin-list/');
      if (usersRes?.data) setUserRegistry(usersRes.data);

      const walletsRes = await apiClient.get('/wallet/admin-audit/');
      if (walletsRes?.data) setWalletRegistry(walletsRes.data);

      // Fetch Sports Book Datasets
      const [matchesRes, leaguesRes, sportsRes, teamsRes] = await Promise.allSettled([
        api.get(API_ENDPOINTS.matches.adminFixtures),
        api.get(API_ENDPOINTS.matches.leagues),
        api.get(API_ENDPOINTS.matches.sports),
        api.get(API_ENDPOINTS.matches.teams),
      ]);
      console.log("LEAGUES PAYLOAD RAW:", leaguesRes.status === 'fulfilled' ? leaguesRes.value.data : 'FAILED');
console.log("TEAMS PAYLOAD RAW:", teamsRes.status === 'fulfilled' ? teamsRes.value.data : 'FAILED');

      if (matchesRes.status === 'fulfilled') setMatches(matchesRes.value.data?.results || matchesRes.value.data || []);
      if (leaguesRes.status === 'fulfilled') setLeagues(leaguesRes.value.data?.results || leaguesRes.value.data || []);
      if (sportsRes.status === 'fulfilled') setSports(sportsRes.value.data?.results || sportsRes.value.data || []);
      if (teamsRes.status === 'fulfilled') setTeams(teamsRes.value.data?.results || teamsRes.value.data || []);

    } catch (err: any) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        router.push('/auth');
      } else {
        toast.error('Partial failure during cluster data fetch');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && (currentAdmin?.is_staff || currentAdmin?.is_superuser)) {
      syncPlatformState();
    }
  }, [isAuthenticated, currentAdmin]);

  // --- Core Core Action Implementations ---
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

  const handleUpdatePassword = async (userId: number, username: string) => {
    const newPassword = prompt(`Enter a new secure password string for account: [ ${username} ]`);
    if (!newPassword || newPassword.trim().length < 6) {
      return toast.error('Password specification must contain at least 6 characters.');
    }
    try {
      await apiClient.post(`/auth/profiles/${userId}/admin-change-password/`, { password: newPassword });
      toast.success(`Credentials overwritten for ${username}`);
    } catch (err) {
      toast.error('Failed to change password. Verify your admin session privileges.');
    }
  };

  const handleModifyBalance = async (userId: number, type: 'credit' | 'debit') => {
    const value = prompt(`Specify transactional KSh value to ${type}:`);
    const parsedAmount = parseFloat(value || '0');
    if (isNaN(parsedAmount) || parsedAmount <= 0) return toast.error('Invalid monetary amount requested.');

    try {
      await apiClient.post(`/wallet/admin-adjust/`, { user_id: userId, amount: parsedAmount, action: type });
      toast.success('Ledger sequence adjusted cleanly');
      syncPlatformState();
    } catch (err) {
      toast.error('Balance shift operation aborted by server authority.');
    }
  };

  // --- Fixture Action Implementations ---
  const handleMatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/matches/matches-crud/${editingItem.id}/`, matchForm);
        toast.success('Match layout modified successfully');
      } else {
        await api.post('/matches/matches-crud/', matchForm);
        toast.success('Custom match compiled successfully');
      }
      setShowMatchModal(false);
      setEditingItem(null);
      syncPlatformState();
    } catch (err) {
      toast.error('Operation aborted. Review form payloads.');
    }
  };

  const deleteMatch = async (id: number) => {
    if (!confirm('Permanently remove this custom ledger match fixture?')) return;
    try {
      await api.delete(`/matches/matches-crud/${id}/`);
      toast.success('Fixture purged.');
      syncPlatformState();
    } catch (err) {
      toast.error('Removal failed.');
    }
  };

  const handleLeagueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/matches/leagues/${editingItem.id}/`, leagueForm);
        toast.success('League variables modified');
      } else {
        await api.post('/matches/leagues/', leagueForm);
        toast.success('New division category deployed');
      }
      setShowLeagueModal(false);
      setEditingItem(null);
      syncPlatformState();
    } catch (err) {
      toast.error('Validation error writing league entry.');
    }
  };

  const filteredUsers = userRegistry.filter(u => u.username.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredWallets = walletRegistry.filter(w => w.username.toLowerCase().includes(searchTerm.toLowerCase()));



if (!isAuthenticated) return null;

if (
  currentAdmin &&
  !currentAdmin.is_staff &&
  !currentAdmin.is_superuser
) {
  return null;
}
  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 font-sans p-6 pt-24">
      <div className="max-w-[1600px] mx-auto flex flex-col gap-6">
        
        {/* Header Block Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="bg-red-500/10 border border-red-500/30 p-2.5 rounded-xl text-red-500">
              <ShieldAlert size={26} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white uppercase font-mono">UNI // SUPER ENGINES SYSTEM</h1>
              <p className="text-xs text-slate-400">Production Ledger Gateway Matrix & Real-time Cluster State Controller</p>
            </div>
          </div>
          <button 
            onClick={syncPlatformState}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 font-mono text-xs px-4 py-2.5 rounded-xl transition"
          >
            <RefreshCw size={13} className={isSyncing ? 'animate-spin text-red-400' : 'text-slate-400'} /> Sync Core Ecosystem
          </button>
        </div>

        {/* Telemetry Overview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-[#0f1422] border border-slate-800/80 p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Sockets</p>
              <h3 className="text-2xl font-black font-mono text-white mt-1">{metrics.active_players} <span className="text-xs text-green-400 font-normal">Connected</span></h3>
            </div>
            <Users size={20} className="text-blue-400" />
          </div>
          <div className="bg-[#0f1422] border border-slate-800/80 p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Capital Fluidity Pool</p>
              <h3 className="text-2xl font-black font-mono text-white mt-1">KSh {metrics.total_pool_value.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</h3>
            </div>
            <TrendingUp size={20} className="text-emerald-400" />
          </div>
          <div className="bg-[#0f1422] border border-slate-800/80 p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Multiplier Max Ceiling</p>
              <h3 className="text-2xl font-black font-mono text-white mt-1">{metrics.system_multiplier_ceiling.toFixed(2)}x</h3>
            </div>
            <Settings size={20} className="text-amber-400" />
          </div>
          <div className="bg-[#0f1422] border border-slate-800/80 p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bookmakers Custom Load</p>
              <h3 className="text-2xl font-black font-mono text-white mt-1">{matches.length} <span className="text-xs text-amber-400 font-normal">Fixtures</span></h3>
            </div>
            <Trophy size={20} className="text-amber-400" />
          </div>
        </div>

        {/* Dynamic Navigation Tabs Row */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-px overflow-x-auto">
          <button 
            onClick={() => setActiveTab('telemetry')}
            className={`px-5 py-3 text-xs font-mono font-black uppercase tracking-wider border-b-2 transition whitespace-nowrap ${activeTab === 'telemetry' ? 'border-red-500 text-white bg-red-500/5' : 'border-transparent text-slate-400 hover:text-white'}`}
          >
            System Debugger Terminal
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-5 py-3 text-xs font-mono font-black uppercase tracking-wider border-b-2 transition whitespace-nowrap ${activeTab === 'users' ? 'border-red-500 text-white bg-red-500/5' : 'border-transparent text-slate-400 hover:text-white'}`}
          >
            Identity & User Registries ({userRegistry.length})
          </button>
          <button 
            onClick={() => setActiveTab('wallets')}
            className={`px-5 py-3 text-xs font-mono font-black uppercase tracking-wider border-b-2 transition whitespace-nowrap ${activeTab === 'wallets' ? 'border-red-500 text-white bg-red-500/5' : 'border-transparent text-slate-400 hover:text-white'}`}
          >
            Wallet Liquidity Audits
          </button>
          <button 
            onClick={() => setActiveTab('fixtures')}
            className={`px-5 py-3 text-xs font-mono font-black uppercase tracking-wider border-b-2 transition whitespace-nowrap ${activeTab === 'fixtures' ? 'border-red-500 text-white bg-red-500/5' : 'border-transparent text-slate-400 hover:text-white'}`}
          >
            Sports Book Bookmaking
          </button>
          <button 
            onClick={() => setActiveTab('deposits')}
            className={`px-5 py-3 text-xs font-mono font-black uppercase tracking-wider border-b-2 transition whitespace-nowrap ${activeTab === 'deposits' ? 'border-red-500 text-white bg-red-500/5' : 'border-transparent text-slate-400 hover:text-white'}`}
          >
            Payment Transactions Matrix (Deposits)
          </button>

          <button 
            onClick={() => setActiveTab('withdrawals')}
            className={`px-5 py-3 text-xs font-mono font-black uppercase tracking-wider border-b-2 transition whitespace-nowrap ${activeTab === 'withdrawals' ? 'border-red-500 text-white bg-red-500/5' : 'border-transparent text-slate-400 hover:text-white'}`}
          >
            Settlements Queue (Withdrawals)
          </button>
        </div>

        {/* --- TELEMETRY TAB --- */}
        {activeTab === 'telemetry' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-7 flex flex-col gap-3">
              <h4 className="text-xs font-black tracking-widest text-slate-400 uppercase mb-1 flex items-center gap-2">
                <Terminal size={14} className="text-red-500" /> Endpoint Matrix Core
              </h4>
              <div className="grid grid-cols-1 gap-2.5">
                {systemEndpoints.map((route) => (
                  <div key={route.path} className={`bg-[#0c101b] border transition-all rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${selectedEndpoint?.path === route.path ? 'border-red-500/50 shadow-[0_0_15px_rgba(220,38,38,0.05)]' : 'border-slate-800/80 hover:border-slate-700'}`}>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded font-mono border ${route.method === 'GET' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : route.method === 'POST' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>{route.method}</span>
                        <span className="text-xs font-mono font-bold text-slate-500">{route.path}</span>
                        <span className="bg-slate-900 px-1.5 py-0.5 rounded text-[9px] font-black tracking-wider uppercase text-slate-400 border border-slate-800">{route.category}</span>
                      </div>
                      <h5 className="text-sm font-black text-white tracking-wide">{route.name}</h5>
                      <p className="text-xs text-slate-400 max-w-xl">{route.description}</p>
                    </div>
                    <button onClick={() => handleTriggerEndpoint(route)} className="flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-mono font-black text-xs px-4 py-3 rounded-lg transition shrink-0 uppercase tracking-wider"><Play size={12} fill="currentColor" /> Execute</button>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-5 flex flex-col gap-3">
              <h4 className="text-xs font-black tracking-widest text-slate-400 uppercase mb-1 flex items-center gap-2"><AlertTriangle size={14} className="text-amber-500" /> Telemetry Stream Monitor</h4>
              <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[520px] lg:h-[580px] shadow-2xl">
                <div className="bg-[#0b0f19] px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/40" /><span className="w-2.5 h-2.5 rounded-full bg-amber-500/40" /><span className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">{selectedEndpoint ? `${selectedEndpoint.method} // Debug Pipe` : 'System Idle'}</span>
                </div>
                <pre className="p-4 overflow-auto font-mono text-[11px] leading-relaxed text-emerald-400 bg-slate-950/90 flex-1 whitespace-pre-wrap"><code>{apiResponsePayload}</code></pre>
              </div>
            </div>
          </div>
        )}

        {/* --- USERS REGISTER TAB --- */}
        {activeTab === 'users' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 bg-[#0c101b] border border-slate-800 rounded-xl px-4 py-3 max-w-md">
              <Search size={16} className="text-slate-500" />
              <input 
                type="text" 
                placeholder="Search database by username or email reference..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-slate-200 placeholder-slate-500 w-full"
              />
            </div>

            <div className="bg-[#0c101b] border border-slate-800/80 rounded-xl overflow-hidden">
              <table className="w-full border-collapse text-left text-xs text-slate-300">
                <thead className="bg-[#111726] text-slate-400 font-mono text-[10px] uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-4">UID</th>
                    <th className="p-4">Profile Identity</th>
                    <th className="p-4">Operational Status</th>
                    <th className="p-4">Activity Volume</th>
                    <th className="p-4 text-right">Action Gateways</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredUsers.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-900/30 transition">
                      <td className="p-4 font-bold text-slate-500">#{item.id}</td>
                      <td className="p-4">
                        <div className="font-bold text-white font-sans text-sm">{item.username}</div>
                        <div className="text-slate-400 text-xs mt-0.5">{item.email}</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase tracking-tighter ${item.is_active ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                          {item.is_active ? 'Active Node' : 'Suspended'}
                        </span>
                      </td>
                      <td className="p-4 font-sans text-slate-200 font-medium">{item.total_bets} Placed Bets</td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => handleUpdatePassword(item.id, item.username)}
                          className="inline-flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white font-black px-3 py-2 border border-slate-800 rounded-lg transition"
                        >
                          <Key size={12} className="text-amber-400" /> Overwrite Pass
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- WALLETS AUDIT TAB --- */}
        {activeTab === 'wallets' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 bg-[#0c101b] border border-slate-800 rounded-xl px-4 py-3 max-w-md">
              <Search size={16} className="text-slate-500" />
              <input 
                type="text" 
                placeholder="Filter ledger systems by username mapping..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-slate-200 placeholder-slate-500 w-full"
              />
            </div>

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
                        <div className="flex items-center gap-1"><ArrowUpRight size={12} className="text-green-500" /> Deposited: <span className="font-mono text-xs text-slate-200">KSh {wallet.total_deposited}</span></div>
                        <div className="flex items-center gap-1"><ArrowDownLeft size={12} className="text-red-500" /> Outflows: <span className="font-mono text-xs text-slate-200">KSh {wallet.total_withdrawn}</span></div>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button onClick={() => handleModifyBalance(wallet.id, 'credit')} className="bg-green-500/10 hover:bg-green-500/20 text-green-400 font-black px-3 py-2 border border-green-500/20 rounded-lg transition">+ Credit</button>
                        <button onClick={() => handleModifyBalance(wallet.id, 'debit')} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 font-black px-3 py-2 border border-red-500/20 rounded-lg transition">- Debit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- 🚀 INTEGRATED SPORTS BOOK ENGINE TAB --- */}
        {activeTab === 'fixtures' && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0f1422] p-4 rounded-xl border border-slate-800">
              <div className="flex bg-slate-950 border border-slate-800 p-1 rounded-xl">
                <button 
                  onClick={() => setFixtureSubTab('matches')}
                  className={`px-4 py-2 text-xs font-mono font-bold uppercase rounded-lg transition-all flex items-center gap-2 ${fixtureSubTab === 'matches' ? 'bg-red-600 text-white' : 'text-slate-400'}`}
                >
                  <Calendar size={14} /> Matches Custom Matrix ({matches.length})
                </button>
                <button 
                  onClick={() => setFixtureSubTab('leagues')}
                  className={`px-4 py-2 text-xs font-mono font-bold uppercase rounded-lg transition-all flex items-center gap-2 ${fixtureSubTab === 'leagues' ? 'bg-red-600 text-white' : 'text-slate-400'}`}
                >
                  <Trophy size={14} /> Leagues Division ({leagues.length})
                </button>
              </div>

              <button 
                onClick={() => {
                  setEditingItem(null);
                  if (fixtureSubTab === 'matches') {
                    setMatchForm({ league: '', home_team: '', away_team: '', match_date: '', status: 'scheduled', home_score: 0, away_score: 0, home_odds: '2.00', draw_odds: '3.00', away_odds: '2.00' });
                    setShowMatchModal(true);
                  } else {
                    setLeagueForm({ name: '', sport: '', country: '', is_active: true });
                    setShowLeagueModal(true);
                  }
                }}
                className="bg-green-600 hover:bg-green-500 text-white font-mono font-bold text-xs uppercase px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition self-stretch sm:self-auto justify-center"
              >
                <Plus size={16} /> Create {fixtureSubTab === 'matches' ? 'Custom Match' : 'Register League'}
              </button>
            </div>

            <div className="bg-[#0c101b] border border-slate-800/80 rounded-xl overflow-hidden shadow-2xl">
              {fixtureSubTab === 'matches' ? (
                <table className="w-full text-left text-xs text-slate-300 border-collapse">
                  <thead className="bg-[#111726] text-slate-400 font-mono text-[10px] uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-4">Fixture Teams</th>
                      <th className="p-4">League</th>
                      <th className="p-4">Status & Score</th>
                      <th className="p-4">1X2 Pricing Odds</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 font-mono">
                    {matches.map((match) => (
                      <tr key={match.id} className="hover:bg-slate-900/30 transition">
                        <td className="p-4 font-bold text-white font-sans text-sm">
                          {match.home_team_name} <span className="text-slate-500 text-xs font-normal">vs</span> {match.away_team_name}
                        </td>
                        <td className="p-4 text-slate-400">{match.league_name || 'Custom Spec'}</td>
                        <td className="p-4">
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-950 border border-slate-800 rounded uppercase text-amber-400 mr-2">{match.status}</span>
                          <span className="font-bold text-white text-sm">{match.home_score} - {match.away_score}</span>
                        </td>
                        <td className="p-4 text-green-400 font-bold">{Number(match.home_odds).toFixed(2)} | {Number(match.draw_odds).toFixed(2)} | {Number(match.away_odds).toFixed(2)}</td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => {
                                setEditingItem(match);
                                setMatchForm({
                                  league: match.league?.toString() || '',
                                  home_team: match.home_team?.toString() || '',
                                  away_team: match.away_team?.toString() || '',
                                  match_date: match.match_date ? match.match_date.substring(0, 16) : '',
                                  status: match.status,
                                  home_score: match.home_score,
                                  away_score: match.away_score,
                                  home_odds: match.home_odds,
                                  draw_odds: match.draw_odds,
                                  away_odds: match.away_odds
                                });
                                setShowMatchModal(true);
                              }}
                              className="p-1.5 bg-slate-900 hover:bg-blue-600/20 text-blue-400 rounded-lg border border-slate-800 transition"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button onClick={() => deleteMatch(match.id)} className="p-1.5 bg-slate-900 hover:bg-red-600/20 text-red-400 rounded-lg border border-slate-800 transition">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-left text-xs text-slate-300 border-collapse">
                  <thead className="bg-[#111726] text-slate-400 font-mono text-[10px] uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-4">League Classification Title</th>
                      <th className="p-4">Region/Country</th>
                      <th className="p-4">Registry State</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 font-mono">
                    {leagues.map((league) => (
                      <tr key={league.id} className="hover:bg-slate-900/30 transition">
                        <td className="p-4 font-bold text-white font-sans text-sm">{league.name}</td>
                        <td className="p-4 text-slate-400 uppercase tracking-wider">{league.country}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase ${league.is_active ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-slate-900 text-slate-500'}`}>
                            {league.is_active ? 'Active Market' : 'Suspended'}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button 
                            onClick={() => {
                              setEditingItem(league);
                              setLeagueForm({ name: league.name, sport: league.sport?.toString() || '', country: league.country, is_active: league.is_active });
                              setShowLeagueModal(true);
                            }}
                            className="p-1.5 bg-slate-900 hover:bg-blue-600/20 text-blue-400 rounded-lg border border-slate-800 transition"
                          >
                            <Edit2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
        {activeTab === 'deposits' && <AdminDeposits />}
        {activeTab === 'withdrawals' && <AdminWithdrawals />}

      </div>

      {/* --- FLOATING MODALS OVERLAYS LAYER --- */}
      {showMatchModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f1422] border border-slate-800 w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-white text-xs uppercase font-mono tracking-wider">{editingItem ? 'Edit Fixture Variables' : 'Construct New Special Match'}</h3>
              <button onClick={() => setShowMatchModal(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleMatchSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
  <div>
    <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase mb-1">
      Home Team
    </label>

    <select
      required
      value={matchForm.home_team}
      onChange={e =>
        setMatchForm({
          ...matchForm,
          home_team: e.target.value
        })
      }
      className="w-full bg-slate-950 border border-slate-800 p-2.5 text-xs rounded-lg text-white"
    >
      <option value="">
        {teams.length === 0
          ? 'No teams available'
          : `Select Team (${teams.length})`}
      </option>

      {teams.map((team) => (
        <option key={team.id} value={team.id}>
          {team.name}
          {team.league_name
            ? ` (${team.league_name})`
            : ''}
        </option>
      ))}
    </select>

    {teams.length === 0 && (
      <p className="text-red-400 text-[10px] mt-1">
        No teams found. Create teams first from Django Admin.
      </p>
    )}
  </div>

  <div>
    <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase mb-1">
      Away Team
    </label>

    <select
      required
      value={matchForm.away_team}
      onChange={e =>
        setMatchForm({
          ...matchForm,
          away_team: e.target.value
        })
      }
      className="w-full bg-slate-950 border border-slate-800 p-2.5 text-xs rounded-lg text-white"
    >
      <option value="">
        {teams.length === 0
          ? 'No teams available'
          : `Select Team (${teams.length})`}
      </option>

      {teams.map((team) => (
        <option key={team.id} value={team.id}>
          {team.name}
          {team.league_name
            ? ` (${team.league_name})`
            : ''}
        </option>
      ))}
    </select>
  </div>
</div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase mb-1">League Integration</label>
                  <select required value={matchForm.league} onChange={e => setMatchForm({...matchForm, league: e.target.value})} className="w-full bg-slate-950 border border-slate-800 p-2.5 text-xs rounded-lg text-white">
                    <option value="">Select League</option>
                    {leagues.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase mb-1">Kickoff Time</label>
                  <input required type="datetime-local" value={matchForm.match_date} onChange={e => setMatchForm({...matchForm, match_date: e.target.value})} className="w-full bg-slate-950 border border-slate-800 p-2.5 text-xs rounded-lg text-white" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase mb-1">Home Odds</label>
                  <input type="number" step="0.01" value={matchForm.home_odds} onChange={e => setMatchForm({...matchForm, home_odds: e.target.value})} className="w-full bg-slate-900 border border-slate-700 p-2 text-xs rounded text-white font-mono" />
                </div>
                <div>
                  <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase mb-1">Draw Odds</label>
                  <input type="number" step="0.01" value={matchForm.draw_odds} onChange={e => setMatchForm({...matchForm, draw_odds: e.target.value})} className="w-full bg-slate-900 border border-slate-700 p-2 text-xs rounded text-white font-mono" />
                </div>
                <div>
                  <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase mb-1">Away Odds</label>
                  <input type="number" step="0.01" value={matchForm.away_odds} onChange={e => setMatchForm({...matchForm, away_odds: e.target.value})} className="w-full bg-slate-900 border border-slate-700 p-2 text-xs rounded text-white font-mono" />
                </div>
              </div>

              {editingItem && (
                <div className="grid grid-cols-3 gap-2 bg-red-500/5 p-3 rounded-xl border border-red-900/30">
                  <div>
                    <label className="block text-[9px] font-mono font-bold text-red-400 uppercase mb-1">Match State</label>
                    <select value={matchForm.status} onChange={e => setMatchForm({...matchForm, status: e.target.value})} className="w-full bg-slate-950 border border-slate-800 p-1.5 text-xs rounded text-white">
                      <option value="scheduled">Scheduled</option>
                      <option value="live">Live</option>
                      <option value="halftime">Half Time</option>
                      <option value="finished">Finished</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase mb-1">Home Score</label>
                    <input type="number" value={matchForm.home_score} onChange={e => setMatchForm({...matchForm, home_score: parseInt(e.target.value) || 0})} className="w-full bg-slate-950 border border-slate-800 p-1.5 text-xs rounded text-white font-mono" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase mb-1">Away Score</label>
                    <input type="number" value={matchForm.away_score} onChange={e => setMatchForm({...matchForm, away_score: parseInt(e.target.value) || 0})} className="w-full bg-slate-950 border border-slate-800 p-1.5 text-xs rounded text-white font-mono" />
                  </div>
                </div>
              )}

              <button type="submit" className="w-full bg-red-600 hover:bg-red-500 p-3 rounded-xl font-mono font-bold uppercase text-xs tracking-wider text-white transition">
                {editingItem ? 'Execute Mutation Update' : 'Publish Open Market Fixture'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showLeagueModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f1422] border border-slate-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-white text-xs uppercase font-mono tracking-wider">{editingItem ? 'Edit League Registry' : 'Register New Division'}</h3>
              <button onClick={() => setShowLeagueModal(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleLeagueSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase mb-1">League Name</label>
                <input required type="text" placeholder="e.g. Kenya Premier League" value={leagueForm.name} onChange={e => setLeagueForm({...leagueForm, name: e.target.value})} className="w-full bg-slate-950 border border-slate-800 p-2.5 text-xs rounded-lg text-white" />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase mb-1">Sport Context</label>
                <select required value={leagueForm.sport} onChange={e => setLeagueForm({...leagueForm, sport: e.target.value})} className="w-full bg-slate-950 border border-slate-800 p-2.5 text-xs rounded-lg text-white">
                  <option value="">Select Sport Branch</option>
                  {sports.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase mb-1">Country/Region</label>
                <input required type="text" placeholder="e.g. Kenya" value={leagueForm.country} onChange={e => setLeagueForm({...leagueForm, country: e.target.value})} className="w-full bg-slate-950 border border-slate-800 p-2.5 text-xs rounded-lg text-white" />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="is_active" checked={leagueForm.is_active} onChange={e => setLeagueForm({...leagueForm, is_active: e.target.checked})} className="rounded bg-slate-950 border-slate-800 text-red-600 focus:ring-0 focus:ring-offset-0" />
                <label htmlFor="is_active" className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-tight">Enable Live In Betting Boards</label>
              </div>

              <button type="submit" className="w-full bg-red-600 hover:bg-red-500 p-3 rounded-xl font-mono font-bold uppercase text-xs tracking-wider text-white transition">
                {editingItem ? 'Modify Registry Parameters' : 'Append Division Instantiation'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}