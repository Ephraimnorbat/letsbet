import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import toast from 'react-hot-toast';

export interface Wallet {
  balance: number;
  bonus_balance: number;
  total_deposited: number;
  total_withdrawn: number;
  total_won: number;
}

export interface Transaction {
  id: number;
  amount: number;
  transaction_type: 'credit' | 'debit';
  status: 'pending' | 'completed' | 'failed';
  description: string;
  reference: string;
  created_at: string;
}

export const useWalletBalance = () => {
  return useQuery({
    queryKey: ['wallet-balance'],
    queryFn: async () => {
      const response = await apiClient.get(API_ENDPOINTS.wallet.balance);
      return response.data;
    },
    refetchInterval: 5000,
  });
};

export const useDeposit = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ amount, payment_method }: { amount: number; payment_method: string }) => {
      const response = await apiClient.post(API_ENDPOINTS.wallet.deposit, {
        amount,
        payment_method,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Deposit successful!');
    },
    onError: (error: any) => {
      toast.error('Deposit failed. Please try again.');
    },
  });
};

export const useWithdraw = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ amount, bank_account }: { amount: number; bank_account: string }) => {
      const response = await apiClient.post(API_ENDPOINTS.wallet.withdraw, {
        amount,
        bank_account,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Withdrawal request submitted!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Withdrawal failed';
      toast.error(message);
    },
  });
};

export const useTransactions = () => {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await apiClient.get(API_ENDPOINTS.wallet.transactions);
      return response.data;
    },
  });
};