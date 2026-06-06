'use client';

import { useState, useEffect, useRef } from 'react';
import { useCrashWebSocket } from '@/lib/api/hooks/useCrashWebSockets';
import { useAuthStore } from '@/store/authStore';
import { motion } from 'framer-motion';
import { ShieldCheck, Users, Radio, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api/client'; 

interface PlayerBetMock {
  username: string;
  stake: number;
  multiplier?: number;
  won?: boolean;
}

export default function AviatorCasinoPage() {
  const { gameState, placeBet, cashout, queueBetForNextRound, activeQueuedPanels, isConnected } = useCrashWebSocket();
  const { user } = useAuthStore(); 

  // Dynamic Profile Presentation Configurations
  const currencySymbol = user?.currency_symbol || '$';
  const currencyCode = user?.currency_code || 'USD';
  const localeFormat = user?.currency_code === 'KES' ? 'en-KE' : 'en-US';

  // Base Minimum Increments Adjusted For Global Token Profiles
  const minIncrementValue = user?.currency_code === 'KES' ? 10.00 : 1.00;
  const initialStakeString = user?.currency_code === 'KES' ? '10.00' : '1.00';

  // Console Panel States
  const [stakeOne, setStakeOne] = useState<string>(initialStakeString);
  const [hasBetOne, setHasBetOne] = useState<boolean>(false);
  const [cashedOutOne, setCashedOutOne] = useState<boolean>(false);

  const [stakeTwo, setStakeTwo] = useState<string>(initialStakeString);
  const [hasBetTwo, setHasBetTwo] = useState<boolean>(false);
  const [cashedOutTwo, setCashedOutTwo] = useState<boolean>(false);

  const [history, setHistory] = useState<number[]>([1.22, 5.40, 1.02, 2.15, 11.80, 1.56]);
  const isInitialFetchDone = useRef(false);

  // Fallback preset options scaled dynamically based on currency contextual profiles
  const presetOptions = user?.currency_code === 'KES' 
    ? [100, 200, 500, 1000] 
    : [5, 10, 20, 50];

  // Sync initial console layout defaults when user metrics shift inside global stores
  useEffect(() => {
    setStakeOne(initialStakeString);
    setStakeTwo(initialStakeString);
  }, [initialStakeString]);

  // ================= ONE-TIME WALLET INITIALIZATION =================
  useEffect(() => {
    const fetchInitialBalance = async () => {
      if (isInitialFetchDone.current || !user) return;
      isInitialFetchDone.current = true;
      try {
        const response = await apiClient.get('/wallet/balance/'); 
        if (response && response.balance !== undefined) {
          useAuthStore.setState((state) => ({
            user: state.user ? { ...state.user, balance: response.balance } : null
          }));
        }
      } catch (error) {
        console.error('Initial balance fetch failed:', error);
      }
    };

    fetchInitialBalance();
  }, [user]);
  // ==================================================================

  // State recycling listener
  useEffect(() => {
    if (gameState.status === 'lobby') {
      setHasBetOne(false);
      setCashedOutOne(false);
      setHasBetTwo(false);
      setCashedOutTwo(false);
    } else if (gameState.status === 'crashed' && gameState.crashPoint) {
      setHistory((prev) => [gameState.crashPoint!, ...prev].slice(0, 12));
    }
  }, [gameState.status, gameState.crashPoint]);

  const handleModifyStakeValue = (panel: 1 | 2, direction: 'up' | 'down') => {
    const currentStr = panel === 1 ? stakeOne : stakeTwo;
    let val = parseFloat(currentStr);
    if (isNaN(val)) val = minIncrementValue;

    if (direction === 'up') {
      val += minIncrementValue;
    } else {
      val = Math.max(minIncrementValue, val - minIncrementValue);
    }

    if (panel === 1) setStakeOne(val.toFixed(2));
    if (panel === 2) setStakeTwo(val.toFixed(2));
  };

  const handleApplyPresetAmount = (panel: 1 | 2, amount: number) => {
    if (panel === 1) setStakeOne(amount.toFixed(2));
    if (panel === 2) setStakeTwo(amount.toFixed(2));
  };

  const handleExecuteBet = (panel: 1 | 2) => {
    const targetStake = panel === 1 ? stakeOne : stakeTwo;
    const amount = parseFloat(targetStake);

    if (isNaN(amount) || amount <= 0) return toast.error('Enter a valid amount');
    
    const currentBalance = user?.balance ? Number(user.balance) : 0;
    if (!user || currentBalance < amount) return toast.error('Insufficient wallet balance');

    if (gameState.status === 'running') {
      queueBetForNextRound(panel, amount);
      toast.success(`Bet scheduled for next round!`, { icon: '⏳' });
      return;
    }

    placeBet(amount);
    if (panel === 1) setHasBetOne(true);
    if (panel === 2) setHasBetTwo(true);

    const updatedBalance = currentBalance - amount;
    useAuthStore.setState((state) => ({
      user: state.user ? { ...state.user, balance: updatedBalance } : null
    }));

    toast.success(`Bet of ${currencySymbol}${amount.toFixed(2)} placed!`);
  };

  const handleExecuteCashout = (panel: 1 | 2) => {
    if (!gameState.multiplier) return;
    cashout(gameState.multiplier);

    const stakeVal = panel === 1 ? parseFloat(stakeOne) : parseFloat(stakeTwo);
    const profit = stakeVal * gameState.multiplier;

    if (panel === 1) setCashedOutOne(true);
    if (panel === 2) setCashedOutTwo(true);

    if (user) {
      const currentBalance = user?.balance ? Number(user.balance) : 0;
      const updatedBalance = currentBalance + profit;
      
      useAuthStore.setState((state) => ({
        user: state.user ? { ...state.user, balance: updatedBalance } : null
      }));
    }

    toast.success(`Cashed Out! + ${currencySymbol}${profit.toFixed(2)}`, { icon: '✈️' });
  };

  const getFlightCoordinates = () => {
    if (!gameState.multiplier || gameState.status !== 'running') return { x: 0, y: 0 };
    const progression = Math.min((gameState.multiplier - 1) / 3, 1);
    return { x: progression * 82, y: progression * 68 };
  };

  const coords = getFlightCoordinates();

  const isQueuedOne = activeQueuedPanels?.includes(1) || false;
  const isQueuedTwo = activeQueuedPanels?.includes(2) || false;

  return (
    <div className="min-h-screen bg-[#090c15] pt-20 px-4 pb-4 font-sans text-slate-200 select-none">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 xl:grid-cols-5 gap-4">
        
        {/* ================= LEFT LEADERBOARD PANEL ================= */}
        <div className="xl:col-span-1 bg-[#101524] border border-slate-800/80 rounded-xl p-3 flex flex-col h-[200px] xl:h-[680px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <span className="text-xs font-black text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
              <Users size={14} className="text-red-500" /> Active Pool
            </span>
            <span className="bg-slate-900 px-2 py-0.5 rounded-md text-[10px] text-green-400 font-mono font-bold">
              Balance: {
                user?.balance !== undefined && !isNaN(Number(user.balance))
                  ? `${currencySymbol}${Number(user.balance).toLocaleString(localeFormat, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : `${currencySymbol}0.00`
              }
            </span>
          </div>
        </div>

        {/* ================= RIGHT MAIN GAME BAY ================= */}
        <div className="xl:col-span-4 flex flex-col gap-3">
          
          {/* Top Multiplier Ribbon */}
          <div className="bg-[#101524] px-4 py-2 rounded-xl border border-slate-800/80 flex items-center gap-2 overflow-x-auto">
            <TrendingUp size={13} className="text-slate-500 shrink-0" />
            {history.map((mult, i) => (
              <span key={i} className="px-2.5 py-0.5 rounded-full font-mono font-black text-[11px] bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {mult.toFixed(2)}x
              </span>
            ))}
          </div>

          {/* Main Flight Display Board */}
          <div className="relative h-[320px] md:h-[400px] bg-[#0c101d] border border-slate-800/80 rounded-2xl overflow-hidden flex items-center justify-center">
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/50 px-2.5 py-1 rounded-md border border-slate-800/60 backdrop-blur-sm z-30">
              <Radio size={11} className={isConnected ? "text-red-500 animate-pulse" : "text-slate-600"} />
              <span className="text-[9px] font-black tracking-widest uppercase text-slate-400">Aviator Core</span>
            </div>

            <div className="absolute inset-0 bg-[linear-gradient(to_right,#161c2e_1px,transparent_1px),linear-gradient(to_bottom,#161c2e_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] opacity-40" />

            {gameState.status === 'lobby' && (
              <div className="text-center z-10">
                <p className="text-xs uppercase font-black tracking-widest text-red-500 mb-1">Waiting For Next Round</p>
                <h2 className="text-4xl md:text-5xl font-black text-white font-mono">
                  TAKING OFF IN <span className="text-amber-400">{gameState.countdown}</span>s
                </h2>
              </div>
            )}

            {gameState.status === 'running' && (
              <>
                <div className="absolute z-10 text-center pointer-events-none">
                  <h1 className="text-6xl md:text-8xl font-black font-mono tracking-tight text-white">
                    {gameState.multiplier?.toFixed(2)}x
                  </h1>
                </div>

                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <path d={`M 0,380 Q ${10 + coords.x * 0.4},${380 - coords.y * 0.2} ${10 + coords.x},${390 - coords.y}`} fill="none" stroke="#dc2626" strokeWidth="3" />
                  <path d={`M 0,400 Q ${10 + coords.x * 0.4},${380 - coords.y * 0.2} ${10 + coords.x},${390 - coords.y} L ${10 + coords.x},400 Z`} fill="url(#aviatorGradient)" className="opacity-20" />
                  <defs>
                    <linearGradient id="aviatorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#dc2626" stopOpacity="1" /><stop offset="100%" stopColor="#dc2626" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>

                <div style={{ bottom: `${10 + coords.y}%`, left: `${5 + coords.x}%` }} className="absolute z-20 transition-all duration-100 ease-linear transform -translate-x-1/2">
                  <svg width="60" height="28" viewBox="0 0 60 28" fill="none"><path d="M52 14L10 2L14 14L10 26L52 14Z" fill="#dc2626" /></svg>
                </div>
              </>
            )}

            {gameState.status === 'crashed' && (
              <div className="text-center z-10">
                <h1 className="text-4xl md:text-6xl font-black text-red-500 uppercase tracking-wide">Flew Away</h1>
                <p className="text-slate-400 font-mono text-xl font-bold mt-1">@{gameState.crashPoint?.toFixed(2)}x</p>
              </div>
            )}
          </div>

          {/* ================= CONTROLLER PANEL MATRIX ================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            
            {/* PANEL CONSOLE 1 */}
            <div className="bg-[#101524] border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between gap-3">
              <div className="flex justify-between items-center text-[11px] text-slate-400 font-bold uppercase">
                <span>Bet Controller A</span>
                {isQueuedOne && <span className="text-amber-500 font-bold animate-pulse">Queued Next Flight</span>}
              </div>
              
              <div className="flex gap-2 items-center bg-slate-950/80 p-2 rounded-lg border border-slate-800/60">
                <button 
                  type="button"
                  disabled={gameState.status === 'running' || hasBetOne || isQueuedOne}
                  onClick={() => handleModifyStakeValue(1, 'down')}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 font-black text-white flex items-center justify-center transition disabled:opacity-40"
                >
                  −
                </button>
                
                <input 
                  type="number"
                  disabled={gameState.status === 'running' || hasBetOne || isQueuedOne}
                  value={stakeOne}
                  onChange={(e) => setStakeOne(e.target.value)}
                  className="bg-transparent text-center font-mono text-base font-black text-white w-full focus:outline-none"
                />

                <button 
                  type="button"
                  disabled={gameState.status === 'running' || hasBetOne || isQueuedOne}
                  onClick={() => handleModifyStakeValue(1, 'up')}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 font-black text-white flex items-center justify-center transition disabled:opacity-40"
                >
                  +
                </button>
              </div>

              <div className="grid grid-cols-4 gap-1.5 text-[11px] font-black text-slate-400">
                {presetOptions.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    disabled={gameState.status === 'running' || hasBetOne || isQueuedOne}
                    onClick={() => handleApplyPresetAmount(1, amt)}
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-800 py-1 px-0.5 rounded transition font-mono disabled:opacity-30"
                  >
                    {currencySymbol}{amt.toLocaleString()}
                  </button>
                ))}
              </div>

              {gameState.status === 'running' && hasBetOne && !cashedOutOne ? (
                <button
                  onClick={() => handleExecuteCashout(1)}
                  className="w-full bg-[#d97706] hover:bg-[#b45309] text-white text-base font-black uppercase py-3.5 rounded-xl shadow-md"
                >
                  <span className="block text-[10px] tracking-widest text-amber-200">Cash Out</span>
                  {currencySymbol}{(parseFloat(stakeOne) * (gameState.multiplier || 1.0)).toFixed(2)} {currencyCode}
                </button>
              ) : (
                <button
                  disabled={isQueuedOne || (gameState.status === 'lobby' && hasBetOne)}
                  onClick={() => handleExecuteBet(1)}
                  className={`w-full text-base font-black uppercase py-4 rounded-xl tracking-wider transition ${
                    isQueuedOne
                      ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30 cursor-not-allowed'
                      : hasBetOne 
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                        : 'bg-[#22c55e] hover:bg-[#16a34a] text-white shadow-lg'
                  }`}
                >
                  {isQueuedOne ? 'Waiting for Flight...' : hasBetOne ? 'Bet Placed' : `Bet ${currencySymbol}${parseFloat(stakeOne).toFixed(2)} ${currencyCode}`}
                </button>
              )}
            </div>

            {/* PANEL CONSOLE 2 */}
            <div className="bg-[#101524] border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between gap-3">
              <div className="flex justify-between items-center text-[11px] text-slate-400 font-bold uppercase">
                <span>Bet Controller B</span>
                {isQueuedTwo && <span className="text-amber-500 font-bold animate-pulse">Queued Next Flight</span>}
              </div>
              
              <div className="flex gap-2 items-center bg-slate-950/80 p-2 rounded-lg border border-slate-800/60">
                <button 
                  type="button"
                  disabled={gameState.status === 'running' || hasBetTwo || isQueuedTwo}
                  onClick={() => handleModifyStakeValue(2, 'down')}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 font-black text-white flex items-center justify-center transition disabled:opacity-40"
                >
                  −
                </button>

                <input 
                  type="number"
                  disabled={gameState.status === 'running' || hasBetTwo || isQueuedTwo}
                  value={stakeTwo}
                  onChange={(e) => setStakeTwo(e.target.value)}
                  className="bg-transparent text-center font-mono text-base font-black text-white w-full focus:outline-none"
                />

                <button 
                  type="button"
                  disabled={gameState.status === 'running' || hasBetTwo || isQueuedTwo}
                  onClick={() => handleModifyStakeValue(2, 'up')}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 font-black text-white flex items-center justify-center transition disabled:opacity-40"
                >
                  +
                </button>
              </div>

              <div className="grid grid-cols-4 gap-1.5 text-[11px] font-black text-slate-400">
                {presetOptions.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    disabled={gameState.status === 'running' || hasBetTwo || isQueuedTwo}
                    onClick={() => handleApplyPresetAmount(2, amt)}
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-800 py-1 px-0.5 rounded transition font-mono disabled:opacity-30"
                  >
                    {currencySymbol}{amt.toLocaleString()}
                  </button>
                ))}
              </div>

              {gameState.status === 'running' && hasBetTwo && !cashedOutTwo ? (
                <button
                  onClick={() => handleExecuteCashout(2)}
                  className="w-full bg-[#d97706] hover:bg-[#b45309] text-white text-base font-black uppercase py-3.5 rounded-xl shadow-md"
                >
                  <span className="block text-[10px] tracking-widest text-amber-200">Cash Out</span>
                  {currencySymbol}{(parseFloat(stakeTwo) * (gameState.multiplier || 1.0)).toFixed(2)} {currencyCode}
                </button>
              ) : (
                <button
                  disabled={isQueuedTwo || (gameState.status === 'lobby' && hasBetTwo)}
                  onClick={() => handleExecuteBet(2)}
                  className={`w-full text-base font-black uppercase py-4 rounded-xl tracking-wider transition ${
                    isQueuedTwo
                      ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30 cursor-not-allowed'
                      : hasBetTwo 
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                        : 'bg-[#22c55e] hover:bg-[#16a34a] text-white shadow-lg'
                  }`}
                >
                  {isQueuedTwo ? 'Waiting for Flight...' : hasBetTwo ? 'Bet Placed' : `Bet ${currencySymbol}${parseFloat(stakeTwo).toFixed(2)} {currencyCode}`}
                </button>
              )}
            </div>

          </div>

          <div className="bg-[#101524]/40 border border-slate-800/50 p-3 rounded-xl flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck size={14} className="text-green-500 shrink-0" />
            <p>Provably Fair tracking is active. All server encryption check balances verify securely prior to flight initialization cycles.</p>
          </div>

        </div>

      </div>
    </div>
  );
}