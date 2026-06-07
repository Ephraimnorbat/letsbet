'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

interface VerifyPageProps {
  params: Promise<{
    uidb64: string;
    token: string;
  }>;
}

export default function VerifyEmailPage({ params }: VerifyPageProps) {
  const resolvedParams = use(params);
  const { uidb64, token } = resolvedParams;

  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email registration...');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // ✅ Clean & Native: Type-safe lookup directly into your config properties
        const endpoint = API_ENDPOINTS.auth.verify; 
        
        const response = await apiClient.post(endpoint, {
          uidb64: uidb64,
          token: token,
        });

        setStatus('success');
        setMessage('Your email account has been successfully verified!');
        
        setTimeout(() => {
          router.push('/auth?mode=login');
        }, 4000);
      } catch (error: any) {
        setStatus('error');
        
        const serverError = error.response?.data?.error || error.response?.data?.detail;
        
        setStatus('error');
        setMessage(
          serverError || 
          'The verification link is invalid, expired, or has already been used.'
        );
      }
    };

    if (uidb64 && token) {
      verifyEmail();
    }
  }, [uidb64, token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="max-w-md w-full bg-gray-800 border border-gray-700 p-8 rounded-2xl shadow-xl text-center text-white">
        
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            <h2 className="text-xl font-semibold">Verifying Email</h2>
            <p className="text-gray-400 text-sm">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-4">
            <CheckCircle className="w-14 h-14 text-emerald-500" />
            <h2 className="text-2xl font-bold text-emerald-400">Success!</h2>
            <p className="text-gray-300 text-sm">{message}</p>
            <p className="text-xs text-gray-500 animate-pulse mt-2">Redirecting you to login...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-4">
            <XCircle className="w-14 h-14 text-rose-500" />
            <h2 className="text-2xl font-bold text-rose-400">Verification Failed</h2>
            <p className="text-gray-300 text-sm">{message}</p>
            <Link 
              href="/auth?mode=register" 
              className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 transition rounded-lg text-sm font-medium"
            >
              Back to Registration
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}