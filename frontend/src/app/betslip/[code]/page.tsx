'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import toast from 'react-hot-toast';

// Define this if you have a zustand store managing your active betslip selections.
// If you use a custom context hook like useBetslip(), swap this out!
import { useBetslipStore } from '@/store/betslipStore'; 

export default function LoadSharedBetslipPage() {
  const router = useRouter();
  const { code } = useParams() as { code: string };
  
  // Assuming you have an action to overwrite/hydrate selections inside your frontend slip
  const { setSelections } = useBetslipStore(); 

  useEffect(() => {
    if (!code) return;

    const ingestSharedSlip = async () => {
      try {
        toast.loading('Importing betslip selections...', { id: 'slip-load' });
        
        const response = await apiClient.get(API_ENDPOINTS.betting.loadSharedSlip(code));
        
        if (response && response.selections) {
          // Hydrate your frontend sidebar state with the exact match details from the database
          setSelections(response.selections);
          
          toast.success(`Betslip #${code.toUpperCase()} loaded successfully!`, { id: 'slip-load' });
          
          // Redirect them right back to the sports book grid page
          router.push('/sports'); 
        } else {
          throw new Error('Malformed selection payload returned');
        }
      } catch (error: any) {
        console.error(error);
        toast.error('This betslip code is invalid or has expired.', { id: 'slip-load' });
        router.push('/sports');
      }
    };

    ingestSharedSlip();
  }, [code, router, setSelections]);

  return (
    <div className="min-h-screen bg-[#070a12] flex flex-col items-center justify-center text-slate-400">
      <div className="w-12 h-12 border-4 border-t-red-500 border-slate-800 rounded-full animate-spin mb-4" />
      <p className="font-mono text-xs uppercase tracking-widest text-slate-500">
        Syncing shared sportsbook profile code: {code?.toUpperCase()}
      </p>
    </div>
  );
}