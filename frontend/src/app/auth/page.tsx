'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, EyeOff, Mail, Phone, Lock, User, AlertCircle, 
  Globe, DollarSign, CheckCircle, ChevronDown 
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import toast from 'react-hot-toast';

interface Country {
  id: number;
  code: string;
  name: string;
  phone_code: string;
  flag: string;
  default_currency?: {
    id: number;
    code: string;
    name: string;
    symbol: string;
  };
}

interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  exchange_rate_to_KES?: number;
}

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, register, isLoading } = useAuthStore();
  
  const mode = searchParams.get('mode');
  const [isLogin, setIsLogin] = useState(mode !== 'register');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loginType, setLoginType] = useState<'email' | 'phone'>('email');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  
  // 🚀 Local flag to lock the global auth routing logic during dynamic login sequences
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  const [countries, setCountries] = useState<Country[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  
  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const currencyDropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    username: '',
    password: '',
    confirmPassword: '',
    countryId: '',
    currencyId: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Global identity check hook safely wrapped against timing collisions
  useEffect(() => {
    if (isRedirecting) return;

    const { user, isAuthenticated } = useAuthStore.getState();
    if (isAuthenticated && user) {
      if (user.is_superuser || user.is_staff) {
        router.push('/uni/admin');
      } else {
        router.push('/');
      }
    }
  }, [isRedirecting, router]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setShowCountryDropdown(false);
      }
      if (currencyDropdownRef.current && !currencyDropdownRef.current.contains(event.target as Node)) {
        setShowCurrencyDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchCountriesAndCurrencies = async () => {
      try {
        const [countriesRes, currenciesRes] = await Promise.all([
          apiClient.get(API_ENDPOINTS.countries.list),
          apiClient.get(API_ENDPOINTS.currencies.list)
        ]);

        const countriesList = Array.isArray(countriesRes) 
          ? countriesRes 
          : (countriesRes && Array.isArray((countriesRes as any).results)) 
            ? (countriesRes as any).results 
            : (countriesRes && Array.isArray((countriesRes as any).data))
              ? (countriesRes as any).data
              : [];

        const currenciesList = Array.isArray(currenciesRes) 
          ? currenciesRes 
          : (currenciesRes && Array.isArray((currenciesRes as any).results)) 
            ? (currenciesRes as any).results 
            : (currenciesRes && Array.isArray((currenciesRes as any).data))
              ? (currenciesRes as any).data
              : [];

        setCountries(countriesList);
        setCurrencies(currenciesList);
      } catch (error) {
        console.error('Failed to fetch structural units:', error);
        toast.error('Failed to load country profiles');
      } finally {
        setLoadingCountries(false);
      }
    };

    fetchCountriesAndCurrencies();
  }, []);

  useEffect(() => {
    if (!formData.currencyId && currencies.length > 0) {
      const usd = currencies.find(c => c.code === 'USD');
      if (usd) {
        setFormData(prev => ({ ...prev, currencyId: usd.id.toString() }));
      }
    }
  }, [currencies.length, formData.currencyId]);

  useEffect(() => {
    const detectCountry = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        const detectedCode = data.country_code?.toUpperCase();
        const country = countries.find(c => c.code.toUpperCase() === detectedCode);

        if (country) {
          setFormData(prev => ({
            ...prev,
            countryId: country.id.toString(),
            phone: country.phone_code ? `+${country.phone_code}` : prev.phone
          }));
        }
      } catch (err) {
        console.log('Geo-targeting localization bypassed');
      }
    };

    if (countries.length > 0 && !isLogin && !formData.countryId) {
      detectCountry();
    }
  }, [countries.length, isLogin, formData.countryId]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!isLogin) {
      if (!formData.username) {
        newErrors.username = 'Username is required';
      } else if (formData.username.length < 3) {
        newErrors.username = 'Username must be at least 3 characters';
      }
    }

    if (loginType === 'email' || !isLogin) {
      if (!formData.email) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Email is invalid';
      }
    }

    if (loginType === 'phone' || !isLogin) {
      if (!formData.phone) {
        newErrors.phone = 'Phone number is required';
      }
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!isLogin) {
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
      if (!formData.countryId) {
        newErrors.countryId = 'Please select your country';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (isLogin) {
        const structuralIdentifier = loginType === 'email' ? formData.email : formData.phone;
        
        // Lock background guards from conflicting with this programmatic transition
        setIsRedirecting(true);

        const authResponse = await login(structuralIdentifier, formData.password);
        toast.success('Login successful!');

        // Extract user metrics seamlessly from newly serialized JSON properties
        const targetUser = (authResponse as any)?.user || useAuthStore.getState().user;        
        if (targetUser?.is_superuser || targetUser?.is_staff) {
          router.push('/uni/admin');
        } else {
          router.push('/');
        }
      } else {
        await register({
          username: formData.username,
          email: formData.email,
          phone_number: formData.phone,
          password: formData.password,
          confirm_password: formData.confirmPassword,
          country_id: parseInt(formData.countryId),
          preferred_currency_id: formData.currencyId ? parseInt(formData.currencyId) : undefined
        });
        toast.success('Registration successful!');
        router.push('/');
      }
    } catch (error: any) {
      setIsRedirecting(false); // Unlock the router scope if user submits invalid credentials
      const errorMsg = error.response?.data?.message || 
                      error.response?.data?.error ||
                      error.message || 
                      'Authentication failed';
      toast.error(errorMsg);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      email: '', phone: '', username: '', password: '', confirmPassword: '', countryId: '', currencyId: '',
    });
    setErrors({});
  };

  const currentSelectedCountry = countries.find(c => c.id === parseInt(formData.countryId));
  const currentSelectedCurrency = currencies.find(c => c.id === parseInt(formData.currencyId));

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 border border-slate-800/80 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header Card Band */}
          <div className="bg-slate-850 border-b border-slate-800/60 p-6 text-white text-center">
            <h1 className="text-2xl font-black tracking-wide uppercase">
              UNIBET <span className="text-blue-500">360</span>
            </h1>
            <p className="text-xs text-gray-400 mt-2">
              {isLogin ? 'Welcome back to your betting platform' : 'Join the ultimate betting experience'}
            </p>
          </div>

          {/* Form Content Area */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Login/Register Toggle Switch */}
              <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800/40">
                <button
                  type="button"
                  onClick={() => !isLogin && toggleMode()}
                  className={`flex-1 py-2 px-4 rounded-md transition-all font-bold text-xs uppercase tracking-wide ${
                    isLogin ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => isLogin && toggleMode()}
                  className={`flex-1 py-2 px-4 rounded-md transition-all font-bold text-xs uppercase tracking-wide ${
                    !isLogin ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Register
                </button>
              </div>

              {/* Username Field */}
              {!isLogin && (
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 tracking-wider mb-1">Username</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-950 text-white ${errors.username ? 'border-red-500' : 'border-slate-800'}`}
                      placeholder="Choose a username"
                    />
                  </div>
                  {errors.username && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.username}</p>}
                </div>
              )}

              {/* Login Strategy Multiplexers */}
              {isLogin && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setLoginType('email')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all ${loginType === 'email' ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-slate-800 bg-slate-950 text-gray-400'}`}
                  >
                    <Mail className="w-4 h-4" /> Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginType('phone')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all ${loginType === 'phone' ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-slate-800 bg-slate-950 text-gray-400'}`}
                  >
                    <Phone className="w-4 h-4" /> Phone
                  </button>
                </div>
              )}

              {/* Email Address */}
              {(loginType === 'email' || !isLogin) && (
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 tracking-wider mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-950 text-white ${errors.email ? 'border-red-500' : 'border-slate-800'}`}
                      placeholder="Enter your email"
                    />
                  </div>
                  {errors.email && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.email}</p>}
                </div>
              )}

              {/* Phone Input */}
              {(loginType === 'phone' || !isLogin) && (
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 tracking-wider mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-950 text-white ${errors.phone ? 'border-red-500' : 'border-slate-800'}`}
                      placeholder="+254712345678"
                    />
                  </div>
                  {errors.phone && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.phone}</p>}
                </div>
              )}

              {/* Country Selection */}
              {!isLogin && (
                <div className="relative" ref={countryDropdownRef}>
                  <label className="block text-xs font-bold uppercase text-gray-400 tracking-wider mb-1">Country</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <button
                      type="button"
                      onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                      className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-left text-sm bg-slate-950 text-white ${errors.countryId ? 'border-red-500' : 'border-slate-800'}`}
                    >
                      {currentSelectedCountry ? (
                        <div className="flex items-center gap-2">
                          <span className="text-base leading-none">{currentSelectedCountry.flag || '🌍'}</span>
                          <span>{currentSelectedCountry.name}</span>
                        </div>
                      ) : (
                        <span className="text-gray-500">Select your country</span>
                      )}
                    </button>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                  
                  <AnimatePresence>
                    {showCountryDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-50 mt-1 w-full bg-slate-900 border border-slate-800 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                      >
                        {loadingCountries ? (
                          <div className="p-4 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                            <LoadingSpinner size="sm" /> Fetching territories...
                          </div>
                        ) : countries.length === 0 ? (
                          <div className="p-4 text-center text-sm text-gray-500">No countries available</div>
                        ) : (
                          countries.map((country) => (
                            <button
                              key={country.id}
                              type="button"
                              onClick={() => {
                                handleInputChange('countryId', country.id.toString());
                                if (country.phone_code) {
                                  handleInputChange('phone', `+${country.phone_code}`);
                                }
                                setShowCountryDropdown(false);
                              }}
                              className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-800 flex items-center justify-between text-white"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-base leading-none">{country.flag || '🌍'}</span>
                                <span>{country.name}</span>
                              </div>
                              {country.phone_code && (
                                <span className="text-xs text-gray-500 font-mono">+{country.phone_code}</span>
                              )}
                            </button>
                          ))
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {errors.countryId && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.countryId}</p>}
                </div>
              )}

              {/* Preferred Currency Selector */}
              {!isLogin && (
                <div className="relative" ref={currencyDropdownRef}>
                  <label className="block text-xs font-bold uppercase text-gray-400 tracking-wider mb-1">Preferred Currency</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <button
                      type="button"
                      disabled={!formData.countryId}
                      onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                      className="w-full pl-10 pr-10 py-2 border border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-left text-sm bg-slate-950 text-white disabled:opacity-40"
                    >
                      {currentSelectedCurrency ? (
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-blue-500">{currentSelectedCurrency.symbol}</span>
                          <span>{currentSelectedCurrency.name} ({currentSelectedCurrency.code})</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">{formData.countryId ? 'Select your currency' : 'Select country first'}</span>
                      )}
                    </button>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                  
                  <AnimatePresence>
                    {showCurrencyDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-50 mt-1 w-full bg-slate-900 border border-slate-800 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                      >
                        {currencies.length === 0 ? (
                          <div className="p-4 text-center text-sm text-gray-500">No currencies available</div>
                        ) : (
                          currencies.map((currency) => (
                            <button
                              key={currency.id}
                              type="button"
                              onClick={() => {
                                handleInputChange('currencyId', currency.id.toString());
                                setShowCurrencyDropdown(false);
                              }}
                              className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-800 text-white"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-blue-500 w-5">{currency.symbol}</span>
                                  <span>{currency.name}</span>
                                </div>
                                <span className="text-xs font-mono bg-slate-950 px-1.5 py-0.5 rounded text-gray-400">{currency.code}</span>
                              </div>
                            </button>
                          ))
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {formData.countryId && formData.currencyId && (
                    <p className="mt-1 text-[11px] text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Auto-matched regional currency sequence active
                    </p>
                  )}
                </div>
              )}

              {/* Password Fields */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 tracking-wider mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-950 text-white ${errors.password ? 'border-red-500' : 'border-slate-800'}`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.password}</p>}
              </div>

              {/* Confirm Password Field */}
              {!isLogin && (
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 tracking-wider mb-1">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-950 text-white ${errors.confirmPassword ? 'border-red-500' : 'border-slate-800'}`}
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 focus:outline-none"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.confirmPassword}</p>}
                </div>
              )}

              {/* Submission Action Button */}
              <button
                type="submit"
                disabled={isLoading || (!isLogin && loadingCountries)}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase text-xs tracking-wider py-3 px-4 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-blue-950/50"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    {isLogin ? 'Logging in...' : 'Creating account...'}
                  </>
                ) : (
                  <>{isLogin ? 'Login' : 'Create Account'}</>
                )}
              </button>

              {/* Forgot Password Link */}
              {isLogin && (
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => toast.error('Password reset feature coming soon!')}
                    className="text-blue-500 hover:text-blue-400 text-xs font-bold uppercase tracking-wider transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}