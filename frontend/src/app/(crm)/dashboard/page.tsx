'use client';

import { useState, useEffect } from 'react';
import { Users, UserCheck, UserX, LogIn } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatsCard } from '@/features/dashboard/components/StatsCard';
import { RecentActivities } from '@/features/dashboard/components/RecentActivities';
import { LatestEmployees } from '@/features/dashboard/components/LatestEmployees';
import { QuickActions } from '@/features/dashboard/components/QuickActions';
import { LeadStatsSection } from '@/features/dashboard/components/LeadStatsSection';
import { useDashboard } from '@/features/dashboard/hooks/useDashboard';
import { ErrorState } from '@/components/common/ErrorState';
import { useAuthStore } from '@/stores/auth.store';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/constants';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardPage() {
  const { stats, activities, latestEmployees, leadStats, isLoading, error, refetch } = useDashboard();
  const user = useAuthStore((s) => s.user);
  const { hasPermission, isReady } = usePermissions();
  const [greeting, setGreeting] = useState('Welcome back');
  const showLeadStats = isReady && (hasPermission(PERMISSIONS.LEAD_READ) || hasPermission(PERMISSIONS.LEAD_READ_ASSIGNED));

  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  if (error && !isLoading) {
    return <ErrorState description={error} onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting}, ${user?.name?.split(' ')[0] || 'there'}! 👋`}
        description="Here's what's happening in your CRM today."
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          title="Total Employees"
          value={stats?.totalEmployees ?? 0}
          icon={Users}
          color="blue"
          description="All registered employees"
          isLoading={isLoading}
        />
        <StatsCard
          title="Active Employees"
          value={stats?.activeEmployees ?? 0}
          icon={UserCheck}
          color="emerald"
          description="Currently active accounts"
          isLoading={isLoading}
        />
        <StatsCard
          title="Inactive Employees"
          value={stats?.inactiveEmployees ?? 0}
          icon={UserX}
          color="rose"
          description="Deactivated accounts"
          isLoading={isLoading}
        />
        <StatsCard
          title="Today's Logins"
          value={stats?.todayLogins ?? 0}
          icon={LogIn}
          color="amber"
          description="Logins recorded today"
          isLoading={isLoading}
        />
      </div>

      {showLeadStats && (
        <LeadStatsSection stats={leadStats} isLoading={isLoading} />
      )}

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Activity feed - takes 2/3 */}
        <div className="lg:col-span-2 space-y-5">
          <RecentActivities activities={activities} isLoading={isLoading} />
        </div>

        {/* Right column */}
        <div className="space-y-5">
          <QuickActions />
        </div>
      </div>

      {/* Latest employees */}
      <LatestEmployees employees={latestEmployees} isLoading={isLoading} />
    </div>
  );
}
