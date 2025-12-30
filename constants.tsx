
import { Customer } from './types';

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: '1',
    name: 'MISTURAS IG PVH',
    // Added required priceList property
    priceList: {},
    entries: [
      { id: 'e1', productName: 'FILE PIRARUCU', pricePerKg: 22.15, weightKg: 26, total: 575.9, date: '2025-12-06', isPaid: true },
      { id: 'e2', productName: 'LINGUIÇA PIRARUCU', pricePerKg: 12.3, weightKg: 24, total: 295.2, date: '2025-12-06', isPaid: false },
      { id: 'e3', productName: 'TAMBAQUI EM BANDAS', pricePerKg: 15.5, weightKg: 32, total: 496, date: '2025-12-06', isPaid: false }
    ],
    // Added missing required properties for Customer type
    walletBalance: 0,
    creditLimit: 0
  },
  {
    id: '2',
    name: 'FELIPE',
    // Added required priceList property
    priceList: {},
    entries: [
      { id: 'e4', productName: 'LOMBO', pricePerKg: 38, weightKg: 700, total: 26600, date: '2025-12-06', isPaid: true }
    ],
    // Added missing required properties for Customer type
    walletBalance: 0,
    creditLimit: 0
  },
  {
    id: '3',
    name: 'NOVA ERA',
    // Added required priceList property
    priceList: {},
    entries: [
      { id: 'e5', productName: 'FILE PIRARUCU', pricePerKg: 105, weightKg: 24, total: 2520, date: '2025-12-15', isPaid: false }
    ],
    // Added missing required properties for Customer type
    walletBalance: 0,
    creditLimit: 0
  }
];

export const PRODUCT_SUGGESTIONS = [
  'FILE PIRARUCU',
  'LINGUIÇA PIRARUCU',
  'TAMBAQUI EM BANDAS',
  'LOMBO',
  'POSTA PINTADO',
  'TAMBAQUI SEM ESPINHO',
  'FILE DE LAMBARI',
  'COSTELINHA TAMBAQUI',
  'BANDA DE TAMBAQUI',
  'FITA',
  'KIBE DE PIRARUCU',
  'FRETE',
  'CAIXA',
  'DEPOSITO'
];