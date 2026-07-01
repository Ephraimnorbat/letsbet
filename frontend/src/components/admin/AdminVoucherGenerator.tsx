'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Copy, Check, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

export default function AdminVoucherGenerator() {
  const [amount, setAmount] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [vendorContact, setVendorContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedVoucher, setGeneratedVoucher] = useState<{ code: string; amount: number; currency: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post(API_ENDPOINTS.wallet.createVoucher, {
        amount: amountNum,
        voucher_type_id: 1,
        vendor_name: vendorName || 'Vendor',
        vendor_contact: vendorContact || '',
        expires_in_days: 7
      });

      const data = response.data || response;
      
      // Safely extract amount
      const voucherAmount = data.voucher?.amount ?? data.amount ?? 0;
      
      setGeneratedVoucher({
        code: data.voucher_code || data.voucher?.code || '',
        amount: typeof voucherAmount === 'number' ? voucherAmount : parseFloat(voucherAmount) || 0,
        currency: data.currency || data.voucher?.currency || 'KES'
      });
      
      toast.success('Voucher generated successfully!');
    } catch (error: any) {
      const errors = error.response?.data?.errors;
      if (errors && typeof errors === 'object') {
        const firstKey = Object.keys(errors)[0];
        const firstError = errors[firstKey];
        const message = Array.isArray(firstError) ? firstError[0] : firstError;
        toast.error(message);
      } else {
        toast.error(error.response?.data?.error || 'Failed to generate voucher');
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!generatedVoucher) return;
    await navigator.clipboard.writeText(generatedVoucher.code);
    setCopied(true);
    toast.success('Voucher code copied!');
    setTimeout(() => setCopied(false), 3000);
  };

  const resetForm = () => {
    setAmount('');
    setGeneratedVoucher(null);
    setCopied(false);
  };

  return (
    <div className="bg-[#0f1422] border border-slate-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-white">Voucher Generator</h3>
          <p className="text-sm text-slate-400">Create deposit vouchers for your vendors</p>
        </div>
        <button
          onClick={resetForm}
          className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition"
        >
          <RefreshCw className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {generatedVoucher ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 text-center"
        >
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-500" />
          </div>
          <p className="text-sm text-green-400 font-medium">Voucher Generated Successfully</p>
          <p className="text-xs text-slate-400 mb-4">
            Amount: {generatedVoucher.currency} {Number(generatedVoucher.amount).toFixed(2)}
          </p>
          
          <div className="bg-slate-950 rounded-lg p-4 mb-4">
            <p className="font-mono text-2xl font-bold text-white tracking-wider">
              {generatedVoucher.code}
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={copyToClipboard}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition flex items-center justify-center gap-2"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
            <button
              onClick={() => {
                setGeneratedVoucher(null);
                setAmount('');
              }}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg font-medium transition flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Generate Another
            </button>
          </div>
          
          <p className="mt-4 text-xs text-amber-400">
            ⚠️ Share this code securely with the vendor only
          </p>
        </motion.div>
      ) : (
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Amount (KES)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g., 1000"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              step="1"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Vendor Name
              </label>
              <input
                type="text"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                placeholder="e.g., John M-Pesa"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Vendor Contact
              </label>
              <input
                type="text"
                value={vendorContact}
                onChange={(e) => setVendorContact(e.target.value)}
                placeholder="e.g., 0712345678"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Generating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Generate Voucher
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}