'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Trash2 } from 'lucide-react';
import { useBettingStore } from '@/store/bettingStore';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function BettingSlip({ isMobile = false }: { isMobile?: boolean }) {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    selections,
    currentBetSlip,
    updateStake,
    placeBet,
    removeFromBetSlip,
    clearBetSlip,
    isLoading,
  } = useBettingStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const [stakeInput, setStakeInput] = useState("");

  useEffect(() => {
    setStakeInput(currentBetSlip?.stake > 0 ? currentBetSlip.stake.toString() : "");
  }, [currentBetSlip?.stake]);

  const handleStakeChange = (value: string) => {
    setStakeInput(value);
    const stake = parseFloat(value);
    if (!isNaN(stake)) updateStake(stake);
  };

  const handlePlaceBet = () => {
    if (!user) {
      router.push('/login');
      toast.error('Please login to place bets');
      return;
    }
    placeBet();
  };

  const contentProps = {
    selections,
    totalOdds: currentBetSlip.totalOdds,
    stake: currentBetSlip.stake,
    stakeInput,
    onStakeChange: handleStakeChange,
    potentialWin: currentBetSlip.potentialWin,
    onPlaceBet: handlePlaceBet,
    onRemove: removeFromBetSlip,
    isLoading,
  };

  if (isMobile) {
    return (
      <>
        {selections.length > 0 && !isOpen && (
          <motion.button
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 bg-blue-600 text-white rounded-full p-4 z-50 shadow-xl"
          >
            <div className="relative">
              <ShoppingCart className="w-6 h-6" />
              <span className="absolute -top-2 -right-2 bg-red-500 text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {selections.length}
              </span>
            </div>
          </motion.button>
        )}
        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 z-50" onClick={() => setIsOpen(false)} />
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                className="fixed bottom-0 left-0 right-0 bg-slate-900 rounded-t-2xl z-50 p-4 max-h-[85vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-bold text-lg">Bet Slip</h2>
                  <button onClick={() => setIsOpen(false)}><X /></button>
                </div>
                <BettingSlipContent {...contentProps} />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 flex flex-col h-full">
      <div className="p-4 border-b border-slate-800 flex justify-between items-center">
        <h2 className="font-bold">Betting Slip</h2>
        {selections.length > 0 && (
          <button onClick={clearBetSlip} className="text-red-400 hover:bg-red-400/10 p-1 rounded">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="p-4 overflow-y-auto flex-1">
        <BettingSlipContent {...contentProps} />
      </div>
    </div>
  );
}

function BettingSlipContent({
  selections, totalOdds, stake, stakeInput, onStakeChange, potentialWin, onPlaceBet, onRemove, isLoading
}: any) {
  const { user } = useAuthStore();
  const currencySymbol = user?.currency_symbol || '$';
  const exchangeRate = user?.exchange_rate || 1;
  const minStakeUserCurrency = 1000 / exchangeRate;

  if (selections.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-20" />
        <p>Your slip is empty</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {selections.map((s: any) => (
          <div key={s.id} className="bg-slate-800/50 border border-slate-700 p-3 rounded-lg relative group">
            <button onClick={() => onRemove(s.id)} className="absolute top-2 right-2 text-gray-500 hover:text-red-400">
              <X className="w-3 h-3" />
            </button>
            <p className="text-xs text-gray-400 font-medium truncate pr-4">{s.matchName}</p>
            <div className="flex justify-between items-center mt-1">
              <span className="text-sm font-bold text-white capitalize">{s.selection}</span>
              <span className="text-sm font-bold text-green-500">{s.odds.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-slate-800 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Total Odds</span>
          <span className="font-bold text-white">{totalOdds.toFixed(2)}</span>
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-2 font-bold">
            Stake Amount ({currencySymbol})
          </label>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {[10, 50, 100, 500].map((amt) => (
              <button key={amt} onClick={() => onStakeChange(amt.toString())}
                className="py-1.5 text-xs bg-slate-800 border border-slate-700 rounded hover:bg-slate-700 text-white transition">
                +{amt}
              </button>
            ))}
          </div>
          <input type="number" value={stakeInput} onChange={(e) => onStakeChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-blue-500 outline-none"
            placeholder={`Min. ${minStakeUserCurrency.toFixed(2)}`} />
        </div>

        <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl p-4">
          <div className="flex justify-between items-center mb-1 text-xs text-blue-400">
            <span>Potential Win</span>
            <span>Min: 1,000 KES</span>
          </div>
          <div className="flex justify-between items-end">
            <span className="text-2xl font-black text-green-500 leading-none">
              {currencySymbol}{potentialWin.toFixed(2)}
            </span>
          </div>
        </div>

        <button
          onClick={onPlaceBet}
          disabled={isLoading || (stake * exchangeRate) < 1000}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:hover:bg-blue-600 text-white py-4 rounded-xl font-black transition-all shadow-lg shadow-blue-900/20"
        >
          {isLoading ? 'PLACING BET...' : 'PLACE BET'}
        </button>
      </div>
    </div>
  );
}