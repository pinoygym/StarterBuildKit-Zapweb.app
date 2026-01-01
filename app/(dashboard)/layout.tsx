import { ReactNode } from 'react';
import { DashboardLayoutClient } from './dashboard-layout-client';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
