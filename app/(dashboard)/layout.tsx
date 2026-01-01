
import { ReactNode } from 'react';
import { DashboardLayoutClient } from './dashboard-layout-client';
import { dashboardService } from '@/services/dashboard.service';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const counts = await dashboardService.getEntityCounts(); // Fetch global counts initially (no branch context here yet)

  return <DashboardLayoutClient counts={counts}>{children}</DashboardLayoutClient>;
}
