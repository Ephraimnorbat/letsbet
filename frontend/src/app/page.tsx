'use client';

import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp, Zap, Shield, Gift } from 'lucide-react';
import Link from 'next/link';
import LiveMatchesSection from '@/components/home/LiveMatchesSection';
import FeaturedSports from '@/components/home/FeaturedSports';
import UpcomingMatches from '@/components/home/UpcomingMatches';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 -mt-8 -mx-4 px-4 py-16 mb-8"
      >
        <div className="container mx-auto">
          <div className="flex flex-col items-center text-center">
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-4xl md:text-5xl font-bold mb-4"
            >
              Welcome to LETSBET
            </motion.h1>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-xl opacity-90 mb-8"
            >
              Experience the thrill of live sports betting
            </motion.p>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex space-x-4"
            >
              <Link
                href="/register"
                className="px-6 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition flex items-center space-x-2"
              >
                <span>Start Betting</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/live-sport"
                className="px-6 py-3 bg-transparent border border-white rounded-lg font-semibold hover:bg-white/10 transition"
              >
                Live Matches
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <div className="space-y-12">
        {/* Featured Sports */}
        <FeaturedSports />

        {/* Live Matches Section */}
        <LiveMatchesSection />

        {/* Upcoming Matches */}
        <UpcomingMatches />

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-slate-800 rounded-lg p-6 text-center hover:bg-slate-700 transition-all hover:transform hover:scale-105">
            <Zap className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Instant Bets</h3>
            <p className="text-sm text-gray-400">Place bets in seconds</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-6 text-center hover:bg-slate-700 transition-all hover:transform hover:scale-105">
            <Shield className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Secure & Safe</h3>
            <p className="text-sm text-gray-400">100% secure transactions</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-6 text-center hover:bg-slate-700 transition-all hover:transform hover:scale-105">
            <TrendingUp className="w-12 h-12 text-blue-500 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Best Odds</h3>
            <p className="text-sm text-gray-400">Competitive betting odds</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-6 text-center hover:bg-slate-700 transition-all hover:transform hover:scale-105">
            <Gift className="w-12 h-12 text-purple-500 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Welcome Bonus</h3>
            <p className="text-sm text-gray-400">100% up to $100</p>
          </div>
        </div>
      </div>
    </div>
  );
}