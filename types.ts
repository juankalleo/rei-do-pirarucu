
export type ViewType = 'dashboard' | 'inventory' | 'customers' | 'reports';

export interface PaymentRecord {
  date: string;
  amount: number;
}

export interface SaleEntry {
  id: string;
  productName: string;
  pricePerKg: number;
  weightKg: number;
  total: number;
  date: string;
  isPaid: boolean;
  paidAmount?: number; // Valor efetivamente pago até o momento
  paymentHistory?: PaymentRecord[]; // Histórico de quando os pagamentos foram feitos
}

export interface StockItem {
  productName: string;
  availableWeight: number;
  basePricePerKg: number; // Preço sugerido de venda para cálculo de valor em estoque
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
  totalInventoryValue: number; // Novo campo: Valor em R$ do estoque total
  customerCount: number;
}
