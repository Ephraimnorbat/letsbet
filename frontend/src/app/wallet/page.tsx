'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { Wallet, ArrowUpRight, ArrowDownLeft, Ticket, History, AlertCircle, Loader2 } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import VoucherRedeem from '@/app/uni/admin/components/wallet/VoucherRedeemer';
import WithdrawModal from '@/app/uni/admin/components/wallet/WithdrawalModal';
import toast from 'react-hot-toast';

interface Transaction {
  id: number;
  amount: number;
  transaction_type: 'credit' | 'debit';
  description: string;
  status: string;
  created_at: string;
  reference?: string;
}

export default function WalletPage() {
  const { user } = useAuthStore();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currencySymbol, setCurrencySymbol] = useState<string>('KSh');
  const [currencyCode, setCurrencyCode] = useState<string>('KES');

  useEffect(() => {
    // Get user's currency from auth store
    if (user?.preferred_currency) {
      setCurrencySymbol(user.preferred_currency.symbol || 'KSh');
      setCurrencyCode(user.preferred_currency.code || 'KES');
    } else if (user?.currency_symbol) {
      setCurrencySymbol(user.currency_symbol);
    }
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch balance - apiClient returns the data directly (interceptor handles it)
      const balanceResponse = await apiClient.get(API_ENDPOINTS.wallet.balance);
      // If apiClient returns the data directly, use it directly
      // If it returns an AxiosResponse, use response.data
      const balanceData = (balanceResponse as any)?.data?.balance ?? (balanceResponse as any)?.balance ?? 0;
      setBalance(typeof balanceData === 'number' ? balanceData : parseFloat(balanceData) || 0);

      // Fetch transactions
      const transactionsResponse = await apiClient.get(API_ENDPOINTS.wallet.transactions);
      let transactionsData = (transactionsResponse as any)?.data ?? transactionsResponse ?? [];
      if (!Array.isArray(transactionsData)) {
        transactionsData = transactionsData?.results ?? transactionsData?.transactions ?? [];
      }
      setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
      
    } catch (error: any) {
      console.error('Failed to fetch wallet data:', error);
      const errorMsg = error?.response?.data?.message || 'Failed to load wallet data';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Failed to load wallet
        </h3>
        <p className="text-gray-500 dark:text-gray-400">{error}</p>
        <button
          onClick={fetchWalletData}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
        >
          Retry
        </button>
      </div>
    );
  }

  const safeBalance = typeof balance === 'number' && !isNaN(balance) ? balance : 0;

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4 pt-24">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-white">Wallet</h1>

        {/* Balance Card */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-6">
          <p className="text-sm text-gray-400">Available Balance</p>
          <p className="text-3xl font-bold text-white mt-1">
            {currencySymbol} {safeBalance.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {currencyCode} account
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => setShowVoucherModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl flex items-center justify-center gap-2 transition"
          >
            <Ticket className="w-5 h-5" />
            Deposit with Voucher
          </button>
          <button
            onClick={() => setShowWithdrawModal(true)}
            className="bg-red-600 hover:bg-red-700 text-white p-4 rounded-xl flex items-center justify-center gap-2 transition"
          >
            <ArrowDownLeft className="w-5 h-5" />
            Withdraw
          </button>
        </div>

        {/* How to Get Voucher Info */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Ticket className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-white">How to get a voucher</h4>
              <ol className="text-xs text-gray-400 mt-1 space-y-1 list-decimal list-inside">
                <li>Contact our verified vendor on <strong className="text-white">Telegram</strong> or <strong className="text-white">WhatsApp</strong></li>
                <li>Send payment via M-Pesa, Crypto, or Bank Transfer</li>
                <li>Receive your 16-digit voucher code</li>
                <li>Redeem it here instantly!</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2 text-white">
              <History className="w-4 h-4" />
              Transaction History
            </h2>
            <span className="text-xs text-gray-500">{transactions.length} transactions</span>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No transactions yet</p>
              <p className="text-xs text-gray-500 mt-1">Your transaction history will appear here</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {transactions.slice(0, 20).map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-white truncate">
                      {tx.description || 'Transaction'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {tx.created_at ? new Date(tx.created_at).toLocaleString() : 'N/A'}
                    </p>
                    {tx.reference && (
                      <p className="text-[10px] text-gray-500 font-mono">Ref: {tx.reference}</p>
                    )}
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <span
                      className={`font-semibold text-sm ${
                        tx.transaction_type === 'credit'
                          ? 'text-green-400'
                          : tx.transaction_type === 'debit'
                          ? 'text-red-400'
                          : 'text-gray-400'
                      }`}
                    >
                      {tx.transaction_type === 'credit' ? '+' : 
                       tx.transaction_type === 'debit' ? '-' : ''}
                      {currencySymbol} {typeof tx.amount === 'number' ? tx.amount.toFixed(2) : '0.00'}
                    </span>
                    <p className="text-[10px] uppercase text-gray-500">
                      {tx.status || 'completed'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Voucher Modal */}
        {showVoucherModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <VoucherRedeem
              onSuccess={() => {
                fetchWalletData();
                setShowVoucherModal(false);
              }}
              onClose={() => setShowVoucherModal(false)}
            />
          </div>
        )}

        {/* Withdraw Modal */}
        {showWithdrawModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <WithdrawModal
              balance={safeBalance}
              currencySymbol={currencySymbol}
              currencyCode={currencyCode}
              onSuccess={() => {
                fetchWalletData();
                setShowWithdrawModal(false);
              }}
              onClose={() => setShowWithdrawModal(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}