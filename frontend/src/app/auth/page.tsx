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
const countryFallbackData: Record<string, { phone: string; currencyCode: string }> = {
  KE: { phone: '254', currencyCode: 'KES' },
  AO: { phone: '244', currencyCode: 'AOA' },
  UG: { phone: '256', currencyCode: 'UGX' },
  TZ: { phone: '255', currencyCode: 'TZS' },
  NG: { phone: '234', currencyCode: 'NGN' },
  ZA: { phone: '27',  currencyCode: 'ZAR' },
  US: { phone: '1',   currencyCode: 'USD' },
  GB: { phone: '44',  currencyCode: 'GBP' },
  DZ: { phone: '213', currencyCode: 'DZD' },
  // Your database fallback entries:
  AR: { phone: '54',  currencyCode: 'ARS' },
  AT: { phone: '43',  currencyCode: 'EUR' },
  BD: { phone: '880', currencyCode: 'BDT' },
  BE: { phone: '32',  currencyCode: 'EUR' },
  BO: { phone: '591', currencyCode: 'BOB' },
  BW: { phone: '267', currencyCode: 'BWP' },
  BR: { phone: '55',  currencyCode: 'BRL' },
  BI: { phone: '257', currencyCode: 'BIF' },
  CM: { phone: '237', currencyCode: 'XAF' },
  CA: { phone: '1',   currencyCode: 'CAD' },
  CL: { phone: '56',  currencyCode: 'CLP' },
  CN: { phone: '86',  currencyCode: 'CNY' },
  CO: { phone: '57',  currencyCode: 'COP' },
  CZ: { phone: '420', currencyCode: 'CZK' },
  DK: { phone: '45',  currencyCode: 'DKK' },
  EC: { phone: '593', currencyCode: 'USD' },
  EG: { phone: '20',  currencyCode: 'EGP' },
  ET: { phone: '251', currencyCode: 'ETB' },
  FI: { phone: '358', currencyCode: 'EUR' },
  FR: { phone: '33',  currencyCode: 'EUR' },
  DE: { phone: '49',  currencyCode: 'EUR' },
  GH: { phone: '233', currencyCode: 'GHS' },
  GR: { phone: '30',  currencyCode: 'EUR' },
  HU: { phone: '36',  currencyCode: 'HUF' },
  IN: { phone: '91',  currencyCode: 'INR' },
  ID: { phone: '62',  currencyCode: 'IDR' },
  IE: { phone: '353', currencyCode: 'EUR' },
  IL: { phone: '972', currencyCode: 'ILS' },
  IT: { phone: '39',  currencyCode: 'EUR' },
  CI: { phone: '225', currencyCode: 'XOF' },
  JP: { phone: '81',  currencyCode: 'JPY' },
  KW: { phone: '965', currencyCode: 'KWD' },
  LR: { phone: '231', currencyCode: 'LRD' },
  LY: { phone: '218', currencyCode: 'LYD' },
  MG: { phone: '261', currencyCode: 'MGA' },
  MW: { phone: '265', currencyCode: 'MWK' },
  MY: { phone: '60',  currencyCode: 'MYR' },
  MX: { phone: '52',  currencyCode: 'MXN' },
  MA: { phone: '212', currencyCode: 'MAD' },
  MZ: { phone: '258', currencyCode: 'MZN' },
  NA: { phone: '264', currencyCode: 'NAD' },
  NP: { phone: '977', currencyCode: 'NPR' },
  NL: { phone: '31',  currencyCode: 'EUR' },
  NO: { phone: '47',  currencyCode: 'NOK' },
  PK: { phone: '92',  currencyCode: 'PKR' },
  PY: { phone: '595', currencyCode: 'PYG' },
  PE: { phone: '51',  currencyCode: 'PEN' },
  PH: { phone: '63',  currencyCode: 'PHP' },
  PL: { phone: '48',  currencyCode: 'PLN' },
  PT: { phone: '351', currencyCode: 'EUR' },
  QA: { phone: '974', currencyCode: 'QAR' },
  RO: { phone: '40',  currencyCode: 'RON' },
  RW: { phone: '250', currencyCode: 'RWF' },
  SA: { phone: '966', currencyCode: 'SAR' },
  SN: { phone: '221', currencyCode: 'XOF' },
  SL: { phone: '232', currencyCode: 'SLL' },
  SG: { phone: '65',  currencyCode: 'SGD' },
  SO: { phone: '252', currencyCode: 'SOS' },
  KR: { phone: '82',  currencyCode: 'KRW' },
  SS: { phone: '211', currencyCode: 'SSP' },
  ES: { phone: '34',  currencyCode: 'EUR' },
  LK: { phone: '94',  currencyCode: 'LKR' },
  SD: { phone: '249', currencyCode: 'SDG' },
  SE: { phone: '46',  currencyCode: 'SEK' },
  CH: { phone: '41',  currencyCode: 'CHF' },
  TH: { phone: '66',  currencyCode: 'THB' },
  HN: { phone: '216', currencyCode: 'TND' },
  TR: { phone: '90',  currencyCode: 'TRY' },
  AE: { phone: '971', currencyCode: 'AED' },
  UY: { phone: '598', currencyCode: 'UYU' },
  VN: { phone: '84',  currencyCode: 'VND' },
  ZM: { phone: '260', currencyCode: 'ZMW' },
  ZW: { phone: '263', currencyCode: 'ZWL' }
};
interface Country {
  id: number;
  code: string;
  name: string;
  phone_code: string;
  flag: string;
  default_currency: {
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
  exchange_rate_to_kES: number;
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
  
  const [countries, setCountries] = useState<Country[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  
  // Custom dropdown click-away tracking references
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
  const getFlagEmojiFallback = (countryCode: string) => {
    if (!countryCode) return '🌍';
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    try {
      return String.fromCodePoint(...codePoints);
    } catch {
      return '🌍';
    }
  };
  const [errors, setErrors] = useState<Record<string, string>>({});
  const handleCountrySelection = (country: Country) => {
      const fallback = countryFallbackData[country.code.toUpperCase()];
      
      setFormData(prev => ({
        ...prev,
        countryId: country.id.toString(),
        // Automatically updates phone code formatting, but leaves currency open
        phone: country.phone_code ? `+${country.phone_code}` : (fallback ? `+${fallback.phone}` : prev.phone),
      }));
      
      setShowCountryDropdown(false);
    };

 // Outside click interceptor for custom menus
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
      const [countriesData, currenciesData] = await Promise.all([
        apiClient.get(API_ENDPOINTS.countries.list),
        apiClient.get(API_ENDPOINTS.currencies.list)
      ]);

      setCountries(Array.isArray(countriesData) ? countriesData : []);
      setCurrencies(Array.isArray(currenciesData) ? currenciesData : []);
    } catch (error) {
      console.error('Failed to fetch countries/currencies:', error);
      toast.error('Failed to load countries and currencies');
    } finally {
      setLoadingCountries(false);
    }
  };

  fetchCountriesAndCurrencies();
}, []);
  // Auto fallback to USD if nothing selected (Acts as your baseline safe option)
    useEffect(() => {
      if (!formData.currencyId && currencies.length > 0) {
        const usd = currencies.find(c => c.code === 'USD');
        if (usd) {
          setFormData(prev => ({ ...prev, currencyId: usd.id.toString() }));
        }
      }
      // 💡 REMOVED continuous formData checking here to prevent infinite loop cycles
    }, [currencies.length]);

  // Fix: Corrected property matching path from default_currency_details -> default_currency
  // useEffect(() => {
  //   if (formData.countryId && countries.length > 0) {
  //     const selectedCountry = countries.find(c => c.id === parseInt(formData.countryId));

  //     if (selectedCountry?.default_currency) {
  //       setFormData(prev => ({
  //         ...prev,
  //         currencyId: selectedCountry.default_currency.id.toString()
  //       }));
  //     }
  //   }
  // }, [formData.countryId, countries]);

  // IP Geolocation processing Hook
  useEffect(() => {
      const detectCountry = async () => {
        try {
          const res = await fetch('https://ipapi.co/json/');
          const data = await res.json();
          const country = countries.find(c => c.code.toUpperCase() === data.country_code?.toUpperCase());

          if (country) {
            setFormData(prev => ({
              ...prev,
              countryId: country.id.toString(),
              phone: country.phone_code ? `+${country.phone_code}` : prev.phone
              // ❌ Currency configuration omitted here entirely
            }));
          }
        } catch (err) {
          console.log('Geo detect failed');
        }
      };

      if (countries.length > 0 && !isLogin && !formData.countryId) {
        detectCountry();
      }
      // 💡 Changed dependency target from object instance to array count to prevent re-render re-evaluations
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
        await login(structuralIdentifier, formData.password);
        toast.success('Login successful!');
        router.push('/');
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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <h1 className="text-2xl font-bold text-center">Unibet 360</h1>
            <p className="text-center text-blue-100 mt-2">
              {isLogin ? 'Welcome back to your betting platform' : 'Join the ultimate betting experience'}
            </p>
          </div>

          {/* Form container */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Login/Register Toggle Switch */}
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => !isLogin && toggleMode()}
                  className={`flex-1 py-2 px-4 rounded-md transition-all font-medium text-sm ${
                    isLogin ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => isLogin && toggleMode()}
                  className={`flex-1 py-2 px-4 rounded-md transition-all font-medium text-sm ${
                    !isLogin ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  Register
                </button>
              </div>

              {/* Username Field */}
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.username ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} dark:bg-gray-800 dark:text-white`}
                      placeholder="Choose a username"
                    />
                  </div>
                  {errors.username && <p className="mt-1 text-sm text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.username}</p>}
                </div>
              )}

              {/* Login Strategy Multiplexers */}
              {isLogin && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setLoginType('email')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${loginType === 'email' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'}`}
                  >
                    <Mail className="w-4 h-4" /> Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginType('phone')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${loginType === 'phone' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'}`}
                  >
                    <Phone className="w-4 h-4" /> Phone
                  </button>
                </div>
              )}

              {/* Email Address View Module */}
              {(loginType === 'email' || !isLogin) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} dark:bg-gray-800 dark:text-white`}
                      placeholder="Enter your email"
                    />
                  </div>
                  {errors.email && <p className="mt-1 text-sm text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.email}</p>}
                </div>
              )}

              {/* Phone Input View Module */}
              {(loginType === 'phone' || !isLogin) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} dark:bg-gray-800 dark:text-white`}
                      placeholder="+254712345678"
                    />
                  </div>
                  {errors.phone && <p className="mt-1 text-sm text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.phone}</p>}
                </div>
              )}

              {/* Fix: Country selection dynamic backend string flag parsing */}
              {!isLogin && (
                <div className="relative" ref={countryDropdownRef}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Country</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <button
                      type="button"
                      onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                      className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-left text-sm ${errors.countryId ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} dark:bg-gray-800 dark:text-white`}
                    >
                      {currentSelectedCountry ? (
                        <div className="flex items-center gap-2">
                          <span className="text-base leading-none">{currentSelectedCountry.flag || '🌍'}</span>
                          <span>{currentSelectedCountry.name}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">Select your country</span>
                      )}
                    </button>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  
                  <AnimatePresence>
                    {showCountryDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                      >
                        {loadingCountries ? (
                          <div className="p-4 text-center text-sm text-gray-500">Loading countries...</div>
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
                              className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between dark:text-white"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-base leading-none">{country.flag || '🌍'}</span>
                                <span>{country.name}</span>
                              </div>
                              {country.phone_code && (
                                <span className="text-xs text-gray-400 font-mono">+{country.phone_code}</span>
                              )}
                            </button>
                          ))
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {errors.countryId && <p className="mt-1 text-sm text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.countryId}</p>}
                </div>
              )}

              {/* Preferred Dynamic Currency Component */}
              {!isLogin && (
                <div className="relative" ref={currencyDropdownRef}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preferred Currency</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <button
                      type="button"
                      disabled={!formData.countryId}
                      onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                      className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-left text-sm dark:bg-gray-800 dark:text-white disabled:opacity-60"
                    >
                      {currentSelectedCurrency ? (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-blue-500">{currentSelectedCurrency.symbol}</span>
                          <span>{currentSelectedCurrency.name} ({currentSelectedCurrency.code})</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">{formData.countryId ? 'Select your currency' : 'Select country first'}</span>
                      )}
                    </button>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  
                  <AnimatePresence>
                    {showCurrencyDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
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
                              className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-gray-400 w-5">{currency.symbol}</span>
                                  <span>{currency.name}</span>
                                </div>
                                <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-500">{currency.code}</span>
                              </div>
                            </button>
                          ))
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {formData.countryId && formData.currencyId && (
                    <p className="mt-1 text-xs text-green-500 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Auto-matched regional currency sequence active
                    </p>
                  )}
                </div>
              )}

              {/* Password Fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} dark:bg-gray-800 dark:text-white`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-sm text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.password}</p>}
              </div>

              {/* Confirm Password Field */}
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} dark:bg-gray-800 dark:text-white`}
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="mt-1 text-sm text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.confirmPassword}</p>}
                </div>
              )}

              {/* Submit Buttons */}
              <button
                type="submit"
                disabled={isLoading || (!isLogin && loadingCountries)}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg active:scale-[0.995]"
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

              {/* Reset Password Footer Link */}
              {isLogin && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => toast.error('Password reset feature coming soon!')}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                  >
                    Forgot your password?
                  </button>
                </div>
              )}
            </form>

            {!isLogin && (
              <div className="mt-6 text-xs text-gray-500 dark:text-gray-400 text-center leading-relaxed">
                By creating an account, you agree to our{' '}
                <a href="/terms" className="text-blue-600 hover:text-blue-700 underline">Terms & Conditions</a> and{' '}
                <a href="/privacy" className="text-blue-600 hover:text-blue-700 underline">Privacy Policy</a>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}