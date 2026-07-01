'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, ArrowDownLeft, AlertCircle, Loader2, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { useAuthStore } from '@/store/authStore';

interface WithdrawModalProps {
  balance: number;
  currencySymbol: string;
  currencyCode: string;
  onSuccess?: () => void;
  onClose?: () => void;
}

interface WithdrawMethod {
  id: string;
  name: string;
  icon: string;
  description: string;
}

const withdrawMethods: WithdrawMethod[] = [
  { id: 'mpesa', name: 'M-Pesa', icon: '📱', description: 'Send to M-Pesa number' },
  { id: 'bank', name: 'Bank Transfer', icon: '🏦', description: 'Send to bank account' },
  { id: 'crypto', name: 'Cryptocurrency', icon: '₿', description: 'Send to crypto wallet' },
  { id: 'voucher', name: 'Voucher Code', icon: '🎫', description: 'Receive a withdrawal voucher' },
];

export default function WithdrawModal({ balance, currencySymbol, currencyCode, onSuccess, onClose }: WithdrawModalProps) {
  const { user } = useAuthStore();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [userCurrencySymbol, setUserCurrencySymbol] = useState<string>(currencySymbol);
  const [userCurrencyCode, setUserCurrencyCode] = useState<string>(currencyCode);

  useEffect(() => {
    // Use user's preferred currency from auth store
    if (user?.preferred_currency) {
      setUserCurrencySymbol(user.preferred_currency.symbol || 'KSh');
      setUserCurrencyCode(user.preferred_currency.code || 'KES');
    } else if (user?.currency_symbol) {
      setUserCurrencySymbol(user.currency_symbol);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError(`Please enter a valid amount (minimum: ${userCurrencySymbol}10.00)`);
      return;
    }
    
    // Minimum withdrawal check (in user's currency)
    const minimumWithdrawal = 10; // 10 KES or equivalent
    if (amountNum < minimumWithdrawal) {
      setError(`Minimum withdrawal is ${userCurrencySymbol}${minimumWithdrawal.toFixed(2)}`);
      return;
    }
    
    if (amountNum > balance) {
      setError(`Insufficient balance. You have ${userCurrencySymbol}${balance.toFixed(2)}`);
      return;
    }

    if (!method) {
      setError('Please select a withdrawal method');
      return;
    }

    if (!details.trim()) {
      setError('Please provide withdrawal details');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Send withdrawal request with user's currency
      const response = await apiClient.post(API_ENDPOINTS.wallet.withdraw, {
        amount: amountNum,
        currency: userCurrencyCode, // Use user's currency
        method: method,
        details: details.trim()
      });
      
      setSuccess(true);
      toast.success('Withdrawal request submitted successfully!');
      setTimeout(() => {
        if (onSuccess) onSuccess();
        if (onClose) onClose();
      }, 2000);
      
    } catch (error: any) {
      const message = error?.response?.data?.error || 
                     error?.response?.data?.message ||
                     'Failed to submit withdrawal request';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const getMethodPlaceholder = (methodId: string) => {
    const placeholders: Record<string, string> = {
      mpesa: '0712345678',
      bank: 'Bank Name, Account Number, Account Name',
      crypto: 'Wallet Address (e.g., 0x...)',
      voucher: 'Your contact email or phone',
    };
    return placeholders[methodId] || 'Enter details';
  };

  const getMethodLabel = (methodId: string) => {
    const labels: Record<string, string> = {
      mpesa: 'M-Pesa Phone Number',
      bank: 'Bank Account Details',
      crypto: 'Wallet Address',
      voucher: 'Contact Information',
    };
    return labels[methodId] || 'Details';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-6 max-w-md w-full"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ArrowDownLeft className="w-5 h-5 text-red-400" />
          <h2 className="text-xl font-bold text-white">Withdraw Funds</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-700 rounded-lg transition text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {success ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Request Submitted!</h3>
          <p className="text-sm text-gray-400">
            Your withdrawal request has been submitted for approval.
            <br />
            You will be notified once processed.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Balance Info */}
          <div className="bg-gray-700/50 rounded-lg p-3">
            <p className="text-sm text-gray-400">Available Balance</p>
            <p className="text-lg font-bold text-white">
              {userCurrencySymbol} {balance.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">{userCurrencyCode} account</p>
          </div>

          {/* Amount - Fixed Step Validation */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Amount ({userCurrencyCode})
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => {
                  const val = e.target.value;
                  // Allow only valid numbers
                  if (val === '' || /^\d*\.?\d*$/.test(val)) {
                    setAmount(val);
                    setError('');
                  }
                }}
                placeholder={`Enter amount (min: ${userCurrencySymbol}10)`}
                className={`w-full bg-gray-700 border ${error ? 'border-red-500' : 'border-gray-600'} rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                min="10"
                step="1" // Changed from 100 to 1 to allow any amount
              />
              {error && (
                <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {error}
                </p>
              )}
            </div>
            <div className="flex justify-between mt-1">
              <p className="text-xs text-gray-500">Minimum: {userCurrencySymbol}10.00</p>
              <p className="text-xs text-gray-500">Maximum: {userCurrencySymbol}{balance.toFixed(2)}</p>
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div className="flex gap-2 flex-wrap">
            {[50, 100, 500, 1000].map((quickAmount) => (
              <button
                key={quickAmount}
                type="button"
                onClick={() => {
                  if (quickAmount <= balance) {
                    setAmount(quickAmount.toString());
                    setError('');
                  } else {
                    toast.error(`Amount exceeds balance of ${userCurrencySymbol}${balance.toFixed(2)}`);
                  }
                }}
                disabled={quickAmount > balance}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  quickAmount <= balance
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                }`}
              >
                {userCurrencySymbol}{quickAmount}
              </button>
            ))}
          </div>

          {/* Withdrawal Method */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Withdrawal Method
            </label>
            <div className="grid grid-cols-2 gap-2">
              {withdrawMethods.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setMethod(m.id);
                    setDetails('');
                    setError('');
                  }}
                  className={`p-3 rounded-lg border text-left transition ${
                    method === m.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-600 hover:border-gray-500 bg-gray-700/50'
                  }`}
                >
                  <div className="text-xl">{m.icon}</div>
                  <div className="text-sm font-medium text-white mt-1">{m.name}</div>
                  <div className="text-xs text-gray-400">{m.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Details */}
          {method && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                {getMethodLabel(method)}
              </label>
              <input
                type="text"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder={getMethodPlaceholder(method)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {method === 'voucher' && (
                <p className="mt-1 text-xs text-blue-400">
                  You will receive a voucher code to redeem your withdrawal
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <ArrowDownLeft className="w-4 h-4" />
                Request Withdrawal
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 text-center">
            Withdrawal requests are processed within 24-48 hours.
            <br />
            You will be notified of approval/rejection.
          </p>
        </form>
      )}
    </motion.div>
  );
}