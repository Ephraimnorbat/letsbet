'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { useAuthStore } from '@/store/authStore';
import { History } from 'lucide-react';
export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  
  const isActive = (path: string) => pathname === path;
  
  return (
    <nav className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 shadow-md z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            Lets Bet
          </Link>
          
          <div className="hidden md:flex space-x-6">
            <Link 
              href="/live-matches" 
              className={`${isActive('/live-matches') ? 'text-blue-500' : 'text-gray-700 dark:text-gray-300'} hover:text-blue-500 transition`}
            >
              Live Matches
            </Link>
            <Link 
              href="/my-bets" 
              className={`${isActive('/my-bets') ? 'text-blue-500' : 'text-gray-700 dark:text-gray-300'} hover:text-blue-500 transition`}
            >
              My Bets
            </Link>
            <Link 
              href="/leaderboard" 
              className={`${isActive('/leaderboard') ? 'text-blue-500' : 'text-gray-700 dark:text-gray-300'} hover:text-blue-500 transition`}
            >
              Leaderboard
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            
            {user ? (
              <div className="relative group">
                <button className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                    {user.username[0].toUpperCase()}
                  </div>
                  <span className="hidden md:inline text-gray-700 dark:text-gray-300">
                    {user.username}
                  </span>
                </button>
                
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    
                    <Link 
                      href="/profile" 
                      className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Profile
                    </Link>

                    <Link 
                      href="/my-bets" 
                      className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <History className="w-4 h-4" />
                      <span>My Bets</span>
                    </Link>

                    <Link 
                      href="/wallet" 
                      className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Wallet
                    </Link>

                    <button
                      onClick={() => logout()}
                      className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Logout
                    </button>

                  </div>
                </div>
             
            ) : (
              <Link 
                href="/login" 
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}