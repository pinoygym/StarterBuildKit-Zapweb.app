import { ReactNode } from 'react';
import { DashboardLayoutClient } from './dashboard-layout-client';
import { dashboardService } from '@/services/dashboard.service';
import { getTenantConfig } from '@/lib/tenant-config';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const counts = await dashboardService.getEntityCounts(); // Fetch global counts initially (no branch context here yet)
  const tenantConfig = getTenantConfig();

  return <DashboardLayoutClient counts={counts} tenantConfig={tenantConfig}>{children}</DashboardLayoutClient>;
}
