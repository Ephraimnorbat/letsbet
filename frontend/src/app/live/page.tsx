'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Activity, Clock, TrendingUp, Eye, Users, Play, Flame, Star, BarChart3, Trophy, ChevronRight, Heart, Share2, Bell, Zap, Target, DollarSign } from 'lucide-react';
import { LoadingOverlay, FullScreenLoading } from '@/components/ui/LoadingSpinner';

const sports = ['All', 'Football', 'Tennis', 'Basketball', 'Rugby', 'Cricket', 'Baseball', 'Hockey'];
const sortOptions = ['Most Popular', 'Starting Soon', 'Highest Odds', 'Most Viewers'];

const liveMatches = [
  {
    id: '1',
    sport: 'Football',
    league: 'Premier League',
    homeTeam: 'Manchester City',
    awayTeam: 'Chelsea',
    score: { home: 2, away: 1 },
    minute: 67,
    status: 'live',
    odds: { home: 1.45, draw: 4.20, away: 6.80 },
    viewers: 125000,
    popularity: 'hot',
    momentum: 'home',
    lastEvents: ['Goal (City)', 'Yellow Card', 'Corner']
  },
  {
    id: '2',
    sport: 'Basketball',
    league: 'NBA',
    homeTeam: 'Lakers',
    awayTeam: 'Celtics',
    score: { home: 89, away: 85 },
    minute: 'Q3 4:23',
    status: 'live',
    odds: { home: 1.65, away: 2.30 },
    viewers: 98000,
    popularity: 'trending',
    momentum: 'home',
    lastEvents: ['3-Pointer', 'Timeout', 'Free Throw']
  },
  {
    id: '3',
    sport: 'Tennis',
    league: 'Wimbledon',
    homeTeam: 'Federer',
    awayTeam: 'Nadal',
    score: { home: 2, away: 1 },
    minute: 'Set 4 5-4',
    status: 'live',
    odds: { home: 1.35, away: 3.20 },
    viewers: 156000,
    popularity: 'featured',
    momentum: 'away',
    lastEvents: ['Break Point', 'Ace', 'Double Fault']
  },
  {
    id: '4',
    sport: 'Rugby',
    league: 'Six Nations',
    homeTeam: 'England',
    awayTeam: 'France',
    score: { home: 18, away: 15 },
    minute: 58,
    status: 'live',
    odds: { home: 1.25, away: 3.80 },
    viewers: 45000,
    popularity: 'normal',
    momentum: 'home',
    lastEvents: ['Try', 'Conversion', 'Penalty']
  },
  {
    id: '5',
    sport: 'Cricket',
    league: 'IPL',
    homeTeam: 'Mumbai Indians',
    awayTeam: 'Chennai Super Kings',
    score: { home: 145, away: 128 },
    minute: '18.3 overs',
    status: 'live',
    odds: { home: 1.15, away: 5.50 },
    viewers: 78000,
    popularity: 'trending',
    momentum: 'home',
    lastEvents: ['Six', 'Wicket', 'Wide Ball']
  },
  {
    id: '6',
    sport: 'Baseball',
    league: 'MLB',
    homeTeam: 'Yankees',
    awayTeam: 'Red Sox',
    score: { home: 4, away: 3 },
    minute: 'Bottom 7th',
    status: 'live',
    odds: { home: 1.55, away: 2.45 },
    viewers: 62000,
    popularity: 'normal',
    momentum: 'away',
    lastEvents: ['Home Run', 'Strikeout', 'Double']
  }
];

const liveStats = [
  {
    title: 'Live Matches',
    value: '24',
    icon: Activity,
    color: 'from-red-500 to-red-600',
    change: '+8',
    changeType: 'positive'
  },
  {
    title: 'Total Viewers',
    value: '1.2M',
    icon: Eye,
    color: 'from-blue-500 to-blue-600',
    change: '+25%',
    changeType: 'positive'
  },
  {
    title: 'Active Bets',
    value: '450K',
    icon: DollarSign,
    color: 'from-green-500 to-green-600',
    change: '+12%',
    changeType: 'positive'
  },
  {
    title: 'Avg Odds',
    value: '2.35',
    icon: BarChart3,
    color: 'from-purple-500 to-purple-600',
    change: '+0.15',
    changeType: 'positive'
  }
];

const featuredEvents = [
  {
    title: 'El Clasico Special',
    match: 'Real Madrid vs Barcelona',
    boostedOdds: true,
    bonus: '50% Extra Winnings',
    endTime: '2h 15m'
  },
  {
    title: 'NBA Finals Game 7',
    match: 'Lakers vs Celtics',
    boostedOdds: true,
    bonus: '100% Cashback',
    endTime: '45m'
  },
  {
    title: 'Wimbledon Final',
    match: 'Federer vs Nadal',
    boostedOdds: false,
    bonus: 'Live Streaming',
    endTime: '1h 30m'
  }
];

const quickBets = [
  { type: 'Next Goal', odds: '2.80', match: 'Man City vs Chelsea' },
  { type: 'Total Points Over 200', odds: '1.90', match: 'Lakers vs Celtics' },
  { type: 'Next Set Winner', odds: '1.65', match: 'Federer vs Nadal' },
  { type: 'Next Try Scorer', odds: '3.20', match: 'England vs France' }
];

export default function LivePage() {
  const [selectedSport, setSelectedSport] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('Most Popular');
  const [savedMatches, setSavedMatches] = useState<string[]>([]);
  const [isLoading] = useState(false);

  const filteredMatches = liveMatches.filter(match => {
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

  const getMomentumIndicator = (momentum: string) => {
    return momentum === 'home' ? (
      <div className="flex items-center gap-1 text-green-600">
        <TrendingUp className="w-3 h-3" />
        <span className="text-xs font-medium">Home</span>
      </div>
    ) : (
      <div className="flex items-center gap-1 text-red-600">
        <TrendingUp className="w-3 h-3 rotate-180" />
        <span className="text-xs font-medium">Away</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <FullScreenLoading isLoading={isLoading} text="Loading Live Matches" subtext="Connecting to live data feed..." />
      <LoadingOverlay isLoading={isLoading} text="Loading live matches..." iOSStyle={true}>
        <div className="max-w-7xl mx-auto p-4">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Live Betting
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Bet on live matches with real-time odds and updates
            </p>
          </div>

          {/* Live Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {liveStats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className={`text-sm font-medium ${
                    stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {stat.value}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {stat.title}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Featured Events */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Featured Live Events
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {featuredEvents.map((event, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-gradient-to-r ${
                    event.boostedOdds 
                      ? 'from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800' 
                      : 'from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800'
                  } rounded-xl p-4 border`}
                >
                  {event.boostedOdds && (
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-semibold text-yellow-600">
                        BOOSTED ODDS
                      </span>
                    </div>
                  )}
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {event.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {event.match}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {event.bonus}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {event.endTime}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Quick Bets */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Quick Bets
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickBets.map((bet, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      {bet.type}
                    </span>
                    <span className="text-sm font-bold text-green-600">
                      {bet.odds}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {bet.match}
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
                    placeholder="Search live matches..."
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
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {sport}
                  </button>
                ))}
              </div>

              {/* Sort Options */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {sortOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Live Matches Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMatches.map((match, index) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow"
              >
                {/* Live Indicator */}
                <div className="bg-red-500 text-white px-3 py-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span className="text-sm font-semibold">LIVE</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span className="text-xs">{match.viewers.toLocaleString()}</span>
                  </div>
                </div>

                {/* Match Content */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {match.sport}
                      </span>
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
                    <p className="font-medium text-gray-900 dark:text-white mb-2">
                      {match.homeTeam} vs {match.awayTeam}
                    </p>
                    
                    {/* Score */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          {match.score.home}
                        </span>
                        <span className="text-gray-400">-</span>
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          {match.score.away}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {match.minute}
                      </div>
                    </div>

                    {/* Momentum */}
                    <div className="mb-2">
                      {getMomentumIndicator(match.momentum)}
                    </div>

                    {/* Last Events */}
                    <div className="flex gap-2 flex-wrap">
                      {match.lastEvents.map((event, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-400 rounded"
                        >
                          {event}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {/* Live Odds */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors cursor-pointer border border-green-200 dark:border-green-800">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Home</p>
                      <p className="font-bold text-gray-900 dark:text-white">{match.odds.home}</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Draw</p>
                      <p className="font-bold text-gray-900 dark:text-white">{match.odds.draw || '-'}</p>
                    </div>
                    <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors cursor-pointer border border-red-200 dark:border-red-800">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Away</p>
                      <p className="font-bold text-gray-900 dark:text-white">{match.odds.away}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                      <Play className="w-4 h-4" />
                      Live Bet
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
                <Activity className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No live matches found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Check back later for more live betting opportunities
              </p>
            </div>
          )}
        </div>
      </LoadingOverlay>
    </div>
  );
}
