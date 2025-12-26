
export type ViewType = 'dashboard' | 'inventory' | 'customers' | 'reports' | 'purchases';

export interface PaymentRecord {
  date: string;
  amount: number;
}

export interface PurchaseEntry {
  id: string;
  productName: string;
  weightKg: number;
  pricePerKg: number;
  total: number;
  date: string;
  supplier?: string;
}

export interface StockMovement {
  id: string;
  type: 'entry' | 'exit' | 'adjustment';
  weight: number;
  date: string;
  description: string;
}

export interface SaleEntry {
  id: string;
  productName: string;
  pricePerKg: number;
  weightKg: number;
  total: number;
  date: string;
  isPaid: boolean;
  paidAt?: string;
  paidAmount?: number;
  paymentHistory?: PaymentRecord[];
}

export interface StockItem {
  productName: string;
  availableWeight: number;
  basePricePerKg: number;
  lastUpdate: string;
  history?: StockMovement[];
}

export interface Customer {
  id: string;
  name: string;
  taxId?: string;
  address?: string;
  contactPerson?: string;
  phone?: string;
  priceList: Record<string, number>;
  entries: SaleEntry[];
}

export interface GlobalStats {
  totalRevenue: number;
  totalWeight: number;
  totalPaid: number;
  totalPending: number;
  totalInStock: number;
  totalInventoryValue: number;
  customerCount: number;
}
