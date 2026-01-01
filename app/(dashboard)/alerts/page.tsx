'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { useAlerts } from '@/hooks/use-alerts';
import { useBranch } from '@/hooks/use-branch';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Package, Calendar, Eye } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertType } from '@/types/alert.types';

export default function AlertsPage() {
  const router = useRouter();
  const { selectedBranch } = useBranch();
  const [typeFilter, setTypeFilter] = useState<AlertType | undefined>(undefined);
  const { alerts, loading } = useAlerts({ 
    branchId: selectedBranch?.id,
    type: typeFilter,
  });

  const handleViewDetails = (productId: string, warehouseId: string) => {
    router.push(`/products/${productId}?warehouse=${warehouseId}`);
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'low_stock':
        return <Package className="h-4 w-4" />;
      case 'expiring_soon':
      case 'expired':
        return <Calendar className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    return (
      <Badge variant={severity === 'critical' ? 'destructive' : 'default'}>
        {severity.charAt(0).toUpperCase() + severity.slice(1)}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, string> = {
      low_stock: 'Low Stock',
      expiring_soon: 'Expiring Soon',
      expired: 'Expired',
    };
    return variants[type] || type;
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Alerts"
        description="Monitor low stock and expiring items"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Alerts' },
        ]}
      />

      <div className="mt-6 flex gap-4 items-center">
        <Select value={typeFilter || 'all'} onValueChange={(v) => setTypeFilter(v === 'all' ? undefined : v as AlertType)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Alerts</SelectItem>
            <SelectItem value="low_stock">Low Stock</SelectItem>
            <SelectItem value="expiring_soon">Expiring Soon</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="mt-6">
        <CardContent className="p-6">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No alerts found</p>
              <p className="text-sm">All systems are running normally</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getAlertIcon(alert.type)}
                        <span>{getTypeBadge(alert.type)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
                    <TableCell className="font-medium">{alert.productName}</TableCell>
                    <TableCell>{alert.warehouseName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {alert.details}
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleViewDetails(alert.productId, alert.warehouseId)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
