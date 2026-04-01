'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Calendar, TrendingUp, Clock, Star, Flame, Eye, Users, Trophy, ChevronRight, Heart, Share2, Bell } from 'lucide-react';
import { LoadingOverlay, FullScreenLoading } from '@/components/ui/LoadingSpinner';

const sports = ['All', 'Football', 'Tennis', 'Basketball', 'Rugby', 'Cricket', 'Baseball', 'Hockey', 'Golf'];
const timeFilters = ['All', 'Today', 'Tomorrow', 'This Week', 'Next Week'];

const mockMatches = [
  {
    id: '1',
    sport: 'Football',
    league: 'Premier League',
    homeTeam: 'Manchester United',
    awayTeam: 'Liverpool',
    startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
    odds: { home: 2.45, draw: 3.20, away: 2.80 },
    status: 'upcoming',
    isLive: false,
    popularity: 'hot',
    viewers: 0,
    score: { home: 0, away: 0 }
  },
  {
    id: '2',
    sport: 'Basketball',
    league: 'NBA',
    homeTeam: 'Lakers',
    awayTeam: 'Celtics',
    startTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
    odds: { home: 1.85, away: 2.10 },
    status: 'upcoming',
    isLive: true,
    popularity: 'trending',
    viewers: 45000,
    score: { home: 78, away: 82 }
  },
  {
    id: '3',
    sport: 'Tennis',
    league: 'ATP Masters',
    homeTeam: 'Nadal',
    awayTeam: 'Djokovic',
    startTime: new Date(Date.now() + 6 * 60 * 60 * 1000),
    odds: { home: 1.95, away: 1.90 },
    status: 'upcoming',
    isLive: false,
    popularity: 'featured',
    viewers: 0,
    score: { home: 0, away: 0 }
  },
  {
    id: '4',
    sport: 'Football',
    league: 'Champions League',
    homeTeam: 'Real Madrid',
    awayTeam: 'Barcelona',
    startTime: new Date(Date.now() + 8 * 60 * 60 * 1000),
    odds: { home: 2.10, draw: 3.40, away: 3.00 },
    status: 'upcoming',
    isLive: false,
    popularity: 'hot',
    viewers: 0,
    score: { home: 0, away: 0 }
  },
  {
    id: '5',
    sport: 'Rugby',
    league: 'Six Nations',
    homeTeam: 'England',
    awayTeam: 'France',
    startTime: new Date(Date.now() + 10 * 60 * 60 * 1000),
    odds: { home: 1.75, away: 2.25 },
    status: 'upcoming',
    isLive: false,
    popularity: 'normal',
    viewers: 0,
    score: { home: 0, away: 0 }
  },
  {
    id: '6',
    sport: 'Cricket',
    league: 'IPL',
    homeTeam: 'Mumbai Indians',
    awayTeam: 'Chennai Super Kings',
    startTime: new Date(Date.now() + 12 * 60 * 60 * 1000),
    odds: { home: 1.80, away: 2.00 },
    status: 'upcoming',
    isLive: false,
    popularity: 'trending',
    viewers: 0,
    score: { home: 0, away: 0 }
  }
];

const featuredLeagues = [
  {
    name: 'Premier League',
    sport: 'Football',
    matches: 10,
    totalBets: '2.5M',
    icon: '⚽',
    color: 'from-purple-500 to-purple-600'
  },
  {
    name: 'NBA',
    sport: 'Basketball',
    matches: 8,
    totalBets: '1.8M',
    icon: '🏀',
    color: 'from-orange-500 to-orange-600'
  },
  {
    name: 'ATP Tour',
    sport: 'Tennis',
    matches: 12,
    totalBets: '900K',
    icon: '🎾',
    color: 'from-yellow-500 to-yellow-600'
  },
  {
    name: 'Champions League',
    sport: 'Football',
    matches: 6,
    totalBets: '3.2M',
    icon: '🏆',
    color: 'from-blue-500 to-blue-600'
  }
];

const bettingTips = [
  {
    title: 'Value Bet of the Day',
    match: 'Manchester United vs Liverpool',
    prediction: 'Both Teams to Score - Yes',
    odds: '1.65',
    confidence: 'High',
    reason: 'Both teams have strong attacking records'
  },
  {
    title: 'Upset Alert',
    match: 'Lakers vs Celtics',
    prediction: 'Lakers to Win',
    odds: '1.85',
    confidence: 'Medium',
    reason: 'Lakers playing at home with rested squad'
  },
  {
    title: 'Safe Bet',
    match: 'Nadal vs Djokovic',
    prediction: 'Over 22.5 Games',
    odds: '1.55',
    confidence: 'High',
    reason: 'Historically close matches between these rivals'
  }
];

export default function PrematchPage() {
  const [selectedSport, setSelectedSport] = useState('All');
  const [selectedTime, setSelectedTime] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [savedMatches, setSavedMatches] = useState<string[]>([]);
  const [isLoading] = useState(false);

  const matches = mockMatches;

  const filteredMatches = matches.filter(match => {
    const sportMatch = selectedSport === 'All' || match.sport === selectedSport;
    const searchMatch = match.homeTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       match.awayTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       match.league.toLowerCase().includes(searchQuery.toLowerCase());
    return sportMatch && searchMatch;
  });

  const toggleSaveMatch = (matchId: string) => {
    setSavedMatches(prev => 
      prev.includes(matchId) 
        ? prev.filter(id => id !== matchId)
        : [...prev, matchId]
    );
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const getPopularityBadge = (popularity: string) => {
    switch (popularity) {
      case 'hot':
        return (
          <span className="px-2 py-1 bg-orange-100 text-orange-600 text-xs font-semibold rounded-full flex items-center gap-1">
            <Flame className="w-3 h-3" />
            HOT
          </span>
        );
      case 'trending':
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs font-semibold rounded-full flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            TRENDING
          </span>
        );
      case 'featured':
        return (
          <span className="px-2 py-1 bg-purple-100 text-purple-600 text-xs font-semibold rounded-full flex items-center gap-1">
            <Star className="w-3 h-3" />
            FEATURED
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <FullScreenLoading isLoading={isLoading} text="Loading Matches" subtext="Fetching latest prematch odds..." />
      <LoadingOverlay isLoading={isLoading} text="Loading matches..." iOSStyle={true}>
        <div className="max-w-7xl mx-auto p-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Prematch Betting
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Browse upcoming matches and place your bets
            </p>
          </div>

          {/* Featured Leagues */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Featured Leagues
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {featuredLeagues.map((league, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 bg-gradient-to-r ${league.color} rounded-lg flex items-center justify-center text-white`}>
                        {league.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {league.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {league.sport}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {league.matches} matches
                    </span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {league.totalBets} bets
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Betting Tips */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Expert Betting Tips
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {bettingTips.map((tip, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase">
                      {tip.confidence} Confidence
                    </span>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                      {tip.odds}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {tip.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {tip.match}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {tip.prediction}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {tip.reason}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search matches, teams, or leagues..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Sport Filter */}
              <div className="flex gap-2 flex-wrap">
                {sports.map((sport) => (
                  <button
                    key={sport}
                    onClick={() => setSelectedSport(sport)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedSport === sport
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {sport}
                  </button>
                ))}
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
            </div>

            {/* Additional Filters */}
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
              >
                <div className="flex gap-2 flex-wrap">
                  {timeFilters.map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setSelectedTime(filter)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        selectedTime === filter
                          ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Matches Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMatches.map((match, index) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow"
              >
                {/* Match Header */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {match.sport}
                      </span>
                      {match.isLive && (
                        <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-semibold rounded-full animate-pulse">
                          LIVE
                        </span>
                      )}
                      {getPopularityBadge(match.popularity)}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleSaveMatch(match.id)}
                        className={`p-1 rounded transition-colors ${
                          savedMatches.includes(match.id)
                            ? 'text-red-500'
                            : 'text-gray-400 hover:text-red-500'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${savedMatches.includes(match.id) ? 'fill-current' : ''}`} />
                      </button>
                      <button className="p-1 rounded text-gray-400 hover:text-blue-500 transition-colors">
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {match.league}
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white mb-1">
                      {match.homeTeam} vs {match.awayTeam}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>{formatTime(match.startTime)}</span>
                      {match.isLive && match.viewers > 0 && (
                        <>
                          <Eye className="w-4 h-4" />
                          <span>{match.viewers.toLocaleString()} watching</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Odds */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Home</p>
                      <p className="font-bold text-gray-900 dark:text-white">{match.odds.home}</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Draw</p>
                      <p className="font-bold text-gray-900 dark:text-white">{match.odds.draw || '-'}</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Away</p>
                      <p className="font-bold text-gray-900 dark:text-white">{match.odds.away}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                      Place Bet
                    </button>
                    <button className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                      <Bell className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* No Results */}
          {filteredMatches.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No matches found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </div>
      </LoadingOverlay>
    </div>
  );
}
