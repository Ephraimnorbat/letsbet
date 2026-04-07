'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userCurrency: string;
  exchangeRate: number;
  currencySymbol: string;
}

const DEPOSIT_OPTIONS_KES = [1000, 2000, 3000, 5000, 10000];

export default function DepositModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  userCurrency, 
  exchangeRate,
  currencySymbol 
}: DepositModalProps) {
  const [amount, setAmount] = useState<number>(1000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [convertedAmounts, setConvertedAmounts] = useState<number[]>([]);

  useEffect(() => {
    // Convert KES amounts to user's currency
    const converted = DEPOSIT_OPTIONS_KES.map(kesAmount => 
      parseFloat((kesAmount / exchangeRate).toFixed(2))
    );
    setConvertedAmounts(converted);
  }, [exchangeRate]);

  const handleAmountSelect = (selectedAmount: number) => {
    setAmount(selectedAmount);
    setCustomAmount('');
  };

  const handleCustomAmount = (value: string) => {
    setCustomAmount(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      // Convert custom amount from user currency to KES for validation
      const kesValue = numValue * exchangeRate;
      if (kesValue >= 1000 && kesValue <= 1000000) {
        setAmount(numValue);
      } else {
        toast.error(`Minimum deposit is ${currencySymbol}${(1000 / exchangeRate).toFixed(2)}`);
      }
    }
  };

  const handleDeposit = async () => {
    if (amount < (1000 / exchangeRate)) {
      toast.error(`Minimum deposit is ${currencySymbol}${(1000 / exchangeRate).toFixed(2)}`);
      return;
    }

    setLoading(true);
    try {
      // Convert amount to KES for backend processing
      const amountInKES = amount * exchangeRate;
      
      const response = await apiClient.post(API_ENDPOINTS.wallet.deposit, {
        amount: amountInKES,
        currency: userCurrency,
        payment_method: 'm-pesa' // or other methods
      });
      
      toast.success(`Successfully deposited ${currencySymbol}${amount.toFixed(2)}`);
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Deposit failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Deposit Funds
                </h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Your Currency: {userCurrency} ({currencySymbol})
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Exchange Rate: 1 {userCurrency} = {exchangeRate} KES
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Select Amount ({currencySymbol})
                </label>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {convertedAmounts.map((convAmount, index) => (
                    <button
                      key={DEPOSIT_OPTIONS_KES[index]}
                      onClick={() => handleAmountSelect(convAmount)}
                      className={`p-3 border rounded-lg text-center transition-all ${
                        amount === convAmount && !customAmount
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          : 'border-gray-300 dark:border-gray-600 hover:border-blue-500'
                      }`}
                    >
                      <div className="font-bold">{currencySymbol}{convAmount.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">
                        ({currencySymbol}{(DEPOSIT_OPTIONS_KES[index] / exchangeRate).toFixed(2)})
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Custom Amount ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => handleCustomAmount(e.target.value)}
                    placeholder={`Minimum ${currencySymbol}${(1000 / exchangeRate).toFixed(2)}`}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Amount to Deposit:</span>
                  <span className="font-bold text-lg">
                    {currencySymbol}{amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>In KES:</span>
                  <span>KES {(amount * exchangeRate).toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleDeposit}
                disabled={loading || amount < (1000 / exchangeRate)}
                className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-blue-700 transition-all disabled:opacity-50"
              >
                {loading ? 'Processing...' : `Deposit ${currencySymbol}${amount.toFixed(2)}`}
              </button>

              <p className="mt-4 text-xs text-center text-gray-500 dark:text-gray-400">
                Minimum deposit: {currencySymbol}{(1000 / exchangeRate).toFixed(2)} (1000 KES)
                <br />
                Maximum deposit: {currencySymbol}{(1000000 / exchangeRate).toFixed(2)} (1,000,000 KES)
              </p>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}