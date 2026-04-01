'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, Target, Clock, TrendingUp, Users, Swords, 
  Calendar, ChevronLeft, BarChart3, Users2, Flag,
  AlertCircle, RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { useMatchStatistics, useMatchDetails } from '@/lib/api/hooks/useMatches';
import { useHomeTeamLineup, useAwayTeamLineup } from '@/lib/api/hooks/useMatches';

export default function MatchDetailPage() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<'stats' | 'lineups' | 'events'>('stats');
  
  const { data: statsData, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useMatchStatistics(id as string);
  const { data: matchData, isLoading: matchLoading } = useMatchDetails(id as string);
  const { data: homeLineup, isLoading: homeLineupLoading } = useHomeTeamLineup(id as string);
  const { data: awayLineup, isLoading: awayLineupLoading } = useAwayTeamLineup(id as string);

  if (statsLoading || matchLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-700 rounded w-1/3"></div>
          <div className="h-64 bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  const stats = statsData?.data?.response || statsData?.data || statsData;
  const match = matchData?.data?.response || matchData?.data || matchData;
  const homeTeam = match?.teams?.home?.name || match?.home_team_name;
  const awayTeam = match?.teams?.away?.name || match?.away_team_name;
  const homeScore = match?.goals?.home ?? match?.home_score ?? 0;
  const awayScore = match?.goals?.away ?? match?.away_score ?? 0;
  const matchStatus = match?.fixture?.status?.short || match?.status || 'LIVE';
  const matchTime = match?.fixture?.status?.elapsed || match?.time || '0';

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Link 
        href="/live-matches" 
        className="inline-flex items-center space-x-2 text-gray-400 hover:text-white mb-6 transition"
      >
        <ChevronLeft className="w-5 h-5" />
        <span>Back to Live Matches</span>
      </Link>

      {/* Match Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-xs px-2 py-1 bg-red-500/20 text-red-500 rounded-full">
              {matchStatus}
            </span>
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3 text-gray-500" />
              <span className="text-xs text-gray-400">{matchTime}'</span>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="w-3 h-3 text-gray-500" />
            <span className="text-xs text-gray-400">
              {new Date(match?.fixture?.date || match?.match_date).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex-1 text-center">
            <div className="text-2xl font-bold mb-2">{homeTeam}</div>
            <div className="text-4xl font-bold text-green-500">{homeScore}</div>
          </div>
          <div className="px-8">
            <div className="text-sm text-gray-400 mb-2">VS</div>
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Flag className="w-6 h-6 text-blue-500" />
            </div>
          </div>
          <div className="flex-1 text-center">
            <div className="text-2xl font-bold mb-2">{awayTeam}</div>
            <div className="text-4xl font-bold text-green-500">{awayScore}</div>
          </div>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <div className="flex space-x-2 mb-6 border-b border-slate-700">
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2 font-medium transition relative ${
            activeTab === 'stats'
              ? 'text-blue-500'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Statistics</span>
          </div>
          {activeTab === 'stats' && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab('lineups')}
          className={`px-4 py-2 font-medium transition relative ${
            activeTab === 'lineups'
              ? 'text-blue-500'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Users2 className="w-4 h-4" />
            <span>Lineups</span>
          </div>
          {activeTab === 'lineups' && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`px-4 py-2 font-medium transition relative ${
            activeTab === 'events'
              ? 'text-blue-500'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4" />
            <span>Match Events</span>
          </div>
          {activeTab === 'events' && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
            />
          )}
        </button>
      </div>

      {/* Statistics Tab */}
      {activeTab === 'stats' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {statsError || statsData?.status === 'error' ? (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-8 text-center">
              <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
              <p className="text-gray-400 mb-4">Statistics are currently unavailable</p>
              <button
                onClick={() => refetchStats()}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-yellow-500/20 rounded-lg hover:bg-yellow-500/30 transition"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry</span>
              </button>
            </div>
          ) : !stats ? (
            <div className="text-center text-gray-400 py-12">
              No statistics available for this match
            </div>
          ) : (
            <>
              {/* Possession */}
              {stats.possession && (
                <div className="bg-slate-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-500" />
                    Possession
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>{homeTeam}</span>
                      <span>{awayTeam}</span>
                    </div>
                    <div className="flex h-3 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="bg-blue-500 rounded-l-full"
                        style={{ width: `${stats.possession.home}%` }}
                      />
                      <div 
                        className="bg-red-500 rounded-r-full"
                        style={{ width: `${stats.possession.away}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-2xl font-bold">
                      <span>{stats.possession.home}%</span>
                      <span>{stats.possession.away}%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Shots Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-red-500" />
                    Shots
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>{homeTeam}</span>
                      <span className="text-2xl font-bold">{stats.shots?.home || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{awayTeam}</span>
                      <span className="text-2xl font-bold">{stats.shots?.away || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Swords className="w-5 h-5 text-green-500" />
                    Shots on Target
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>{homeTeam}</span>
                      <span className="text-2xl font-bold">{stats.shots_on_target?.home || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{awayTeam}</span>
                      <span className="text-2xl font-bold">{stats.shots_on_target?.away || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-yellow-500" />
                    Corners
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>{homeTeam}</span>
                      <span className="text-2xl font-bold">{stats.corners?.home || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{awayTeam}</span>
                      <span className="text-2xl font-bold">{stats.corners?.away || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-orange-500" />
                    Fouls
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>{homeTeam}</span>
                      <span className="text-2xl font-bold">{stats.fouls?.home || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{awayTeam}</span>
                      <span className="text-2xl font-bold">{stats.fouls?.away || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* Lineups Tab */}
      {activeTab === 'lineups' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Home Team Lineup */}
          <div className="bg-slate-800 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4">{homeTeam}</h3>
            {homeLineupLoading ? (
              <div className="animate-pulse space-y-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-10 bg-slate-700 rounded"></div>
                ))}
              </div>
            ) : homeLineup?.data?.response ? (
              <div className="space-y-2">
                {homeLineup.data.response.map((player: any, idx: number) => (
                  <div key={idx} className="flex items-center space-x-3 p-2 hover:bg-slate-700 rounded-lg transition">
                    <span className="text-sm text-gray-400 w-8">{player.number || idx + 1}</span>
                    <span className="font-medium">{player.name}</span>
                    <span className="text-xs text-gray-500 ml-auto">{player.position}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">Lineup not available</p>
            )}
          </div>

          {/* Away Team Lineup */}
          <div className="bg-slate-800 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4">{awayTeam}</h3>
            {awayLineupLoading ? (
              <div className="animate-pulse space-y-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-10 bg-slate-700 rounded"></div>
                ))}
              </div>
            ) : awayLineup?.data?.response ? (
              <div className="space-y-2">
                {awayLineup.data.response.map((player: any, idx: number) => (
                  <div key={idx} className="flex items-center space-x-3 p-2 hover:bg-slate-700 rounded-lg transition">
                    <span className="text-sm text-gray-400 w-8">{player.number || idx + 1}</span>
                    <span className="font-medium">{player.name}</span>
                    <span className="text-xs text-gray-500 ml-auto">{player.position}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">Lineup not available</p>
            )}
          </div>
        </motion.div>
      )}

      {/* Events Tab */}
      {activeTab === 'events' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-slate-800 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />
            Match Events
          </h3>
          {stats?.events && stats.events.length > 0 ? (
            <div className="space-y-3">
              {stats.events.map((event: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-400">{event.time}'</span>
                    <span className={`text-sm font-medium ${
                      event.type === 'goal' ? 'text-green-500' :
                      event.type === 'yellow_card' ? 'text-yellow-500' :
                      event.type === 'red_card' ? 'text-red-500' : 'text-gray-300'
                    }`}>
                      {event.type.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>{event.player}</span>
                    <span className="text-xs text-gray-500">({event.team})</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">No events recorded yet</p>
          )}
        </motion.div>
      )}
    </div>
  );
}