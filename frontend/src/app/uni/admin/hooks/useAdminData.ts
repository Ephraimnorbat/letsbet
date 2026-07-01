import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api/client';
import { api } from '@/lib/api/interceptor';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { SystemMetric, AdminUserPayload, AdminWalletPayload } from '../types/admin.types';

export const useAdminData = () => {
  const [metrics, setMetrics] = useState<SystemMetric>({
    active_players: 0,
    total_pool_value: 0,
    system_multiplier_ceiling: 100,
    websocket_status: 'healthy'
  });
  const [userRegistry, setUserRegistry] = useState<AdminUserPayload[]>([]);
  const [walletRegistry, setWalletRegistry] = useState<AdminWalletPayload[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [leagues, setLeagues] = useState<any[]>([]);
  const [sports, setSports] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const syncPlatformState = async () => {
    setIsSyncing(true);
    try {
      // These calls should be fine
      const metricRes = await apiClient.get('/casino/crash/admin-metrics/');
      if (metricRes?.data) setMetrics(metricRes.data);

      const usersRes = await apiClient.get('/auth/profiles/admin-list/');
      if (usersRes?.data) setUserRegistry(usersRes.data);

      const walletsRes = await apiClient.get('/wallet/admin-audit/');
      if (walletsRes?.data) setWalletRegistry(walletsRes.data);

      // Wrap each API call individually to catch errors
      try {
        const matchesRes = await api.get(API_ENDPOINTS.matches.adminFixtures);
        if (matchesRes?.data) {
          setMatches(matchesRes.data?.results || matchesRes.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch matches:', err);
        toast.error('Failed to load matches data');
      }

      try {
        const leaguesRes = await api.get(API_ENDPOINTS.matches.leagues);
        if (leaguesRes?.data) {
          setLeagues(leaguesRes.data?.results || leaguesRes.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch leagues:', err);
        toast.error('Failed to load leagues data');
      }

      try {
        const sportsRes = await api.get(API_ENDPOINTS.matches.sports);
        if (sportsRes?.data) {
          setSports(sportsRes.data?.results || sportsRes.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch sports:', err);
        toast.error('Failed to load sports data');
      }

      try {
        const teamsRes = await api.get(API_ENDPOINTS.matches.teams);
        if (teamsRes?.data) {
          setTeams(teamsRes.data?.results || teamsRes.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch teams:', err);
        toast.error('Failed to load teams data');
      }

    } catch (err: any) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        toast.error('Session expired. Please login again.');
      } else {
        toast.error('Partial failure during cluster data fetch');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    metrics,
    userRegistry,
    walletRegistry,
    matches,
    leagues,
    sports,
    teams,
    isSyncing,
    syncPlatformState,
    setMetrics,
    setUserRegistry,
    setWalletRegistry,
    setMatches,
    setLeagues,
    setSports,
    setTeams,
  };
};