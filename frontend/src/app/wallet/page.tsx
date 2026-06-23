'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Copy
} from 'lucide-react';

import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import toast from 'react-hot-toast';

interface PaymentInfo {
  pay_address: string;
  pay_amount: number;
  pay_currency: string;
  payment_id: string;
  payment_status?: string;
}

export default function WalletPage() {
  const authStore = useAuthStore();
  const user = authStore?.user as any;

  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'history'>('deposit');
  const [amount, setAmount] = useState('');
  const [account, setAccount] = useState('');
  const [method, setMethod] = useState('usdttrc20');

  const [balance, setBalance] = useState({ balance: 0, bonus_balance: 0 });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);

  const currencySymbol = user?.currency_symbol || 'KSh';
  const currencyCode = user?.currency_code || 'KES';

  // ================= FETCH WALLET =================
  const fetchWallet = async () => {
    try {
      setLoading(true);

      const [balanceRes, txRes] = await Promise.all([
        apiClient.get(API_ENDPOINTS.wallet.balance),
        apiClient.get(API_ENDPOINTS.wallet.transactions)
      ]);

      const bData = (balanceRes as any)?.data || balanceRes;
      const tData = (txRes as any)?.data || txRes;

      const latestBalance = bData?.balance ?? 0;
      const latestBonus = bData?.bonus_balance ?? 0;

      setBalance({
        balance: latestBalance,
        bonus_balance: latestBonus
      });

      // 🚀 THE SYNC FIX: Push the freshly retrieved balance into the global auth store state
      if (authStore && authStore.setUser && user) {
        authStore.setUser({
          ...user,
          balance: latestBalance // Updates any components listening to authStore.user
        });
      }

      setTransactions(tData?.results ?? tData ?? []);
    } catch (err) {
      console.error('Wallet fetch error:', err);
      toast.error('Failed to load wallet');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  // ================= DEPOSIT =================
  const handleDeposit = async () => {
    if (!amount || Number(amount) <= 0) return toast.error('Enter valid amount');

    try {
      setLoading(true);

      const res = await apiClient.post(API_ENDPOINTS.wallet.deposit, {
        amount: Number(amount),
        pay_currency: method
      });

      const pData = (res as any)?.data || res;
      setPaymentInfo(pData);
      
      toast.success('Deposit address generated');
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Deposit failed');
    } finally {
      setLoading(false);
    }
  };

  // ================= WITHDRAW =================
  const handleWithdraw = async () => {
    if (!amount || !account) return toast.error('Fill all fields');

    try {
      setLoading(true);

      await apiClient.post(API_ENDPOINTS.wallet.withdraw, {
        amount: Number(amount),
        method: 'manual',
        details: account
      });

      toast.success('Withdrawal request submitted');

      setAmount('');
      setAccount('');
      fetchWallet();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Withdrawal failed');
    } finally {
      setLoading(false);
    }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="min-h-screen bg-slate-950 pt-24 px-4 text-white">
      <div className="max-w-4xl mx-auto">

        {/* BALANCE */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg">
            <p className="text-sm text-blue-100 font-medium">Balance</p>
            <h1 className="text-3xl font-black tracking-tight mt-1">
              {currencySymbol} {Number(balance.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h1>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
            <p className="text-sm text-slate-400 font-medium">Bonus Balance</p>
            <h1 className="text-3xl font-black tracking-tight text-purple-400 mt-1">
              {currencySymbol} {Number(balance.bonus_balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h1>
          </div>
        </div>

        {/* TABS */}
        <div className="flex bg-slate-900 p-1 rounded-xl mb-6 border border-slate-800">
          {['deposit', 'withdraw', 'history'].map((t: any) => (
            <button
              key={t}
              onClick={() => {
                setActiveTab(t);
                setPaymentInfo(null);
              }}
              className={`flex-1 py-2.5 text-sm font-bold capitalize rounded-lg transition-all ${
                activeTab === t 
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700/50' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
          <AnimatePresence mode="wait">

            {/* DEPOSIT */}
            {activeTab === 'deposit' && (
              <motion.div 
                key="deposit"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-4"
              >
                {!paymentInfo ? (
                  <>
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-400 mb-2 tracking-wider">
                        Amount ({currencyCode})
                      </label>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl font-mono focus:border-blue-500 focus:outline-none transition"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-400 mb-2 tracking-wider">
                        Payment System
                      </label>
                      <select
                        value={method}
                        onChange={(e) => setMethod(e.target.value)}
                        className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl focus:border-blue-500 focus:outline-none transition"
                      >
                        <option value="usdttrc20">USDT (TRC20)</option>
                        <option value="btc">Bitcoin (BTC)</option>
                        <option value="eth">Ethereum (ETH)</option>
                      </select>
                    </div>

                    <button
                      onClick={handleDeposit}
                      disabled={loading}
                      className="w-full bg-blue-600 py-4 rounded-xl font-bold transition hover:bg-blue-500 disabled:opacity-50 text-sm tracking-wide uppercase mt-2"
                    >
                      {loading ? 'Processing...' : 'Generate Address'}
                    </button>
                  </>
                ) : (
                  <div className="text-center space-y-4 py-4">
                    <CheckCircle2 className="mx-auto text-green-500 w-12 h-12" />
                    <div>
                      <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Send exactly</p>
                      <p className="text-2xl font-mono font-black text-green-400 mt-1">
                        {paymentInfo.pay_amount} {paymentInfo.pay_currency.toUpperCase()}
                      </p>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 relative group flex items-center justify-between">
                      <span className="font-mono text-xs text-left text-slate-300 select-all break-all pr-4">
                        {paymentInfo.pay_address}
                      </span>
                      <button
                        onClick={() => copy(paymentInfo.pay_address)}
                        className="flex items-center gap-1 shrink-0 bg-slate-900 hover:bg-slate-800 text-blue-400 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-bold transition"
                      >
                        <Copy size={14} />
                        Copy
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        setPaymentInfo(null);
                        setAmount('');
                      }}
                      className="text-blue-400 text-xs font-semibold hover:underline block mx-auto pt-2"
                    >
                      Cancel and Create New Deposit
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* WITHDRAW */}
            {activeTab === 'withdraw' && (
              <motion.div 
                key="withdraw"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-2 tracking-wider">
                    Withdrawal Amount ({currencyCode})
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl font-mono focus:border-red-500 focus:outline-none transition"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-2 tracking-wider">
                    Destination Address / Payment Details
                  </label>
                  <input
                    value={account}
                    onChange={(e) => setAccount(e.target.value)}
                    className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl focus:border-red-500 focus:outline-none transition"
                    placeholder="Provide network target address..."
                  />
                </div>

                <button
                  onClick={handleWithdraw}
                  disabled={loading}
                  className="w-full bg-red-600 py-4 rounded-xl font-bold transition hover:bg-red-500 disabled:opacity-50 text-sm tracking-wide uppercase mt-2"
                >
                  {loading ? 'Processing...' : 'Withdraw Funds'}
                </button>
              </motion.div>
            )}

            {/* HISTORY */}
            {activeTab === 'history' && (
              <motion.div 
                key="history"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-3"
              >
                {transactions.length === 0 ? (
                  <p className="text-center text-slate-500 py-12 text-sm">
                    No transactions recorded on this account.
                  </p>
                ) : (
                  transactions.map((tx) => {
                    const isCredit = tx.transaction_type === 'credit' || tx.type === 'deposit';
                    return (
                      <div
                        key={tx.id}
                        className="flex justify-between p-4 bg-slate-950 rounded-xl items-center border border-slate-900 hover:border-slate-800 transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isCredit ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                            {isCredit ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{tx.description || 'Wallet Transaction'}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {new Date(tx.created_at || tx.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <p className={`font-mono font-bold text-sm ${isCredit ? 'text-green-400' : 'text-red-400'}`}>
                          {isCredit ? '+' : '-'} {currencySymbol} {Number(tx.amount).toFixed(2)}
                        </p>
                      </div>
                    );
                  })
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}