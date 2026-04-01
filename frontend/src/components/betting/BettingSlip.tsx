'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Trash2, TrendingUp, AlertCircle, Clock } from 'lucide-react';
import { useBettingStore } from '@/store/bettingStore';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface BettingSlipProps {
  isMobile?: boolean;
}

export default function BettingSlip({ isMobile = false }: BettingSlipProps) {
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
  const [stakeInput, setStakeInput] = useState(currentBetSlip.stake.toString());

  useEffect(() => {
    setStakeInput(currentBetSlip.stake.toString());
  }, [currentBetSlip.stake]);

  const handleStakeChange = (value: string) => {
    setStakeInput(value);
    const stake = parseFloat(value);
    if (!isNaN(stake) && stake >= 0) {
      updateStake(stake);
    }
  };

  const handlePlaceBet = () => {
    if (!user) {
      router.push('/login');
      toast.error('Please login to place bets');
      return;
    }
    placeBet();
  };

  // Mobile Version - Bottom Drawer
  if (isMobile) {
    return (
      <>
        {/* Floating Action Button */}
        {selections.length > 0 && !isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full p-4 shadow-lg z-50"
          >
            <div className="relative">
              <ShoppingCart className="w-6 h-6" />
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {selections.length}
              </span>
            </div>
          </motion.button>
        )}

        {/* Bottom Drawer */}
        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-50"
                onClick={() => setIsOpen(false)}
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25 }}
                className="fixed bottom-0 left-0 right-0 bg-slate-900 rounded-t-2xl shadow-2xl z-50 max-h-[80vh] overflow-y-auto"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Betting Slip</h2>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-2 hover:bg-slate-800 rounded-lg transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <BettingSlipContent
                    selections={selections}
                    totalOdds={currentBetSlip.totalOdds}
                    stake={currentBetSlip.stake}
                    stakeInput={stakeInput}
                    onStakeChange={handleStakeChange}
                    potentialWin={currentBetSlip.potentialWin}
                    onPlaceBet={handlePlaceBet}
                    onRemove={removeFromBetSlip}
                    onClear={clearBetSlip}
                    isLoading={isLoading}
                  />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Desktop Version - Fixed Right Sidebar
  return (
    <div className="bg-slate-900 rounded-xl shadow-xl h-full overflow-y-auto">
      <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 p-4 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Betting Slip</h2>
            <p className="text-xs text-gray-400 mt-1">Add selections to place bets</p>
          </div>
          {selections.length > 0 && (
            <button
              onClick={clearBetSlip}
              className="p-2 hover:bg-slate-800 rounded-lg transition text-red-400"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      
      <div className="p-4">
        <BettingSlipContent
          selections={selections}
          totalOdds={currentBetSlip.totalOdds}
          stake={currentBetSlip.stake}
          stakeInput={stakeInput}
          onStakeChange={handleStakeChange}
          potentialWin={currentBetSlip.potentialWin}
          onPlaceBet={handlePlaceBet}
          onRemove={removeFromBetSlip}
          onClear={clearBetSlip}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

// Shared Content Component
function BettingSlipContent({
  selections,
  totalOdds,
  stake,
  stakeInput,
  onStakeChange,
  potentialWin,
  onPlaceBet,
  onRemove,
  onClear,
  isLoading,
}: any) {
  if (selections.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-slate-800 rounded-full flex items-center justify-center">
          <ShoppingCart className="w-8 h-8 text-gray-500" />
        </div>
        <p className="text-gray-400">No selections added</p>
        <p className="text-xs text-gray-500 mt-2">Click on odds to add to slip</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selections List */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {selections.map((selection: any) => (
          <motion.div
            key={selection.id}
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-slate-800/50 rounded-lg p-3 group hover:bg-slate-800 transition"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="font-medium text-sm line-clamp-2">{selection.matchName}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-gray-400 capitalize">{selection.selection}</span>
                  <span className="text-xs font-bold text-green-500">{selection.odds}</span>
                </div>
              </div>
              <button
                onClick={() => onRemove(selection.id)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition"
              >
                <X className="w-4 h-4 text-red-400" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bet Details */}
      <div className="border-t border-slate-800 pt-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Total Selections</span>
          <span className="font-medium">{selections.length}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Total Odds</span>
          <span className="font-bold text-green-500">{totalOdds.toFixed(2)}</span>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Stake Amount (KSH)
          </label>
          <input
            type="number"
            value={stakeInput}
            onChange={(e) => onStakeChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            placeholder="Enter stake"
            min="10"
            step="10"
          />
        </div>
        
        <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-lg p-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Potential Win</span>
            <div className="text-right">
              <div className="text-xl font-bold text-green-500">
                {potentialWin.toFixed(2)} KSH
              </div>
              <div className="text-xs text-gray-500">
                {stake > 0 ? `+${((potentialWin - stake) / stake * 100).toFixed(1)}%` : '0%'} profit
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onPlaceBet}
          disabled={isLoading || stake <= 0}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
        >
          <span className="relative z-10">
            {isLoading ? 'Placing Bet...' : `Place Bet • ${potentialWin.toFixed(2)} KSH`}
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>

        <p className="text-xs text-center text-gray-500">
          By placing a bet, you agree to our Terms & Conditions
        </p>
      </div>
    </div>
  );
}