'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Trophy, 
  Wallet, 
  History, 
  Settings, 
  HelpCircle,
  ChevronDown,
  Users,
  Gamepad2,
  Dice6,
  CircleDollarSign,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Activity
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const mainNav = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'All Products', href: '/products', icon: Gamepad2 },
  { name: 'Sport', href: '/sports', icon: Trophy },
  { name: 'Live Sport', href: '/live-sport', icon: CircleDollarSign },
  { name: 'Result', href: '/results', icon: History },
];

// Mapped to your actual API keys from the curl output
const sportsNav = [
  { name: 'Football (EPL)', slug: 'soccer_epl' },
  { name: 'Champions League', slug: 'soccer_uefa_champs_league' },
  { name: 'NBA Basketball', slug: 'basketball_nba' },
  { name: 'MMA / UFC', slug: 'mma_mixed_martial_arts' },
  { name: 'Boxing', slug: 'boxing_boxing' },
  { name: 'Handball', slug: 'handball_germany_bundesliga' },
  { name: 'Tennis', slug: 'tennis_atp_madrid_open' },
  { name: 'MLB Baseball', slug: 'baseball_mlb' },
  { name: 'NHL Hockey', slug: 'icehockey_nhl' },
  { name: 'Cricket (IPL)', slug: 'cricket_ipl' },
];

const casinoNav = [
  { name: 'Casino', href: '/casino', icon: Gamepad2 },
  { name: 'Live casino', href: '/live-casino', icon: Dice6 },
  { name: 'JetX', href: '/casino/jetx', icon: Activity },
  { name: 'Bingo', href: '/casino/bingo', icon: Dice6 },
];

const footerNav = [
  { name: 'My bets', href: '/my-bets', icon: History },
  { name: 'Support Chat', href: '/support', icon: HelpCircle },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile?: boolean;
}

export default function Sidebar({ isOpen, onClose, isMobile = false }: SidebarProps) {
  const pathname = usePathname();
  const [showAllSports, setShowAllSports] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const displayedSports = showAllSports ? sportsNav : sportsNav.slice(0, 6);

  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState !== null) {
      setIsCollapsed(JSON.parse(savedState));
    }
  }, []);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
  };

  const sidebarContent = (
    <div className={`h-full bg-slate-800 text-slate-200 flex flex-col transition-all duration-300 ${
      isCollapsed && !isMobile ? 'w-20' : 'w-64'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        {(!isCollapsed || isMobile) && (
          <motion.h2 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent"
          >
            UNIBET 360
          </motion.h2>
        )}
        <button
          onClick={isMobile ? onClose : toggleCollapse}
          className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
        >
          {isMobile ? <X className="w-5 h-5" /> : isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        {/* Main Links */}
        <div className="space-y-1 px-3">
          {mainNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <motion.div key={item.name} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href={item.href}
                  onClick={isMobile ? onClose : undefined}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 group relative ${
                    isActive ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {(!isCollapsed || isMobile) && <span className="text-sm font-medium">{item.name}</span>}
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Sports Section - FIXED LOGIC HERE */}
        <div className="mt-6">
          <div className="px-3 py-2">
            {(!isCollapsed || isMobile) && <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sports</h3>}
          </div>
          <div className="space-y-1 px-3">
            {displayedSports.map((sport) => (
              <motion.div key={sport.slug} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href={`/sport/${sport.slug}`}
                  onClick={isMobile ? onClose : undefined}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-all duration-200 group relative"
                >
                  <div className="w-2 h-2 rounded-full bg-slate-500 group-hover:bg-blue-500" />
                  {(!isCollapsed || isMobile) && <span className="text-sm">{sport.name}</span>}
                </Link>
              </motion.div>
            ))}
            {sportsNav.length > 6 && (
              <button
                onClick={() => setShowAllSports(!showAllSports)}
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-700 w-full"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${showAllSports ? 'rotate-180' : ''}`} />
                {(!isCollapsed || isMobile) && <span className="text-sm">{showAllSports ? 'Show Less' : 'Show More'}</span>}
              </button>
            )}
          </div>
        </div>

        {/* Casino Section */}
        <div className="mt-6">
          <div className="px-3 py-2">
            {(!isCollapsed || isMobile) && <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Casino</h3>}
          </div>
          <div className="space-y-1 px-3">
            {casinoNav.map((item) => {
              const Icon = item.icon;
              return (
                <motion.div key={item.name} whileHover={{ scale: 1.02 }}>
                  <Link href={item.href} className="flex items-center space-x-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-700">
                    <Icon className="w-5 h-5" />
                    {(!isCollapsed || isMobile) && <span className="text-sm">{item.name}</span>}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Footer Nav */}
      <div className="border-t border-slate-700 p-3">
        {footerNav.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.name} href={item.href} className="flex items-center space-x-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-700">
              <Icon className="w-5 h-5" />
              {(!isCollapsed || isMobile) && <span className="text-sm">{item.name}</span>}
            </Link>
          );
        })}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
            <motion.div initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} className="fixed left-0 top-0 h-full z-50">{sidebarContent}</motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  return sidebarContent;
}