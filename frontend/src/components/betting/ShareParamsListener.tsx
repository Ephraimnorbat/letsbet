'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { useBettingStore } from '@/store/bettingStore';
import toast from 'react-hot-toast';

export default function ShareParamsListener() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { loadSharedSelections } = useBettingStore();

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) return;

    const fetchBookingPayload = async () => {
      try {
        toast.loading(`Importing booking parameters: ${code.toUpperCase()}...`, { id: 'import-loader' });
        
        // Connects to RetrieveSharedBetslipView on the Django side
        const response = await apiClient.get(`/betting/betslip/load/${code}/`);
        
        if (response && response.selections) {
          loadSharedSelections(response.selections);
          toast.success('Betslip loaded successfully!', { id: 'import-loader' });
          
          // Clear query params elegantly from screen view
          router.replace('/');
        }
      } catch (err) {
        toast.error('The code shared has expired or is invalid.', { id: 'import-loader' });
      }
    };

    fetchBookingPayload();
  }, [searchParams, loadSharedSelections, router]);

  return null;
}