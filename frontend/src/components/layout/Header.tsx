'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Menu, Search, Globe, ChevronDown, User, LogOut, Settings, 
  Wallet, MenuIcon, Bell, Gift, Sparkles, DollarSign 
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

interface HeaderProps {
  onMenuToggle?: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const pathname = usePathname();
  const authStore = useAuthStore();
  
  const user = authStore?.user as any;
  const logout = authStore?.logout;

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  const [currencySymbol, setCurrencySymbol] = useState<string>('');
  const [currencyCode, setCurrencyCode] = useState<string>('');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

useEffect(() => {
    if (user) {
      // 🚀 Match the flat payload keys returned by your LoginView response structure
      const symbol = user.currency_symbol || '';
      const code = user.currency_code || '';
      
      setCurrencySymbol(symbol);
      setCurrencyCode(code);
    }
  }, [user]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    
    if (user && user.id && token) {
      fetchWalletBalance();
      
      const interval = setInterval(fetchWalletBalance, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const [isFetching, setIsFetching] = useState(false);
  const fetchWalletBalance = async () => {
    if (isFetching || !user) return; 

    setIsFetching(true);
    try {
      const response = await apiClient.get(API_ENDPOINTS.wallet.balance);
      const resData = (response as any)?.data || response;
      const freshBalance = resData?.balance !== undefined ? resData.balance : null;
      
      setWalletBalance(freshBalance);
    } catch (error) {
      if (error === 'AUTH_EXPIRED') return;
      if ((error as any).status === 429) {
        console.warn("Throttled by server. Slowing down...");
      }
    } finally {
      setIsFetching(false);
    }
  };

  const navItems = [
    { name: 'Home', href: '/', active: pathname === '/' },
    { name: 'Live Matches', href: '/live-matches', active: pathname === '/live-matches' },
    { name: 'Sports', href: '/sports', active: pathname === '/sports' },
    { name: 'Betting', href: '/betting', active: pathname === '/betting' },
    { name: 'Live Casino', href: '/live-casino', active: pathname === '/live-casino' },
    { name: 'Results', href: '/results', active: pathname === '/results' },
  ];

  const getUserDisplayName = () => {
    if (!user) return '';
    return user.username || user.email?.split('@')[0] || 'User';
  };

  const getUserInitial = () => {
    const displayName = getUserDisplayName();
    return displayName.charAt(0).toUpperCase();
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled 
          ? 'bg-slate-900/95 backdrop-blur-xl shadow-lg' 
          : 'bg-slate-900 border-b border-slate-800/40'
      }`}
    >
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
            <button
              onClick={onMenuToggle}
              className="p-2 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
            >
              <MenuIcon className="w-5 h-5 text-gray-100" />
            </button>
            <Link href="/" className="relative group shrink-0">
              <span className="relative text-lg sm:text-2xl font-black text-white tracking-wide">
                UNIBET <span className="text-blue-500">360</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`relative px-4 py-2 rounded-lg transition-all duration-300 ${
                  item.active ? 'text-white' : 'text-gray-300 hover:text-white'
                }`}
              >
                {item.active && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 bg-slate-800 rounded-lg"
                    transition={{ type: "spring", duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 text-sm font-medium">{item.name}</span>
              </Link>
            ))}
          </div>

          {/* Right Functional Utilities Section */}
          <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="hidden sm:flex p-2 rounded-lg hover:bg-slate-800 transition"
            >
              <Search className="w-5 h-5" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg hover:bg-slate-800 transition relative"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            </motion.button>
            
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>

            {user ? (
              <>
                {/* Desktop Wallet Balance Display */}
                <Link href="/wallet">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="hidden md:flex items-center space-x-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20 hover:border-green-500/40 transition-all cursor-pointer"
                  >
                    <Wallet className="w-4 h-4 text-green-400" />
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400">Balance</span>
                      <span className="text-sm font-bold text-green-400" dir="ltr">
                        {currencySymbol ? `${currencySymbol} ` : ''}{walletBalance !== null ? Number(walletBalance).toFixed(2) : '0.00'}
                      </span>
                    </div>
                  </motion.div>
                </Link>

                {/* Authenticated User Profile Menu */}
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 px-2 sm:px-3 py-2 rounded-lg hover:bg-slate-800 transition"
                  >
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-semibold text-white">
                        {getUserInitial()}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-slate-900" />
                    </div>
                    <div className="hidden md:block text-left">
                      <div className="text-sm font-medium">{getUserDisplayName()}</div>
                      {currencyCode && (
                        <div className="text-xs text-gray-400 font-mono font-semibold uppercase">{currencyCode}</div>
                      )}
                    </div>
                    <ChevronDown className="w-4 h-4 hidden md:block" />
                  </motion.button>
                  
                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-64 bg-slate-800 rounded-xl shadow-xl overflow-hidden border border-slate-700"
                      >
                        <div className="p-3 border-b border-slate-700">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-semibold text-lg text-white">
                              {getUserInitial()}
                            </div>
                            <div>
                              <div className="font-medium text-white">{getUserDisplayName()}</div>
                              <div className="text-xs text-gray-400">{user.email}</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-2 space-y-1">
                          <Link href="/profile" className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-slate-700 transition text-gray-200">
                            <User className="w-4 h-4" />
                            <span className="text-sm">Profile</span>
                          </Link>
                          <Link href="/wallet" className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-slate-700 transition text-gray-200">
                            <Wallet className="w-4 h-4" />
                            <span className="text-sm">Wallet</span>
                            {walletBalance !== null && (
                              <span className="ml-auto text-xs text-green-400 font-mono" dir="ltr">
                                {currencySymbol ? `${currencySymbol} ` : ''}{Number(walletBalance).toFixed(2)}
                              </span>
                            )}
                          </Link>
                          <Link href="/settings" className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-slate-700 transition text-gray-200">
                            <Settings className="w-4 h-4" />
                            <span className="text-sm">Settings</span>
                          </Link>
                          <Link href="/promotions" className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-slate-700 transition text-gray-200">
                            <Gift className="w-4 h-4" />
                            <span className="text-sm">Promotions</span>
                          </Link>
                          <div className="border-t border-slate-700 my-1" />
                          <button
                            onClick={() => logout()}
                            className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-red-500/10 transition w-full text-left text-red-400"
                          >
                            <LogOut className="w-4 h-4" />
                            <span className="text-sm">Logout</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              /* Anonymous/Guest Navigation Action Buttons */
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Link
                  href="/auth"
                  className="px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-gray-200 hover:bg-slate-800 rounded-lg transition"
                >
                  Sign In
                </Link>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    href="/auth?mode=register"
                    className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-md transition"
                  >
                    Join
                  </Link>
                </motion.div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Wallet Bar Display */}
      {user && (
        <div className="lg:hidden bg-slate-800/50 backdrop-blur-sm border-t border-slate-700/50">
          <div className="container mx-auto px-4 py-2">
            <Link href="/wallet" className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Wallet className="w-4 h-4 text-green-400" />
                <span className="text-sm text-gray-300">Wallet Balance</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-green-400" dir="ltr">
                  {currencySymbol ? `${currencySymbol} ` : ''}{walletBalance !== null ? Number(walletBalance).toFixed(2) : '0.00'}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            </Link>
          </div>
        </div>
      )}
    </motion.header>
  );
}