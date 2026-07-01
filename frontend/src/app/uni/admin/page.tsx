'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

import AdminVouchers from './components/AdminVouchers';
import AdminHeader from './components/AdminHeader';
import AdminStats from './components/AdminStats';
import AdminTabs from './components/AdminTabs';
import AdminTelemetry from './components/AdminTelemetry';
import AdminUsers from './components/AdminUsers';
import AdminWallets from './components/AdminWallets';
import AdminFixtures from './components/AdminFixtures';
import AdminDeposits from './components/AdminDeposits';
import AdminWithdrawals from './components/AdminWithdrawals';
import { useAdminData } from './hooks/useAdminData';
import { ActiveTab } from './types/admin.types';

export default function SuperAdminDashboard() {
  const router = useRouter();
  const { user: currentAdmin, isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<ActiveTab>('telemetry');

  const {
    metrics,
    userRegistry,
    walletRegistry,
    matches,
    leagues,
    sports,
    teams,
    isSyncing,
    syncPlatformState,
  } = useAdminData();

  // Auth Guard
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please login first.');
      router.push('/auth');
      return;
    }

    if (currentAdmin && !currentAdmin.is_staff && !currentAdmin.is_superuser) {
      toast.error('Access Denied: Administrative Scopes Required.');
      router.push('/');
    }
  }, [isAuthenticated, currentAdmin, router]);

  // Initial data sync
useEffect(() => {
  console.log("ADMIN EFFECT RUN");
  console.log({
    isAuthenticated,
    currentAdmin,
  });

  if (isAuthenticated && (currentAdmin?.is_staff || currentAdmin?.is_superuser)) {
    console.log("CALLING syncPlatformState()");
    syncPlatformState();
  } else {
    console.log("NOT CALLING syncPlatformState()");
  }
}, [isAuthenticated, currentAdmin]);

  // Access check
  if (!isAuthenticated) return null;
  if (currentAdmin && !currentAdmin.is_staff && !currentAdmin.is_superuser) return null;

  const renderContent = () => {
    switch (activeTab) {
      case 'telemetry':
        return <AdminTelemetry />;
      case 'users':
        return <AdminUsers users={userRegistry} onRefresh={syncPlatformState} />;
      case 'wallets':
        return <AdminWallets wallets={walletRegistry} onRefresh={syncPlatformState} />;
      case 'fixtures':
        return (
          <AdminFixtures
            matches={matches}
            leagues={leagues}
            sports={sports}
            teams={teams}
            onRefresh={syncPlatformState}
          />
        );
      case 'deposits':
        return <AdminDeposits />;
      case 'withdrawals':
        return <AdminWithdrawals />;
        case 'vouchers':
        return <AdminVouchers />;
      default:
        return <AdminTelemetry />;
        
    }
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 font-sans p-6 pt-24">
      <div className="max-w-[1600px] mx-auto flex flex-col gap-6">
        <AdminHeader isSyncing={isSyncing} onSync={syncPlatformState} />
        <AdminStats metrics={metrics} matchesCount={matches.length} />
        <AdminTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          userCount={userRegistry.length}
        />
        {renderContent()}
      </div>
    </div>
  );
}