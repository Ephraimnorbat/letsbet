'use client';

import React, { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import toast from 'react-hot-toast';

interface ResetPasswordPageProps {
  params: Promise<{
    uidb64: string;
    token: string;
  }>;
}

export default function ResetPasswordPage({ params }: ResetPasswordPageProps) {
  const resolvedParams = use(params);
  const { uidb64, token } = resolvedParams;

  const router = useRouter();
  const [status, setStatus] = useState<'form' | 'submitting' | 'success'>('form');
  const [errorMessage, setErrorMessage] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.newPassword) {
      newErrors.newPassword = 'Password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }

    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setStatus('submitting');
    setErrorMessage('');

    try {
      await apiClient.post(API_ENDPOINTS.auth.passwordResetConfirm, {
        uidb64,
        token,
        new_password: formData.newPassword,
        confirm_password: formData.confirmPassword,
      });

      setStatus('success');
      toast.success('Password reset successfully!');
      
      setTimeout(() => {
        router.push('/auth?mode=login');
      }, 4000);
    } catch (error: any) {
      setStatus('form');
      const serverError = 
        error.response?.data?.token || 
        error.response?.data?.error || 
        error.response?.data?.non_field_errors ||
        'Something went wrong. The link might be expired.';
      
      const parsedError = typeof serverError === 'string' ? serverError : 'Validation failed.';
      toast.error(parsedError);
      setErrorMessage(parsedError);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl shadow-2xl overflow-hidden p-8 text-white">
          
          {status === 'success' && (
            <div className="flex flex-col items-center gap-4 text-center py-4">
              <CheckCircle className="w-14 h-14 text-emerald-500" />
              <h2 className="text-2xl font-bold text-emerald-400">Password Reset!</h2>
              <p className="text-slate-400 text-sm">Your password has been successfully updated.</p>
              <p className="text-xs text-slate-500 animate-pulse mt-2">Redirecting to login sequence...</p>
            </div>
          )}

          {(status === 'form' || status === 'submitting') && (
            <>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-black tracking-wide uppercase mb-2">
                  UNIBET <span className="text-blue-500">360</span>
                </h1>
                <h2 className="text-lg font-bold text-slate-200">Set New Password</h2>
                <p className="text-xs text-slate-400 mt-1">Please enter your new secure password below.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New Password Input */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={formData.newPassword}
                      onChange={(e) => handleInputChange('newPassword', e.target.value)}
                      className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-950 text-white ${errors.newPassword ? 'border-red-500' : 'border-slate-800'}`}
                      placeholder="••••••••"
                      disabled={status === 'submitting'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="text-xs text-red-500 mt-1 pl-1">{errors.newPassword}</p>
                  )}
                </div>

                {/* Confirm Password Input */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-950 text-white ${errors.confirmPassword ? 'border-red-500' : 'border-slate-800'}`}
                      placeholder="••••••••"
                      disabled={status === 'submitting'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1 pl-1">{errors.confirmPassword}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase text-xs tracking-wider py-3 px-4 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-blue-950/50"
                >
                  {status === 'submitting' ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Updating password...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </form>
            </>
          )}

          {errorMessage && (
            <div className="mt-6 p-4 bg-red-950/40 border border-red-900/60 rounded-xl flex flex-col items-center gap-2 text-center">
              <XCircle className="w-6 h-6 text-red-500" />
              <p className="text-xs text-red-300 font-medium">{errorMessage}</p>
              <Link 
                href="/auth?mode=login" 
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors underline mt-1"
              >
                Request a new reset link
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}