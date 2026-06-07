'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Wallet as WalletIcon,
  CheckCircle2,
  Clock,
  Landmark,
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
  // ✅ FIXED: Cast user object context to any to allow loose nested property checks
  const user = authStore?.user as any;

  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'history'>('deposit');
  const [amount, setAmount] = useState('');
  const [account, setAccount] = useState('');
  const [method, setMethod] = useState('usdttrc20');

  const [balance, setBalance] = useState({ balance: 0, bonus_balance: 0 });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);

  // currency fallback
  const currencySymbol =
    user?.currency_details?.symbol ||
    user?.country_details?.default_currency_details?.symbol ||
    'KSh';

  const currencyCode =
    user?.currency_details?.code ||
    user?.country_details?.default_currency_details?.code ||
    'KES';

  // ================= FETCH WALLET =================
    const fetchWallet = async () => {
      try {
        setLoading(true);

        const [balanceRes, txRes] = await Promise.all([
          apiClient.get(API_ENDPOINTS.wallet.balance),
          apiClient.get(API_ENDPOINTS.wallet.transactions)
        ]);

        // ✅ FIXED: Cast to any to cleanly unbox data payloads from the Axios wrapper
        const bData = (balanceRes as any)?.data || balanceRes;
        const tData = (txRes as any)?.data || txRes;

        setBalance({
          balance: bData?.balance ?? 0,
          bonus_balance: bData?.bonus_balance ?? 0
        });

        setTransactions(tData?.results ?? tData ?? []);
      } catch (err) {
        console.error('Wallet fetch error:', err);
        toast.error('Failed to load wallet');
      } finally {
        setLoading(false);
      }
    };
  // ================= DEPOSIT =================
    const handleDeposit = async () => {
      if (!amount || Number(amount) <= 0) return toast.error('Enter valid amount');

      try {
        setLoading(true);

        const res = await apiClient.post(API_ENDPOINTS.wallet.deposit, {
          amount: Number(amount),
          pay_currency: method
        });

        // ✅ FIXED: Extract data payload or fallback to response to satisfy PaymentInfo type match
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
    toast.success('Copied');
  };

  return (
    <div className="min-h-screen bg-slate-950 pt-24 px-4 text-white">
      <div className="max-w-4xl mx-auto">

        {/* BALANCE */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700">
            <p className="text-sm text-blue-100">Balance</p>
            <h1 className="text-3xl font-bold">
              {currencySymbol}{balance.balance.toLocaleString()}
            </h1>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
            <p className="text-sm text-slate-400">Bonus</p>
            <h1 className="text-3xl font-bold text-purple-400">
              {currencySymbol}{balance.bonus_balance.toLocaleString()}
            </h1>
          </div>
        </div>

        {/* TABS */}
        <div className="flex bg-slate-900 rounded-xl mb-6">
          {['deposit', 'withdraw', 'history'].map((t: any) => (
            <button
              key={t}
              onClick={() => {
                setActiveTab(t);
                setPaymentInfo(null);
              }}
              className={`flex-1 py-3 capitalize ${
                activeTab === t ? 'bg-slate-800' : ''
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">

          <AnimatePresence mode="wait">

            {/* DEPOSIT */}
            {activeTab === 'deposit' && (
              <motion.div key="deposit" className="space-y-4">
                {!paymentInfo ? (
                  <>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl bg-[#090d16]"
                      placeholder="Amount"
                    />

                    <select
                      value={method}
                      onChange={(e) => setMethod(e.target.value)}
                      className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl bg-[#090d16]"
                    >
                      <option value="usdttrc20">USDT TRC20</option>
                      <option value="btc">BTC</option>
                      <option value="eth">ETH</option>
                    </select>

                    <button
                      onClick={handleDeposit}
                      disabled={loading}
                      className="w-full bg-blue-600 py-3 rounded-xl font-bold transition hover:bg-blue-700"
                    >
                      {loading ? 'Processing...' : 'Generate Address'}
                    </button>
                  </>
                ) : (
                  <div className="text-center space-y-4">
                    <CheckCircle2 className="mx-auto text-green-500" />
                    <p className="text-xl font-bold">
                      {paymentInfo.pay_amount} {paymentInfo.pay_currency}
                    </p>

                    <div className="bg-slate-950 p-4 rounded-xl break-all">
                      {paymentInfo.pay_address}
                      <button
                        onClick={() => copy(paymentInfo.pay_address)}
                        className="ml-2 text-blue-400 font-bold"
                      >
                        Copy
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        setPaymentInfo(null);
                        setAmount('');
                      }}
                      className="text-blue-400 text-sm font-semibold underline"
                    >
                      New Deposit
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* WITHDRAW */}
            {activeTab === 'withdraw' && (
              <motion.div key="withdraw" className="space-y-4">
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl bg-[#090d16]"
                  placeholder="Amount"
                />

                <input
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl bg-[#090d16]"
                  placeholder="Account Wallet Address / Details"
                />

                <button
                  onClick={handleWithdraw}
                  disabled={loading}
                  className="w-full bg-red-600 py-3 rounded-xl font-bold transition hover:bg-red-700"
                >
                  Withdraw
                </button>
              </motion.div>
            )}

            {/* HISTORY */}
            {activeTab === 'history' && (
              <motion.div key="history" className="space-y-3">
                {transactions.length === 0 ? (
                  <p className="text-center text-slate-500 py-6">
                    No transactions recorded
                  </p>
                ) : (
                  transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex justify-between p-3 bg-slate-950 rounded-xl items-center border border-slate-900"
                    >
                      <div>
                        <p className="text-sm font-medium">{tx.description || 'Transaction'}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {new Date(tx.created_at || tx.timestamp).toLocaleString()}
                        </p>
                      </div>

                      <p
                        className={`font-mono font-bold ${
                          tx.transaction_type === 'credit' || tx.type === 'deposit'
                            ? 'text-green-500'
                            : 'text-red-500'
                        }`}
                      >
                        {tx.transaction_type === 'credit' || tx.type === 'deposit' ? '+' : '-'}
                        {currencySymbol}{tx.amount}
                      </p>
                    </div>
                  ))
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}