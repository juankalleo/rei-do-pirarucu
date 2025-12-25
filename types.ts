
export type ViewType = 'dashboard' | 'inventory' | 'customers' | 'reports';

export interface SaleEntry {
  id: string;
  productName: string;
  pricePerKg: number;
  weightKg: number;
  total: number;
  date: string;
  isPaid: boolean;
}

export interface StockItem {
  productName: string;
  availableWeight: number;
  lastUpdate: string;
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
  customerCount: number;
}
