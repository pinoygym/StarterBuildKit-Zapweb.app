'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  Warehouse,
  Building2,
  Users,
  ShoppingCart,
  FileText,
  Store,
  CreditCard,
  Receipt,
  AlertCircle,
  BarChart3,
  Menu,
  X,
  BoxIcon,
  Shield,
  UserCog,
  LogOut,
  Settings,
  History,
  Database,
  PackageCheck,
  ClipboardEdit,
  Milestone,
  Wallet,
  Handshake,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useState } from 'react';
import { useAuth } from '@/contexts/auth.context';
import { useCompanyName } from '@/hooks/use-company-settings';

import { getTenantConfig } from '@/lib/tenant-config';
import { TenantConfig, FeatureKey } from '@/config/tenants';

const navigation: { name: string, href: string, icon: any, feature?: FeatureKey }[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Inventory', href: '/inventory', icon: BoxIcon },
  { name: 'Adjustments', href: '/inventory/adjustments', icon: ClipboardEdit },
  { name: 'Stock Transfers', href: '/inventory/transfers', icon: Milestone },
  { name: 'Warehouses', href: '/warehouses', icon: Warehouse },
  { name: 'Branches', href: '/branches', icon: Building2 },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Suppliers', href: '/suppliers', icon: Users },
  { name: 'Purchase Orders', href: '/purchase-orders', icon: ShoppingCart },
  { name: 'Receiving Vouchers', href: '/receiving-vouchers', icon: PackageCheck, feature: 'multi_uom' },
  { name: 'Sales Orders', href: '/sales-orders', icon: FileText },
  { name: 'POS', href: '/pos', icon: Store, feature: 'pos' },
  { name: 'Sales History', href: '/sales-history', icon: History, feature: 'pos' },
  { name: 'AR/AP', href: '/ar-ap', icon: CreditCard, feature: 'ar_ap' },
  { name: 'Fund Sources', href: '/fund-sources', icon: Wallet, feature: 'ar_ap' },
  { name: 'Expenses', href: '/expenses', icon: Receipt, feature: 'expenses' },
  { name: 'Alerts', href: '/alerts', icon: AlertCircle },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Data Maintenance', href: '/data-maintenance', icon: Database },
  { name: 'Cooperative', href: '/cooperative', icon: Handshake },
  { name: 'Roadmap', href: '/roadmap', icon: Milestone, feature: 'roadmap' },
];

const settingsNavigation: { name: string, href: string, icon: any, feature?: FeatureKey }[] = [
  { name: 'Users', href: '/users', icon: UserCog },
  { name: 'Roles', href: '/roles', icon: Shield },
  { name: 'Audit Logs', href: '/settings/audit-logs', icon: History, feature: 'audit_logs' },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar({
  counts,
  tenantConfig: initialTenantConfig,
  isOpen,
  onOpenChange
}: {
  counts?: Record<string, number>,
  tenantConfig?: TenantConfig,
  isOpen?: boolean,
  onOpenChange?: (open: boolean) => void
}) {
  const pathname = usePathname();
  const { logout, isSuperMegaAdmin, user } = useAuth();
  const { companyName } = useCompanyName();

  // Use provided config or fallback to one loaded via env (if available on client)
  const tenantConfig = initialTenantConfig || getTenantConfig();

  const handleLogout = async () => {
    await logout();
  };

  const isFeatureEnabled = (feature?: FeatureKey) => {
    if (!feature) return true;
    return tenantConfig.enabledFeatures.includes(feature);
  };

  // Map navigation href to count key
  const getCount = (href: string) => {
    if (!counts) return undefined;

    switch (href) {
      case '/products': return counts.products;
      case '/warehouses': return counts.warehouses;
      case '/branches': return counts.branches;
      case '/customers': return counts.customers;
      case '/suppliers': return counts.suppliers;
      case '/purchase-orders': return counts.purchaseOrders;
      case '/receiving-vouchers': return counts.receivingVouchers;
      case '/sales-orders': return counts.salesOrders;
      case '/users': return counts.users;
      default: return undefined;
    }
  };

  return (
    <>
      {/* Mobile menu overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => onOpenChange?.(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen transition-transform duration-300',
          'w-64 bg-background border-r flex flex-col',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo and Branding */}
        <div className="h-16 flex items-center gap-3 px-6 border-b">
          <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
              <Package className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-[10px] text-muted-foreground font-medium">testTemplateGithub</span>
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="font-bold text-base text-foreground leading-tight line-clamp-2">{companyName}</span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[10px] text-muted-foreground font-medium truncate">{tenantConfig.shortName}</span>
              <span className="text-[10px] text-muted-foreground">•</span>
              <span className="text-[10px] text-muted-foreground font-medium">{tenantConfig.version}</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navigation
            .filter(item => isFeatureEnabled(item.feature))
            .map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = item.icon;
              const count = getCount(item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => onOpenChange?.(false)}
                  className={cn(
                    'flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    'min-h-[44px]', // Minimum touch target size for mobile
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </div>
                  {count !== undefined && count > 0 && (
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      isActive
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-muted-foreground/20 text-muted-foreground"
                    )}>
                      {count}
                    </span>
                  )}
                </Link>
              );
            })}

          <Separator className="my-3" />
          <div className="pt-2">
            <p className="px-3 text-xs font-semibold text-muted-foreground mb-2">Settings</p>
            {settingsNavigation
              .filter(() => isSuperMegaAdmin())
              .filter(item => isFeatureEnabled(item.feature))
              .map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => onOpenChange?.(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      'min-h-[44px]',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </Link>
                );
              })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t space-y-3">
          {/* Theme Toggle */}
          <div className="flex justify-center">
            <ThemeToggle />
          </div>

          {/* User Info */}
          {user && (
            <Link
              href="/profile"
              onClick={() => onOpenChange?.(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </Link>
          )}

          {/* Logout Button */}
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>

          {/* App Version */}
          <div className="text-xs text-muted-foreground text-center">
            <p>© 2024 {companyName}</p>
            <p className="mt-1">{tenantConfig.version}</p>
          </div>
        </div>
      </aside>
    </>
  );
}
