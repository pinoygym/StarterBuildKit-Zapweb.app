import { Notification } from '@prisma/client';

export type AlertType = 'LOW_STOCK' | 'EXPIRY' | 'SYSTEM' | 'APPROVAL' | 'PAYMENT_DUE' | 'low_stock' | 'expiring_soon' | 'expired';

export interface Alert extends Omit<Partial<Notification>, 'createdAt'> {
  id: string;
  type: AlertType | string;
  severity: 'critical' | 'warning' | 'info' | string;
  productName: string;
  warehouseName: string;
  details: string;
  productId: string;
  warehouseId: string;
  createdAt: string | Date;
}

export interface CreateAlertInput {
  type: AlertType;
  title: string;
  message: string;
  link?: string;
  userId?: string; // Optional: if null, system-wide or admin alert (logic depends on consumers)
}

export interface AlertFilters {
  isRead?: boolean;
  type?: AlertType;
  branchId?: string;
  warehouseId?: string;
  severity?: string;
  userId?: string;
  limit?: number;
}
