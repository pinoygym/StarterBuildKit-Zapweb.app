import { Notification } from '@prisma/client';

export type AlertType = 'LOW_STOCK' | 'EXPIRY' | 'SYSTEM' | 'APPROVAL' | 'PAYMENT_DUE';

export interface Alert extends Notification {
  type: AlertType | string;
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
  userId?: string;
  limit?: number;
}
