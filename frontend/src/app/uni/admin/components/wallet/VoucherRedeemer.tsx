'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Ticket, Check, X, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

interface VoucherRedeemProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

export default function VoucherRedeem({ onSuccess, onClose }: VoucherRedeemProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatVoucherCode = (value: string) => {
    // Remove non-digits
    const digits = value.replace(/\D/g, '');
    // Add spaces every 4 digits
    const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
    return formatted;
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatVoucherCode(e.target.value);
    setCode(formatted);
    setError('');
  };

  const handleRedeem = async () => {
    const cleanCode = code.replace(/\s/g, '');
    if (cleanCode.length !== 16) {
      setError('Voucher code must be 16 digits');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await apiClient.post(API_ENDPOINTS.wallet.redeemVoucher, {
        code: cleanCode
      });

      // ✅ Get the response data
      const data = response.data || response;
      
      // ✅ Show success message with amount
      const amount = data.amount || data.new_balance || 0;
      const currency = data.currency || 'KES';
      
      toast.success(`Successfully redeemed ${currency} ${amount.toFixed(2)}!`);
      
      if (onSuccess) onSuccess();
      if (onClose) onClose();
      
    } catch (error: any) {
      // ✅ Better error handling
      const errorData = error.response?.data;
      const errorMessage = errorData?.error || 
                          errorData?.message || 
                          'Failed to redeem voucher';
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-md w-full"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Ticket className="w-5 h-5 text-blue-500" />
          <h2 className="text-xl font-bold">Redeem Voucher</h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          How to redeem your voucher
        </h3>
        <ol className="text-xs text-blue-700 dark:text-blue-300 mt-2 space-y-1 list-decimal list-inside">
          <li>Contact your verified vendor via Telegram or WhatsApp</li>
          <li>Make payment via M-Pesa, crypto, or bank transfer</li>
          <li>Receive your 16-digit voucher code</li>
          <li>Enter the code below to deposit</li>
        </ol>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Voucher Code
          </label>
          <div className="relative">
            <input
              type="text"
              value={code}
              onChange={handleCodeChange}
              placeholder="XXXX XXXX XXXX XXXX"
              className={`w-full px-4 py-3 border rounded-lg font-mono text-lg tracking-wider focus:outline-none focus:ring-2 ${
                error
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
              } dark:bg-gray-700`}
              maxLength={19}
              disabled={loading}
            />
            {error && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {error}
              </p>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Enter the 16-digit code provided by your vendor
          </p>
        </div>

        <button
          onClick={handleRedeem}
          disabled={loading || code.replace(/\s/g, '').length !== 16}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Processing...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Redeem Voucher
            </>
          )}
        </button>
      </div>

      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          Need a voucher? Contact our verified vendors on{' '}
          <a href="https://t.me/your_betting_vendor" className="text-blue-500 hover:underline">
            Telegram
          </a>{' '}
          or{' '}
          <a href="https://wa.me/your_number" className="text-blue-500 hover:underline">
            WhatsApp
          </a>
        </p>
      </div>
    </motion.div>
  );
}