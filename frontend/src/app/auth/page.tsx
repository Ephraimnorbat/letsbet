'use client';

import { useState, useEffect } from 'react';
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
  
  // Check URL param for mode (login or register)
  const mode = searchParams.get('mode');
  const [isLogin, setIsLogin] = useState(mode !== 'register');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loginType, setLoginType] = useState<'email' | 'phone'>('email');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  
  // Countries and currencies data
  const [countries, setCountries] = useState<Country[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  
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

  // Fetch countries and currencies on component mount
  useEffect(() => {
    fetchCountriesAndCurrencies();
  }, []);

  // Auto-select currency when country changes
  useEffect(() => {
    if (formData.countryId && countries.length > 0) {
      const selectedCountry = countries.find(c => c.id === parseInt(formData.countryId));
      if (selectedCountry && selectedCountry.default_currency) {
        setFormData(prev => ({
          ...prev,
          currencyId: selectedCountry.default_currency.id.toString()
        }));
      }
    }
  }, [formData.countryId, countries]);

  const fetchCountriesAndCurrencies = async () => {
    try {
      const [countriesRes, currenciesRes] = await Promise.all([
        apiClient.get(API_ENDPOINTS.countries.list),
        apiClient.get(API_ENDPOINTS.currencies.list)
      ]);
      
      // Handle response safely
      const countriesData = Array.isArray(countriesRes) ? countriesRes : 
                           countriesRes?.data ? countriesRes.data : 
                           countriesRes?.results ? countriesRes.results : [];
      
      const currenciesData = Array.isArray(currenciesRes) ? currenciesRes : 
                            currenciesRes?.data ? currenciesRes.data : 
                            currenciesRes?.results ? currenciesRes.results : [];
      
      setCountries(countriesData);
      setCurrencies(currenciesData);
    } catch (error) {
      console.error('Failed to fetch countries/currencies:', error);
      toast.error('Failed to load countries and currencies');
    } finally {
      setLoadingCountries(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!isLogin) {
      if (!formData.username) {
        newErrors.username = 'Username is required';
      } else if (formData.username.length < 3) {
        newErrors.username = 'Username must be at least 3 characters';
      }
    }

    if (loginType === 'email' && !formData.email) {
      newErrors.email = 'Email is required';
    } else if (loginType === 'email' && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (loginType === 'phone' && !formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (loginType === 'phone' && !/^\+?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Phone number is invalid';
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
      
      if (!formData.currencyId) {
        newErrors.currencyId = 'Please select your preferred currency';
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
        if (loginType === 'email') {
          await login(formData.email, formData.password);
        } else {
          await login(formData.phone, formData.password);
        }
        toast.success('Login successful!');
        router.push('/');
      } else {
        const registrationData = {
          username: formData.username,
          email: formData.email,
          phone_number: formData.phone,
          password: formData.password,
          confirm_password: formData.confirmPassword,
          country_id: parseInt(formData.countryId),
          preferred_currency_id: parseInt(formData.currencyId)
        };
        
        await register(registrationData);
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

  const getCountryFlag = (countryCode: string) => {
    const flags: Record<string, string> = {
      'KE': '🇰🇪', 'UG': '🇺🇬', 'TZ': '🇹🇿', 'RW': '🇷🇼',
      'US': '🇺🇸', 'GB': '🇬🇧', 'ZA': '🇿🇦', 'NG': '🇳🇬',
      'GH': '🇬🇭', 'FR': '🇫🇷', 'DE': '🇩🇪', 'ES': '🇪🇸',
      'IT': '🇮🇹', 'PT': '🇵🇹', 'CA': '🇨🇦', 'AU': '🇦🇺'
    };
    return flags[countryCode] || '🌍';
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    // Clear form data when switching modes
    setFormData({
      email: '',
      phone: '',
      username: '',
      password: '',
      confirmPassword: '',
      countryId: '',
      currencyId: '',
    });
    setErrors({});
  };

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
            <h1 className="text-2xl font-bold text-center">Let'sBet</h1>
            <p className="text-center text-blue-100 mt-2">
              {isLogin ? 'Welcome back to your betting platform' : 'Join the ultimate betting experience'}
            </p>
          </div>

          {/* Form */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Login/Register Toggle */}
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <button
                  type="button"
                  onClick={toggleMode}
                  className={`flex-1 py-2 px-4 rounded-md transition-all ${
                    isLogin
                      ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={toggleMode}
                  className={`flex-1 py-2 px-4 rounded-md transition-all ${
                    !isLogin
                      ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  Register
                </button>
              </div>

              {/* Username Field (only for register) */}
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.username
                          ? 'border-red-500'
                          : 'border-gray-300 dark:border-gray-600'
                      } dark:bg-gray-800`}
                      placeholder="Choose a username"
                    />
                  </div>
                  {errors.username && (
                    <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.username}
                    </p>
                  )}
                </div>
              )}

              {/* Login Type Toggle (only for login) */}
              {isLogin && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setLoginType('email')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border transition-all ${
                      loginType === 'email'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginType('phone')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border transition-all ${
                      loginType === 'phone'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <Phone className="w-4 h-4" />
                    Phone
                  </button>
                </div>
              )}

              {/* Email Field */}
              {(loginType === 'email' || !isLogin) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.email
                          ? 'border-red-500'
                          : 'border-gray-300 dark:border-gray-600'
                      } dark:bg-gray-800`}
                      placeholder="Enter your email"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.email}
                    </p>
                  )}
                </div>
              )}

              {/* Phone Field */}
              {(loginType === 'phone' || !isLogin) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.phone
                          ? 'border-red-500'
                          : 'border-gray-300 dark:border-gray-600'
                      } dark:bg-gray-800`}
                      placeholder="+254712345678"
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.phone}
                    </p>
                  )}
                </div>
              )}

              {/* Country Selection (only for register) */}
              {!isLogin && (
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Country
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <button
                      type="button"
                      onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                      className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-left ${
                        errors.countryId
                          ? 'border-red-500'
                          : 'border-gray-300 dark:border-gray-600'
                      } dark:bg-gray-800`}
                    >
                      {formData.countryId ? (
                        <div className="flex items-center gap-2">
                          <span>
                            {getCountryFlag(countries.find(c => c.id === parseInt(formData.countryId))?.code || '')}
                          </span>
                          <span>{countries.find(c => c.id === parseInt(formData.countryId))?.name}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">Select your country</span>
                      )}
                    </button>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                  
                  <AnimatePresence>
                    {showCountryDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                      >
                        {loadingCountries ? (
                          <div className="p-4 text-center">Loading...</div>
                        ) : countries.length === 0 ? (
                          <div className="p-4 text-center">No countries available</div>
                        ) : (
                          countries.map((country) => (
                            <button
                              key={country.id}
                              type="button"
                              onClick={() => {
                                handleInputChange('countryId', country.id.toString());
                                setShowCountryDropdown(false);
                              }}
                              className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                            >
                              <span>{getCountryFlag(country.code)}</span>
                              <span>{country.name}</span>
                              {country.phone_code && (
                                <span className="text-xs text-gray-500">+{country.phone_code}</span>
                              )}
                            </button>
                          ))
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {errors.countryId && (
                    <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.countryId}
                    </p>
                  )}
                </div>
              )}

              {/* Currency Selection (only for register) */}
              {!isLogin && (
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Preferred Currency
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <button
                      type="button"
                      onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                      className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-left ${
                        errors.currencyId
                          ? 'border-red-500'
                          : 'border-gray-300 dark:border-gray-600'
                      } dark:bg-gray-800`}
                      disabled={!formData.countryId}
                    >
                      {formData.currencyId ? (
                        <div className="flex items-center gap-2">
                          <span>{currencies.find(c => c.id === parseInt(formData.currencyId))?.symbol}</span>
                          <span>{currencies.find(c => c.id === parseInt(formData.currencyId))?.name}</span>
                          <span className="text-xs text-gray-500">
                            ({currencies.find(c => c.id === parseInt(formData.currencyId))?.code})
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">
                          {formData.countryId ? 'Select your currency' : 'Select country first'}
                        </span>
                      )}
                    </button>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                  
                  <AnimatePresence>
                    {showCurrencyDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                      >
                        {currencies.length === 0 ? (
                          <div className="p-4 text-center">No currencies available</div>
                        ) : (
                          currencies.map((currency) => (
                            <button
                              key={currency.id}
                              type="button"
                              onClick={() => {
                                handleInputChange('currencyId', currency.id.toString());
                                setShowCurrencyDropdown(false);
                              }}
                              className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-medium">{currency.symbol}</span>
                                  <span className="ml-2">{currency.name}</span>
                                </div>
                                <span className="text-xs text-gray-500">{currency.code}</span>
                              </div>
                            </button>
                          ))
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {errors.currencyId && (
                    <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.currencyId}
                    </p>
                  )}
                  
                  {formData.countryId && !formData.currencyId && countries.length > 0 && (
                    <p className="mt-1 text-xs text-blue-500">
                      Recommended: {countries.find(c => c.id === parseInt(formData.countryId))?.default_currency?.code}
                    </p>
                  )}
                </div>
              )}

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.password
                        ? 'border-red-500'
                        : 'border-gray-300 dark:border-gray-600'
                    } dark:bg-gray-800`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password Field (only for register) */}
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.confirmPassword
                          ? 'border-red-500'
                          : 'border-gray-300 dark:border-gray-600'
                      } dark:bg-gray-800`}
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || (!isLogin && loadingCountries)}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    {isLogin ? 'Logging in...' : 'Creating account...'}
                  </>
                ) : (
                  <>
                    {isLogin ? 'Login' : 'Create Account'}
                  </>
                )}
              </button>

              {/* Forgot Password (only for login) */}
              {isLogin && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => toast.error('Password reset feature coming soon!')}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    Forgot your password?
                  </button>
                </div>
              )}
            </form>

            {/* Terms and Conditions (only for register) */}
            {!isLogin && (
              <div className="mt-6 text-xs text-gray-600 dark:text-gray-400 text-center">
                By creating an account, you agree to our{' '}
                <a href="/terms" className="text-blue-600 hover:text-blue-700">
                  Terms & Conditions
                </a>{' '}
                and{' '}
                <a href="/privacy" className="text-blue-600 hover:text-blue-700">
                  Privacy Policy
                </a>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}