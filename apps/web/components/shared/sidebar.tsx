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
  Clock,
  ScanFace,
  Banknote,
  Fingerprint,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/auth.context';
import { useCompanyName } from '@/hooks/use-company-settings';

import { getTenantConfig } from '@/lib/tenant-config';
import { TenantConfig, FeatureKey } from '@/config/tenants';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface NavItem {
  name: string;
  href: string;
  icon: any;
  feature?: FeatureKey;
}

interface NavGroup {
  name: string;
  icon?: any;
  items: NavItem[];
}

const groupedNavigation: NavGroup[] = [
  {
    name: 'Dashboard',
    items: [{ name: 'Overview', href: '/dashboard', icon: LayoutDashboard }]
  },
  {
    name: 'Inventory',
    icon: BoxIcon,
    items: [
      { name: 'Products', href: '/products', icon: Package },
      { name: 'Stocks', href: '/inventory', icon: BoxIcon },
      { name: 'Adjustments', href: '/inventory/adjustments', icon: ClipboardEdit },
      { name: 'Stock Transfers', href: '/inventory/transfers', icon: Milestone },
      { name: 'Warehouses', href: '/warehouses', icon: Warehouse },
      { name: 'Receiving Vouchers', href: '/receiving-vouchers', icon: PackageCheck, feature: 'multi_uom' },
    ]
  },
  {
    name: 'Sales & POS',
    icon: Store,
    items: [
      { name: 'POS', href: '/pos', icon: Store, feature: 'pos' },
      { name: 'Sales History', href: '/sales-history', icon: History, feature: 'pos' },
      { name: 'Sales Orders', href: '/sales-orders', icon: FileText },
    ]
  },
  {
    name: 'Procurement',
    icon: ShoppingCart,
    items: [
      { name: 'Purchase Orders', href: '/purchase-orders', icon: ShoppingCart },
      { name: 'Suppliers', href: '/suppliers', icon: Users },
    ]
  },
  {
    name: 'Financials',
    icon: CreditCard,
    items: [
      { name: 'AR/AP', href: '/ar-ap', icon: CreditCard, feature: 'ar_ap' },
      { name: 'Fund Sources', href: '/fund-sources', icon: Wallet, feature: 'ar_ap' },
      { name: 'Expenses', href: '/expenses', icon: Receipt, feature: 'expenses' },
    ]
  },
  {
    name: 'HR & Payroll',
    icon: Clock,
    items: [
      { name: 'Attendance', href: '/hr/attendance', icon: Clock },
      { name: 'Payroll', href: '/hr/payroll', icon: Banknote },
      { name: 'Kiosk', href: '/hr/kiosk', icon: ScanFace },
      { name: 'Biometric Enrollment', href: '/hr/biometrics', icon: Fingerprint },
    ]
  },
  {
    name: 'Contacts',
    icon: Users,
    items: [
      { name: 'Customers', href: '/customers', icon: Users },
    ]
  },
  {
    name: 'Administration',
    icon: Building2,
    items: [
      { name: 'Cooperative', href: '/cooperative', icon: Handshake },
      { name: 'Branches', href: '/branches', icon: Building2 },
      { name: 'Data Maintenance', href: '/data-maintenance', icon: Database },
      { name: 'Roadmap', href: '/roadmap', icon: Milestone, feature: 'roadmap' },
    ]
  },
  {
    name: 'Reporting',
    icon: BarChart3,
    items: [
      { name: 'Reports', href: '/reports', icon: BarChart3 },
      { name: 'Alerts', href: '/alerts', icon: AlertCircle },
    ]
  }
];

const settingsNavigation: NavItem[] = [
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

  const activeGroup = useMemo(() => {
    for (const group of groupedNavigation) {
      if (group.items.some(item => pathname === item.href || pathname.startsWith(item.href + '/'))) {
        return group.name;
      }
    }
    return undefined;
  }, [pathname]);

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
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Inventory</span>
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
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          <Accordion type="single" collapsible defaultValue={activeGroup} className="w-full border-none">
            {groupedNavigation.map((group) => {
              const enabledItems = group.items.filter(item => isFeatureEnabled(item.feature));
              if (enabledItems.length === 0) return null;

              // If group has only one item and it's Dashboard, render as a simple link
              if (group.name === 'Dashboard' && enabledItems.length === 1) {
                const item = enabledItems[0];
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => onOpenChange?.(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-1',
                      'min-h-[40px]',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{group.name}</span>
                  </Link>
                );
              }

              const GroupIcon = group.icon || LayoutDashboard;
              const isGroupActive = group.items.some(item => pathname === item.href || pathname.startsWith(item.href + '/'));

              return (
                <AccordionItem key={group.name} value={group.name} className="border-none mb-1">
                  <AccordionTrigger
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:no-underline hover:bg-muted min-h-[40px] [&[data-state=open]>svg:last-child]:rotate-180",
                      isGroupActive && !activeGroup && "text-foreground bg-muted/50",
                      activeGroup === group.name && "text-foreground bg-muted/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <GroupIcon className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{group.name}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-1 pt-1 ml-4 border-l-2 border-muted/50 pl-2">
                    <div className="flex flex-col gap-1">
                      {enabledItems.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                        const Icon = item.icon;
                        const count = getCount(item.href);

                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            onClick={() => onOpenChange?.(false)}
                            className={cn(
                              'flex items-center justify-between gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                              'min-h-[36px]',
                              isActive
                                ? 'bg-primary/10 text-primary font-semibold'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">{item.name}</span>
                            </div>
                            {count !== undefined && count > 0 && (
                              <span className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded-full",
                                isActive
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted-foreground/20 text-muted-foreground"
                              )}>
                                {count}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>

          <Separator className="my-4" />
          <div className="pt-2">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Systems</p>
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
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-1',
                      'min-h-[40px]',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </Link>
                );
              })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t space-y-3">
          {/* User Info */}
          {user && (
            <Link
              href="/profile"
              onClick={() => onOpenChange?.(false)}
              className="flex items-center gap-3 p-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer border border-transparent hover:border-muted-foreground/20"
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-primary-foreground font-bold shadow-sm">
                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate">
                  {user.firstName} {user.lastName}
                </p>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <p className="text-[10px] text-muted-foreground truncate font-medium">
                    {user.email}
                  </p>
                </div>
              </div>
            </Link>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <ThemeToggle />
            <Button
              variant="outline"
              size="icon"
              className="flex-1 hover:bg-destructive hover:text-destructive-foreground transition-colors group"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
              <span className="ml-2 text-sm font-medium lg:hidden">Logout</span>
            </Button>
          </div>

          {/* App Version */}
          <div className="text-[10px] text-muted-foreground/60 text-center font-medium">
            <p>© 2024 {companyName}</p>
            <p className="mt-0.5 tracking-tighter opacity-70">{tenantConfig.version}</p>
          </div>
        </div>
      </aside>
    </>
  );
}
