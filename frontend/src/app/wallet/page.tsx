'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlusCircle, MinusCircle, History, ArrowUpRight, ArrowDownLeft, 
  Wallet as WalletIcon, CheckCircle2, Clock, Landmark, Copy, ExternalLink 
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import toast from 'react-hot-toast';

// Updated interface to match NOWPayments API response
interface PaymentInfo {
  pay_address: string;
  pay_amount: number;
  pay_currency: string;
  payment_id: string;
  payment_status?: string;
}

export default function WalletPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'history'>('deposit');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('usdttrc20'); 
  const [account, setAccount] = useState('');
  const [balance, setBalance] = useState({ balance: 0, bonus: 0 });
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);

  // Dynamic currency states initialized to safe empty values
  const [currencySymbol, setCurrencySymbol] = useState<string>('');
  const [currencyCode, setCurrencyCode] = useState<string>('');

  useEffect(() => {
    fetchWalletData();
  }, []);

  // Dynamically resolve currency details straight from context profile response
  useEffect(() => {
    if (user) {
      const symbol = user.currency_details?.symbol || user.country_details?.default_currency_details?.symbol || '';
      const code = user.currency_details?.code || user.country_details?.default_currency_details?.code || '';
      setCurrencySymbol(symbol);
      setCurrencyCode(code);
    }
  }, [user]);

  const fetchWalletData = async () => {
    try {
      const balanceData = await apiClient.get(API_ENDPOINTS.wallet.balance);
      setBalance({ balance: balanceData.balance, bonus: balanceData.bonus_balance });
      const history = await apiClient.get(API_ENDPOINTS.wallet.transactions);
      setTransactions(history?.results || history || []);
    } catch (error) {
      console.error("Wallet Fetch Error:", error);
    }
  };

  const handleDeposit = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.post(API_ENDPOINTS.wallet.deposit, {
        amount: Number(amount),
        pay_currency: method
      });
      setPaymentInfo(data);
      toast.success('Payment address generated!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to generate address");
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    setIsLoading(true);
    try {
      await apiClient.post(API_ENDPOINTS.wallet.withdraw, {
        amount: Number(amount),
        method: 'Manual',
        details: account
      });
      toast.success('Withdrawal request submitted for approval');
      setAmount('');
      setAccount('');
      fetchWalletData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Withdrawal failed");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-slate-950 pt-24 pb-12 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Balance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-blue-100 text-sm mb-1 font-medium">Real Balance</p>
              <h2 className="text-4xl font-bold text-white font-mono" dir="ltr">
                {currencySymbol ? `${currencySymbol} ` : ''}{Number(balance.balance).toLocaleString()}
              </h2>
            </div>
            <WalletIcon className="absolute right-[-5%] bottom-[-5%] w-24 h-24 text-white/10" />
          </motion.div>
          <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <p className="text-slate-500 text-sm mb-1 font-medium">Bonus Balance</p>
            <h2 className="text-4xl font-bold text-purple-500 font-mono" dir="ltr">
              {currencySymbol ? `${currencySymbol} ` : ''}{Number(balance.bonus).toLocaleString()}
            </h2>
          </motion.div>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-slate-900 rounded-xl mb-8 border border-slate-800">
          {(['deposit', 'withdraw', 'history'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setPaymentInfo(null); }}
              className={`flex-1 py-3 rounded-lg text-sm font-bold capitalize transition-all ${
                activeTab === tab ? 'bg-slate-800 text-white shadow-lg border border-slate-700' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm min-h-[400px]">
          <AnimatePresence mode="wait">
            {activeTab === 'deposit' && (
              <motion.div key="deposit" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                {!paymentInfo ? (
                  <>
                    <div>
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 block">
                        Deposit Amount {currencyCode ? `(${currencyCode})` : ''}
                      </label>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-2xl font-mono text-white outline-none focus:border-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 block">Select Crypto</label>
                      <select 
                        value={method}
                        onChange={(e) => setMethod(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white outline-none"
                      >
                        <option value="usdttrc20">USDT (TRC20)</option>
                        <option value="btc">Bitcoin (BTC)</option>
                        <option value="ltc">Litecoin (LTC)</option>
                        <option value="eth">Ethereum (ETH)</option>
                      </select>
                    </div>
                    <button
                      onClick={handleDeposit}
                      disabled={isLoading || !amount}
                      className="w-full py-4 bg-blue-600 rounded-xl font-black uppercase tracking-widest text-white hover:bg-blue-500 transition-all disabled:opacity-50"
                    >
                      {isLoading ? 'Generating Address...' : 'Generate Deposit Address'}
                    </button>
                  </>
                ) : (
                  <div className="bg-slate-950 border border-blue-500/30 rounded-2xl p-6 text-center space-y-4">
                    <div className="flex justify-center"><CheckCircle2 className="w-12 h-12 text-green-500" /></div>
                    <h3 className="text-lg font-bold text-white">Send Exactly</h3>
                    
                    <p className="text-3xl font-mono text-blue-400 font-bold" dir="ltr">
                        {paymentInfo?.pay_amount} {paymentInfo?.pay_currency?.toUpperCase()}
                    </p>
                    
                    <div className="mt-4 p-4 bg-slate-900 rounded-xl border border-slate-800 break-all relative text-left">
                      <p className="text-xs text-slate-500 mb-2 font-bold uppercase">Destination Address</p>
                      <p className="text-sm font-mono text-white pr-10">{paymentInfo?.pay_address}</p>
                      
                      <button 
                        onClick={() => copyToClipboard(paymentInfo?.pay_address)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-400 p-2"
                      >
                        <Copy size={20} />
                      </button>
                    </div>

                    <div className="flex items-center justify-center space-x-2 text-slate-400 py-2">
                        <Clock size={14} className="animate-spin" />
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">
                            Waiting for network confirmation...
                        </p>
                    </div>

                    <div className="pt-4 border-t border-slate-900">
                        <p className="text-[10px] text-slate-600 mb-4 uppercase">Payment ID: {paymentInfo?.payment_id}</p>
                        <button 
                            onClick={() => { setPaymentInfo(null); setAmount(''); }} 
                            className="text-blue-500 hover:text-blue-400 text-sm font-bold uppercase tracking-widest"
                        >
                            New Deposit
                        </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'withdraw' && (
              <motion.div key="withdraw" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 block">
                    Withdrawal Amount {currencyCode ? `(${currencyCode})` : ''}
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-2xl font-mono text-white outline-none focus:border-red-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 block">Account Details / ID</label>
                  <div className="relative">
                    <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="text"
                      value={account}
                      onChange={(e) => setAccount(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-4 pl-12 pr-4 text-white outline-none"
                      placeholder="Account reference or identification info"
                    />
                  </div>
                </div>
                <button
                  onClick={handleWithdraw}
                  disabled={isLoading || !amount || !account}
                  className="w-full py-4 bg-red-600 rounded-xl font-black uppercase tracking-widest text-white hover:bg-red-500 transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Submitting...' : 'Request Withdrawal'}
                </button>
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                {transactions.length === 0 ? (
                  <div className="text-center py-20 text-slate-600 font-bold uppercase tracking-widest">No transactions yet</div>
                ) : (
                  transactions.map((tx: any) => (
                    <div key={tx.id} className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800 hover:border-slate-700 transition-all">
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-xl ${tx.transaction_type === 'credit' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                          {tx.transaction_type === 'credit' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{tx.description}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{new Date(tx.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-mono font-bold ${tx.transaction_type === 'credit' ? 'text-green-500' : 'text-red-500'}`} dir="ltr">
                          {tx.transaction_type === 'credit' ? '+' : '-'} {currencySymbol ? `${currencySymbol} ` : ''}{Number(tx.amount).toLocaleString()}
                        </p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          tx.status === 'completed' ? 'bg-green-500/10 text-green-500' : 
                          tx.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'
                        }`}>
                          {tx.status}
                        </span>
                      </div>
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