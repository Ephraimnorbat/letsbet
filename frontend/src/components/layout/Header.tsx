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
  const { user, logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [currencySymbol, setCurrencySymbol] = useState<string>('KSh');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch wallet balance when user is logged in
  useEffect(() => {
    if (user && user.id) {
      fetchWalletBalance();
      
      // Set currency symbol from user's preferred currency
      if (user.preferred_currency?.symbol) {
        setCurrencySymbol(user.preferred_currency.symbol);
      } else if (user.currency_symbol) {
        setCurrencySymbol(user.currency_symbol);
      }
      
      // Refresh wallet balance every 30 seconds
      const interval = setInterval(fetchWalletBalance, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchWalletBalance = async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.wallet.balance);
      setWalletBalance(response.balance);
    } catch (error) {
      console.error('Failed to fetch wallet balance:', error);
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

  // Safely get user display name
  const getUserDisplayName = () => {
    if (!user) return '';
    return user.username || user.email?.split('@')[0] || 'User';
  };

  // Safely get user initial
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
          : 'bg-gradient-to-r from-slate-900 to-slate-800'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
            <Link href="/" className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200" />
              <span className="relative text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                LETSBET
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
                  item.active
                    ? 'text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                {item.active && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg"
                    transition={{ type: "spring", duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 text-sm font-medium">{item.name}</span>
              </Link>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg hover:bg-slate-800 transition"
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
            
            <ThemeToggle />

            {user ? (
              <>
                {/* Wallet Section */}
                <Link href="/wallet">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="hidden md:flex items-center space-x-2 px-3 py-2 rounded-lg bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 hover:border-green-500/50 transition-all cursor-pointer"
                  >
                    <Wallet className="w-4 h-4 text-green-400" />
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400">Balance</span>
                      <span className="text-sm font-bold text-green-400">
                        {currencySymbol}{walletBalance !== null ? walletBalance.toFixed(2) : '0.00'}
                      </span>
                    </div>
                  </motion.div>
                </Link>

                {/* User Menu */}
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-slate-800 transition"
                  >
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center font-semibold">
                        {getUserInitial()}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900" />
                    </div>
                    <div className="hidden md:block text-left">
                      <div className="text-sm font-medium">{getUserDisplayName()}</div>
                      <div className="text-xs text-gray-400">{user.preferred_currency?.code || 'KES'}</div>
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
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center font-semibold text-lg">
                              {getUserInitial()}
                            </div>
                            <div>
                              <div className="font-medium">{getUserDisplayName()}</div>
                              <div className="text-xs text-gray-400">{user.email}</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-2 space-y-1">
                          <Link href="/profile" className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-slate-700 transition">
                            <User className="w-4 h-4" />
                            <span className="text-sm">Profile</span>
                          </Link>
                          <Link href="/wallet" className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-slate-700 transition">
                            <Wallet className="w-4 h-4" />
                            <span className="text-sm">Wallet</span>
                            {walletBalance !== null && (
                              <span className="ml-auto text-xs text-green-400">
                                {currencySymbol}{walletBalance.toFixed(2)}
                              </span>
                            )}
                          </Link>
                          <Link href="/settings" className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-slate-700 transition">
                            <Settings className="w-4 h-4" />
                            <span className="text-sm">Settings</span>
                          </Link>
                          <Link href="/promotions" className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-slate-700 transition">
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
              <div className="flex items-center space-x-2">
                <Link
                  href="/auth"
                  className="px-4 py-2 rounded-lg hover:bg-slate-800 transition text-sm"
                >
                  Sign In
                </Link>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    href="/auth?mode=register"
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:shadow-lg transition text-sm font-medium"
                  >
                    Sign Up
                  </Link>
                </motion.div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Wallet Bar (visible only on mobile when logged in) */}
      {user && (
        <div className="lg:hidden bg-slate-800/50 backdrop-blur-sm border-t border-slate-700/50">
          <div className="container mx-auto px-4 py-2">
            <Link href="/wallet" className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Wallet className="w-4 h-4 text-green-400" />
                <span className="text-sm text-gray-300">Wallet Balance</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-green-400">
                  {currencySymbol}{walletBalance !== null ? walletBalance.toFixed(2) : '0.00'}
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