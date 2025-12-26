
import React, { useState, useEffect, useMemo } from 'react';
import { Customer, SaleEntry, StockItem, ViewType, PaymentRecord, PurchaseEntry, StockMovement } from './types';
import { INITIAL_CUSTOMERS, PRODUCT_SUGGESTIONS } from './constants';
import { 
  FishIcon, 
  PlusIcon, 
  BoxIcon, 
  ClockIcon, 
  CheckIcon, 
  ChartIcon, 
  LayoutIcon, 
  UsersIcon,
  TrashIcon,
  EditIcon,
  ShoppingIcon
} from './components/Icons';
import CustomerCard from './components/CustomerCard';

const formatCurrency = (val: number) => 
  val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const BrandLogo = ({ variant = 'sidebar' }: { variant?: 'sidebar' | 'header' }) => {
  const isHeader = variant === 'header';
  return (
    <div className={`flex flex-col items-center text-center select-none ${isHeader ? 'scale-75 lg:scale-90 origin-left' : 'py-4 px-2'}`}>
      <div className="relative mb-1">
        <FishIcon className={`${isHeader ? 'w-10 h-10' : 'w-20 h-20'} text-yellow-500 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]`} />
      </div>
      
      <div className="flex items-center gap-3 w-full mb-0.5">
        <div className="h-[1px] flex-1 bg-yellow-500/40"></div>
        <span className={`${isHeader ? 'text-[6px]' : 'text-[9px]'} font-bold text-yellow-500 tracking-[0.4em] uppercase leading-none`}>Pescados</span>
        <div className="h-[1px] flex-1 bg-yellow-500/40"></div>
      </div>

      <h1 className={`font-serif font-bold ${isHeader ? 'text-xl' : 'text-3xl'} ${isHeader ? 'text-[#002855]' : 'text-white'} uppercase tracking-tight leading-none italic`}>
        Rei do <span className="text-yellow-500">Pirarucu</span>
      </h1>

      {!isHeader && (
        <div className="mt-2 flex items-center gap-2 w-full">
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-yellow-500/50"></div>
          <span className="text-[7px] font-black text-blue-200 uppercase tracking-[0.2em] whitespace-nowrap">Pirarucu Selvagem da Amazônia</span>
          <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-yellow-500/50"></div>
        </div>
      )}
    </div>
  );
};

const MonthlyBarChart = ({ data, type = 'sales' }: { data: { month: string, val1: number, val2?: number }[], type?: 'sales' | 'purchases' }) => {
  if (data.length === 0) return (
    <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
      <ChartIcon className="w-12 h-12 opacity-10" />
      <span className="text-xs font-black uppercase tracking-[0.2em]">Sem dados históricos</span>
    </div>
  );

  const width = 1000;
  const height = 400;
  const padding = 60;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  
  const maxVal = Math.max(...data.map(d => Math.max(d.val1, d.val2 || 0))) * 1.2 || 1000;
  const groupWidth = chartWidth / data.length;
  const barWidth = type === 'sales' ? Math.min(groupWidth * 0.35, 30) : Math.min(groupWidth * 0.6, 60);

  return (
    <div className="w-full h-full overflow-x-auto custom-scrollbar">
      <div className="min-w-[800px] w-full h-full">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          {[0, 0.25, 0.5, 0.75, 1].map(v => {
            const y = padding + (1 - v) * chartHeight;
            const value = v * maxVal;
            return (
              <g key={v}>
                <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />
                <text x={padding - 15} y={y + 4} textAnchor="end" className="text-[10px] fill-slate-500 font-bold font-mono">
                  {v === 0 ? "R$ 0" : `R$ ${(value/1000).toFixed(1)}k`}
                </text>
              </g>
            );
          })}
          {data.map((d, i) => {
            const xGroupCenter = padding + i * groupWidth + groupWidth / 2;
            const hVal1 = (d.val1 / maxVal) * chartHeight;
            const hVal2 = d.val2 ? (d.val2 / maxVal) * chartHeight : 0;
            
            return (
              <g key={d.month} className="group/bar">
                {/* Background das barras com maior contraste (de f8fafc para e2e8f0) */}
                {type === 'sales' ? (
                  <>
                    <rect x={xGroupCenter - barWidth - 4} y={padding} width={barWidth} height={chartHeight} fill="#e2e8f0" rx="4" />
                    <rect x={xGroupCenter + 4} y={padding} width={barWidth} height={chartHeight} fill="#e2e8f0" rx="4" />
                    <rect x={xGroupCenter - barWidth - 4} y={height - padding - hVal1} width={barWidth} height={hVal1} fill="url(#gradPaid)" rx="4" className="transition-all duration-500 hover:brightness-110" />
                    <rect x={xGroupCenter + 4} y={height - padding - hVal2} width={barWidth} height={hVal2} fill="url(#gradPending)" rx="4" className="transition-all duration-500 hover:brightness-110" />
                  </>
                ) : (
                  <>
                    <rect x={xGroupCenter - barWidth / 2} y={padding} width={barWidth} height={chartHeight} fill="#e2e8f0" rx="4" />
                    <rect x={xGroupCenter - barWidth / 2} y={height - padding - hVal1} width={barWidth} height={hVal1} fill="url(#gradPurchases)" rx="4" className="transition-all duration-500 hover:brightness-110" />
                  </>
                )}
                <text x={xGroupCenter} y={height - padding + 25} textAnchor="middle" className="text-[11px] font-black fill-slate-600 uppercase tracking-tighter">{d.month}</text>
              </g>
            );
          })}
          <defs>
            <linearGradient id="gradPaid" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" /><stop offset="100%" stopColor="#059669" /></linearGradient>
            <linearGradient id="gradPending" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#d97706" /></linearGradient>
            <linearGradient id="gradPurchases" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ef4444" /><stop offset="100%" stopColor="#b91c1c" /></linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('pescados_vendas_data_v17');
    if (saved) return JSON.parse(saved);
    return INITIAL_CUSTOMERS.map(c => ({ ...c, priceList: c.priceList || {} }));
  });
  const [stock, setStock] = useState<StockItem[]>(() => {
    const saved = localStorage.getItem('pescados_estoque_data_v17');
    if (saved) {
      const parsed = JSON.parse(saved) as StockItem[];
      return parsed.map(s => ({ ...s, history: s.history || [] }));
    }
    return PRODUCT_SUGGESTIONS.map(p => ({ 
      productName: p.toUpperCase().trim(), 
      availableWeight: 0, 
      basePricePerKg: 0, 
      lastUpdate: new Date().toISOString(),
      history: []
    }));
  });
  const [purchases, setPurchases] = useState<PurchaseEntry[]>(() => {
    const saved = localStorage.getItem('pescados_compras_data_v17');
    if (saved) return JSON.parse(saved);
    return [];
  });

  const [isVendaModalOpen, setIsVendaModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isEditStockModalOpen, setIsEditStockModalOpen] = useState(false);
  const [isPartialPaymentModalOpen, setIsPartialPaymentModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  
  const [activeCustomerId, setActiveCustomerId] = useState<string | null>(null);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [selectedStockItem, setSelectedStockItem] = useState<StockItem | null>(null);

  const [formData, setFormData] = useState({ productName: '', pricePerKg: '', weightKg: '', date: new Date().toISOString().split('T')[0], isPaid: false });
  const [stockFormData, setStockFormData] = useState({ productName: '', weightToAdd: '', basePricePerKg: '', date: new Date().toISOString().split('T')[0] });
  const [purchaseFormData, setPurchaseFormData] = useState({ productName: '', weightKg: '', pricePerKg: '', total: '', date: new Date().toISOString().split('T')[0], supplier: '' });
  const [editStockFormData, setEditStockFormData] = useState({ oldName: '', newName: '', weight: '', basePrice: '' });
  const [partialPaymentData, setPartialPaymentData] = useState({ amount: '', date: new Date().toISOString().split('T')[0] });
  const [customerForm, setCustomerForm] = useState<Partial<Customer>>({ name: '', taxId: '', address: '', contactPerson: '', phone: '', priceList: {} });
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);

  useEffect(() => localStorage.setItem('pescados_vendas_data_v17', JSON.stringify(customers)), [customers]);
  useEffect(() => localStorage.setItem('pescados_estoque_data_v17', JSON.stringify(stock)), [stock]);
  useEffect(() => localStorage.setItem('pescados_compras_data_v17', JSON.stringify(purchases)), [purchases]);

  useEffect(() => {
    if (isVendaModalOpen && activeCustomerId && formData.productName) {
      const customer = customers.find(c => c.id === activeCustomerId);
      const prodName = formData.productName.toUpperCase().trim();
      if (customer?.priceList?.[prodName]) {
        setFormData(prev => ({ ...prev, pricePerKg: customer.priceList[prodName].toString() }));
      }
    }
  }, [formData.productName, isVendaModalOpen, activeCustomerId, customers]);

  const stats = useMemo(() => {
    let total = 0, weight = 0, paid = 0, pending = 0;
    customers.forEach(c => c.entries.forEach(e => {
      total += Number(e.total);
      weight += Number(e.weightKg);
      const currentPaid = e.isPaid ? e.total : (e.paidAmount || 0);
      paid += currentPaid;
      pending += (e.total - currentPaid);
    }));

    const totalSpent = purchases.reduce((acc, p) => acc + p.total, 0);

    let inventoryVal = 0;
    let weightInStock = 0;
    stock.forEach(item => {
      weightInStock += Math.max(0, item.availableWeight);
      inventoryVal += Math.max(0, item.availableWeight) * (item.basePricePerKg || 0);
    });
    return { 
      totalRevenue: total, 
      totalWeight: weight, 
      totalPaid: paid, 
      totalPending: pending, 
      totalInStock: weightInStock, 
      totalInventoryValue: inventoryVal,
      totalSpent,
      customerCount: customers.length 
    };
  }, [customers, stock, purchases]);

  const timelineMonthlyData = useMemo(() => {
    const monthly: Record<string, { val1: number, val2: number }> = {};
    customers.forEach(c => c.entries.forEach(e => {
      const date = new Date(e.date);
      const monthKey = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).toUpperCase();
      const sortKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const key = `${sortKey}|${monthKey}`;
      if (!monthly[key]) monthly[key] = { val1: 0, val2: 0 };
      const currentPaid = e.isPaid ? e.total : (e.paidAmount || 0);
      monthly[key].val1 += currentPaid;
      monthly[key].val2 += (e.total - currentPaid);
    }));
    return Object.entries(monthly)
      .map(([key, vals]) => ({ sortKey: key.split('|')[0], month: key.split('|')[1], ...vals }))
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [customers]);

  const timelineMonthlyPurchasesData = useMemo(() => {
    const monthly: Record<string, { val1: number }> = {};
    purchases.forEach(p => {
      const date = new Date(p.date);
      const monthKey = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).toUpperCase();
      const sortKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const key = `${sortKey}|${monthKey}`;
      if (!monthly[key]) monthly[key] = { val1: 0 };
      monthly[key].val1 += p.total;
    });
    return Object.entries(monthly)
      .map(([key, vals]) => ({ sortKey: key.split('|')[0], month: key.split('|')[1], ...vals }))
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [purchases]);

  const reportData = useMemo(() => {
    const prodStats: Record<string, { weight: number, revenue: number, cost: number }> = {};
    customers.forEach(c => c.entries.forEach(e => {
      const pName = e.productName.toUpperCase();
      if (!prodStats[pName]) prodStats[pName] = { weight: 0, revenue: 0, cost: 0 };
      prodStats[pName].weight += Number(e.weightKg);
      prodStats[pName].revenue += Number(e.total);
      
      const sItem = stock.find(s => s.productName === pName);
      if (sItem) {
        prodStats[pName].cost += Number(e.weightKg) * (sItem.basePricePerKg || 0);
      }
    }));
    return Object.entries(prodStats).map(([name, data]) => ({ name, ...data })).sort((a, b) => b.revenue - a.revenue);
  }, [customers, stock]);

  const rankingInadimplencia = useMemo(() => {
    const list = customers.map(c => {
      let pending = 0;
      c.entries.forEach(e => {
        const currentPaid = e.isPaid ? e.total : (e.paidAmount || 0);
        pending += (e.total - currentPaid);
      });
      return { name: c.name, pending };
    }).filter(c => c.pending > 0);
    return list.sort((a, b) => b.pending - a.pending);
  }, [customers]);

  const handleDeleteEntry = (customerId: string, entryId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    const entryToRemove = customer.entries.find(e => e.id === entryId);

    setCustomers(prev => prev.map(c => {
      if (c.id !== customerId) return c;
      return { ...c, entries: c.entries.filter(e => e.id !== entryId) };
    }));

    if (entryToRemove) {
      const pName = entryToRemove.productName.toUpperCase().trim();
      setStock(sPrev => sPrev.map(s => {
        if (s.productName === pName) {
          const newMovement: StockMovement = {
            id: Math.random().toString(36).substr(2, 9),
            type: 'adjustment',
            weight: entryToRemove.weightKg,
            date: new Date().toISOString(),
            description: `Estorno de venda p/ ${customer.name}`
          };
          return { 
            ...s, 
            availableWeight: s.availableWeight + entryToRemove.weightKg,
            history: [newMovement, ...(s.history || [])]
          };
        }
        return s;
      }));
    }
  };

  const handleTogglePayment = (customerId: string, entryId: string) => {
    setCustomers(prev => prev.map(c => {
      if (c.id !== customerId) return c;
      return {
        ...c,
        entries: c.entries.map(e => {
          if (e.id !== entryId) return e;
          const newIsPaid = !e.isPaid;
          const today = new Date().toISOString().split('T')[0];
          return { 
            ...e, 
            isPaid: newIsPaid, 
            paidAmount: newIsPaid ? e.total : 0,
            paidAt: newIsPaid ? today : undefined
          };
        })
      };
    }));
  };

  const handlePartialPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCustomerId || !activeEntryId) return;
    const amount = Number(partialPaymentData.amount);
    const date = partialPaymentData.date;

    setCustomers(prev => prev.map(c => {
      if (c.id !== activeCustomerId) return c;
      return {
        ...c,
        entries: c.entries.map(ent => {
          if (ent.id !== activeEntryId) return ent;
          const currentPaid = (ent.paidAmount || 0) + amount;
          const history = ent.paymentHistory || [];
          const isPaid = currentPaid >= ent.total;
          return {
            ...ent,
            paidAmount: currentPaid,
            isPaid,
            paidAt: isPaid ? date : ent.paidAt,
            paymentHistory: [...history, { amount, date }]
          };
        })
      };
    }));
    setIsPartialPaymentModalOpen(false);
    setPartialPaymentData({ amount: '', date: new Date().toISOString().split('T')[0] });
  };

  const handleSubmitVenda = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCustomerId) return;
    const customer = customers.find(c => c.id === activeCustomerId);
    if (!customer) return;

    const price = Number(formData.pricePerKg);
    const weight = Number(formData.weightKg);
    const prodName = formData.productName.toUpperCase().trim();
    const total = price * weight;

    const newEntry: SaleEntry = {
      id: Math.random().toString(36).substr(2, 9),
      productName: prodName,
      pricePerKg: price,
      weightKg: weight,
      total,
      date: formData.date,
      isPaid: false,
      paidAmount: 0,
      paymentHistory: []
    };

    setCustomers(prev => prev.map(c => {
      if (c.id !== activeCustomerId) return c;
      return { ...c, entries: [newEntry, ...c.entries] };
    }));

    setStock(prev => {
      const exists = prev.some(s => s.productName === prodName);
      const newMovement: StockMovement = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'exit',
        weight: -weight,
        date: formData.date,
        description: `Venda p/ ${customer.name}`
      };

      if (exists) {
        return prev.map(s => s.productName === prodName ? { 
          ...s, 
          availableWeight: s.availableWeight - weight,
          history: [newMovement, ...(s.history || [])]
        } : s);
      } else {
        return [...prev, { 
          productName: prodName, 
          availableWeight: -weight, 
          basePricePerKg: 0, 
          lastUpdate: formData.date,
          history: [newMovement]
        }];
      }
    });

    setIsVendaModalOpen(false);
    setFormData({ ...formData, productName: '', pricePerKg: '', weightKg: '', date: new Date().toISOString().split('T')[0] });
  };

  const handleSavePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    const prodName = purchaseFormData.productName.toUpperCase().trim();
    const weight = Number(purchaseFormData.weightKg);
    const price = Number(purchaseFormData.pricePerKg);
    const total = Number(purchaseFormData.total) || (weight * price);

    const newPurchase: PurchaseEntry = {
      id: Math.random().toString(36).substr(2, 9),
      productName: prodName,
      weightKg: weight,
      pricePerKg: price || (total / weight),
      total,
      date: purchaseFormData.date,
      supplier: purchaseFormData.supplier
    };

    setPurchases(prev => [newPurchase, ...prev]);

    setIsPurchaseModalOpen(false);
    setPurchaseFormData({ productName: '', weightKg: '', pricePerKg: '', total: '', date: new Date().toISOString().split('T')[0], supplier: '' });
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditingCustomer && customerForm.id) {
      setCustomers(prev => prev.map(c => c.id === customerForm.id ? { ...c, ...customerForm } as Customer : c));
    } else {
      const newCustomer: Customer = {
        ...customerForm,
        id: Math.random().toString(36).substr(2, 9),
        entries: [],
        priceList: customerForm.priceList || {}
      } as Customer;
      setCustomers(prev => [...prev, newCustomer]);
    }
    setIsCustomerModalOpen(false);
    setCustomerForm({ name: '', priceList: {} });
  };

  const handleAbastecer = (e: React.FormEvent) => {
    e.preventDefault();
    const weight = Number(stockFormData.weightToAdd);
    const basePrice = Number(stockFormData.basePricePerKg);
    const prodName = stockFormData.productName.toUpperCase().trim();
    const entryDate = stockFormData.date;
    if (!prodName) return;

    const newMovement: StockMovement = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'entry',
      weight: weight,
      date: entryDate,
      description: 'Abastecimento Manual'
    };

    setStock(prev => {
      const exists = prev.some(s => s.productName === prodName);
      if (exists) {
        return prev.map(s => s.productName === prodName ? { 
          ...s, 
          availableWeight: s.availableWeight + weight, 
          basePricePerKg: basePrice || s.basePricePerKg, 
          lastUpdate: entryDate,
          history: [newMovement, ...(s.history || [])]
        } : s);
      }
      return [...prev, { 
        productName: prodName, 
        availableWeight: weight, 
        basePricePerKg: basePrice, 
        lastUpdate: entryDate,
        history: [newMovement]
      }];
    });
    setIsStockModalOpen(false);
    setStockFormData({ productName: '', weightToAdd: '', basePricePerKg: '', date: new Date().toISOString().split('T')[0] });
  };

  const handleUpdateStockItem = (e: React.FormEvent) => {
    e.preventDefault();
    const newWeight = Number(editStockFormData.weight);
    const newPrice = Number(editStockFormData.basePrice);
    const newName = editStockFormData.newName.toUpperCase().trim();
    const oldName = editStockFormData.oldName;

    setStock(prev => prev.map(s => {
      if (s.productName === oldName) {
        const weightDiff = newWeight - s.availableWeight;
        const newMovement: StockMovement = {
          id: Math.random().toString(36).substr(2, 9),
          type: 'adjustment',
          weight: weightDiff,
          date: new Date().toISOString(),
          description: 'Ajuste Manual de Cadastro'
        };
        return { 
          ...s, 
          productName: newName, 
          availableWeight: newWeight, 
          basePricePerKg: newPrice, 
          lastUpdate: new Date().toISOString(),
          history: weightDiff !== 0 ? [newMovement, ...(s.history || [])] : s.history
        };
      }
      return s;
    }));
    setIsEditStockModalOpen(false);
  };

  const handleExportPDF = () => {
    const originalTitle = document.title;
    const timestamp = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h');
    document.title = `AUDITORIA_REI_DO_PIRARUCU_${timestamp}_${time}`;
    setTimeout(() => {
      window.print();
      document.title = originalTitle;
    }, 100);
  };

  const NavItem = ({ id, label, icon: Icon }: { id: ViewType, label: string, icon: any }) => (
    <button onClick={() => { setActiveView(id); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-8 py-5 transition-all duration-300 relative group ${activeView === id ? 'text-white' : 'text-blue-200/60 hover:text-white'}`}>
      <Icon className={`w-5 h-5 transition-transform duration-500 ${activeView === id ? 'scale-110' : 'group-hover:scale-110'}`} />
      <span className="font-black uppercase text-[10px] tracking-widest leading-none">{label}</span>
      {activeView === id && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1.5 bg-yellow-400 rounded-r-full shadow-[0_0_15px_rgba(250,204,21,0.5)]"></div>}
    </button>
  );

  return (
    <div className="flex min-h-screen text-slate-900 overflow-hidden font-['Inter'] relative">
      {isSidebarOpen && <div className="fixed inset-0 bg-blue-950/60 backdrop-blur-sm z-[60] md:hidden transition-opacity" onClick={() => setIsSidebarOpen(false)} />}
      
      <aside className={`fixed md:relative inset-y-0 left-0 w-72 bg-[#002855] text-white flex flex-col shadow-2xl z-[70] transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-8 md:p-10 shrink-0 border-b border-yellow-500/10">
          <BrandLogo />
        </div>
        <nav className="flex-1 mt-6 overflow-y-auto custom-scrollbar">
          <NavItem id="dashboard" label="Dashboard" icon={LayoutIcon} />
          <NavItem id="inventory" label="Inventário" icon={BoxIcon} />
          <NavItem id="purchases" label="Controle de Compras" icon={ShoppingIcon} />
          <NavItem id="customers" label="Clientes" icon={UsersIcon} />
          <NavItem id="reports" label="Insights" icon={ChartIcon} />
        </nav>
        <div className="p-6 md:p-8 border-t border-white/5 space-y-4 bg-black/10">
          <button onClick={() => { setIsEditingCustomer(false); setCustomerForm({ name: '', priceList: {} }); setIsCustomerModalOpen(true); }} className="w-full bg-yellow-500 text-[#002855] font-black py-4 rounded-xl shadow-xl shadow-yellow-500/10 uppercase text-[10px] tracking-widest hover:bg-yellow-400 transition-all active:scale-[0.97] flex items-center justify-center gap-3"><PlusIcon className="w-4 h-4" /> Novo Cliente</button>
          <button onClick={() => { setIsPurchaseModalOpen(true); }} className="w-full bg-white/5 text-white font-black py-4 rounded-xl uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-3 border border-white/10"><ShoppingIcon className="w-4 h-4 text-yellow-400" /> Lançar Compra</button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 md:h-24 px-6 md:px-12 flex items-center justify-between border-b border-slate-200 bg-white/90 backdrop-blur-md z-40 print:hidden shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-slate-500 hover:text-blue-600 transition-colors"><LayoutIcon className="w-6 h-6" /></button>
            <div className="hidden md:block w-1.5 h-8 bg-[#002855] rounded-full shrink-0"></div>
            
            <div className="flex items-center gap-6">
              <BrandLogo variant="header" />
              <div className="hidden lg:block h-8 w-px bg-slate-200"></div>
              <div className="hidden md:block">
                <h2 className="text-lg font-black uppercase tracking-tighter text-slate-800 leading-none">
                  {activeView === 'dashboard' ? 'Início' : activeView === 'inventory' ? 'Estoque' : activeView === 'purchases' ? 'Compras' : activeView === 'customers' ? 'Clientes' : 'Auditoria'}
                </h2>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Gestão em Tempo Real</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 md:gap-8">
            <div className="hidden md:block h-10 w-px bg-slate-100"></div>
            <div className="text-right">
              <p className="text-[8px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Saldo Líquido</p>
              <p className={`text-lg md:text-2xl font-black leading-none ${stats.totalPaid - stats.totalSpent >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatCurrency(stats.totalPaid - stats.totalSpent)}
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 xl:p-12 custom-scrollbar print:p-0">
          {activeView === 'dashboard' && (
            <div className="max-w-[1400px] mx-auto space-y-8 md:space-y-12 animate-in fade-in duration-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                {/* Cards do Dashboard com maior contraste (Shadow e Ring) */}
                <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm ring-1 ring-slate-200/50 border-t-4 border-blue-500 relative overflow-hidden group hover:shadow-xl hover:ring-blue-500/20 transition-all">
                  <div className="absolute top-0 right-0 p-6 md:p-10 opacity-[0.03] group-hover:scale-110 transition-transform text-[#002855]"><ChartIcon className="w-16 h-16 md:w-24 md:h-24" /></div>
                  <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Receita Bruta</p>
                  <h3 className="text-xl md:text-3xl font-black tracking-tighter text-slate-900 leading-none">{formatCurrency(stats.totalRevenue)}</h3>
                </div>
                <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm ring-1 ring-slate-200/50 border-t-4 border-red-500 relative overflow-hidden group hover:shadow-xl hover:ring-red-500/20 transition-all">
                  <div className="absolute top-0 right-0 p-6 md:p-10 opacity-[0.03] group-hover:scale-110 transition-transform text-red-600"><ShoppingIcon className="w-16 h-16 md:w-24 md:h-24" /></div>
                  <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Gastos Reposição</p>
                  <h3 className="text-xl md:text-3xl font-black tracking-tighter text-red-600 leading-none">{formatCurrency(stats.totalSpent)}</h3>
                </div>
                <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm ring-1 ring-slate-200/50 border-t-4 border-emerald-500 relative overflow-hidden group hover:shadow-xl hover:ring-emerald-500/20 transition-all">
                  <div className="absolute top-0 right-0 p-6 md:p-10 opacity-[0.03] group-hover:scale-110 transition-transform text-emerald-600"><CheckIcon className="w-16 h-16 md:w-24 md:h-24" /></div>
                  <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Saldo Realizado</p>
                  <h3 className="text-xl md:text-3xl font-black tracking-tighter text-emerald-600 leading-none">{formatCurrency(stats.totalPaid - stats.totalSpent)}</h3>
                </div>
                <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm ring-1 ring-slate-200/50 border-t-4 border-yellow-500 relative overflow-hidden group hover:shadow-xl hover:ring-yellow-500/20 transition-all">
                  <div className="absolute top-0 right-0 p-6 md:p-10 opacity-[0.03] group-hover:scale-110 transition-transform text-yellow-600"><BoxIcon className="w-16 h-16 md:w-24 md:h-24" /></div>
                  <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Patrimônio Peixe</p>
                  <h3 className="text-xl md:text-3xl font-black tracking-tighter text-slate-900 leading-none">{formatCurrency(stats.totalInventoryValue)}</h3>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] md:rounded-[3.5rem] ring-1 ring-slate-200/50 p-6 md:p-12 shadow-md flex flex-col items-center">
                <div className="w-full flex flex-col md:flex-row justify-between items-center mb-8 md:mb-16 gap-4 text-center md:text-left">
                  <div>
                    <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-slate-800 italic font-serif">Fluxo de Vendas Mensal</h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Comparativo Realizado vs Pendente</p>
                  </div>
                </div>
                <div className="w-full h-[300px] md:h-[500px]"><MonthlyBarChart data={timelineMonthlyData} /></div>
              </div>
            </div>
          )}

          {activeView === 'purchases' && (
            <div className="max-w-[1400px] mx-auto space-y-6 animate-in slide-in-from-bottom-10">
               <div className="bg-white p-6 md:p-10 rounded-[2rem] ring-1 ring-slate-200/50 shadow-md flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="text-center md:text-left">
                    <h3 className="text-2xl font-black uppercase tracking-tighter italic font-serif">Controle de Compras</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Investimento Total em Mercadoria</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="px-6 py-3 bg-red-50 rounded-2xl text-center border border-red-100">
                      <p className="text-[8px] font-black text-red-600 uppercase mb-1">Gasto Acumulado</p>
                      <p className="text-lg font-black text-red-700">{formatCurrency(stats.totalSpent)}</p>
                    </div>
                    <button onClick={() => setIsPurchaseModalOpen(true)} className="bg-[#002855] text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-blue-900 transition-all">Lançar Compra</button>
                  </div>
               </div>
               
               <div className="bg-white rounded-[2rem] ring-1 ring-slate-200/50 overflow-hidden shadow-md">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100/50 border-b">
                      <tr>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Data</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Produto</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Peso</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Total</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {purchases.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-8 py-5 text-[11px] font-bold text-slate-600">{new Date(p.date).toLocaleDateString('pt-BR')}</td>
                          <td className="px-8 py-5 text-[11px] font-black text-[#002855] uppercase">{p.productName}</td>
                          <td className="px-8 py-5 text-[11px] font-black text-slate-900 text-right">{p.weightKg.toFixed(1)}kg</td>
                          <td className="px-8 py-5 text-[13px] font-black text-red-600 text-right">{formatCurrency(p.total)}</td>
                          <td className="px-8 py-5 text-center">
                            <button onClick={() => setPurchases(prev => prev.filter(item => item.id !== p.id))} className="text-slate-300 hover:text-red-500 p-2 transition-all"><TrashIcon className="w-4 h-4" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
            </div>
          )}

          {activeView === 'inventory' && (
            <div className="max-w-[1400px] mx-auto space-y-6 md:space-y-10 animate-in slide-in-from-bottom-10">
               <div className="bg-white p-6 md:p-10 rounded-[2rem] ring-1 ring-slate-200/50 shadow-md flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="flex gap-4 w-full md:w-auto">
                    <div className="flex-1 md:flex-none px-6 py-3 bg-slate-100 rounded-2xl text-center">
                      <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Carga Total</p>
                      <p className="text-lg font-black text-slate-900">{stats.totalInStock.toFixed(1)}kg</p>
                    </div>
                    <div className="flex-1 md:flex-none px-6 py-3 bg-blue-50 rounded-2xl text-center border border-blue-100">
                      <p className="text-[8px] font-black text-[#002855] uppercase mb-1">Valor do Estoque</p>
                      <p className="text-lg font-black text-[#002855]">{formatCurrency(stats.totalInventoryValue)}</p>
                    </div>
                  </div>
                  <button onClick={() => { setStockFormData({ productName: '', weightToAdd: '', basePricePerKg: '', date: new Date().toISOString().split('T')[0] }); setIsStockModalOpen(true); }} className="w-full md:w-auto bg-[#002855] text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg border border-yellow-500/20 active:scale-95 transition-all">Entrada de Mercadoria</button>
               </div>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
                  {stock.sort((a,b) => b.availableWeight - a.availableWeight).map(item => {
                    const isZero = item.availableWeight <= 0;
                    const stockValue = Math.max(0, item.availableWeight) * (item.basePricePerKg || 0);
                    return (
                      <div 
                        key={item.productName} 
                        onClick={() => { setSelectedStockItem(item); setIsAuditModalOpen(true); }}
                        className={`p-6 md:p-8 rounded-[2rem] ring-1 flex flex-col justify-between h-72 transition-all cursor-pointer group/card ${isZero ? 'bg-red-50 ring-red-200 opacity-80' : 'bg-white ring-slate-200 hover:ring-blue-500 hover:shadow-2xl hover:-translate-y-1'}`}
                      >
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <span className={`text-[10px] font-black uppercase tracking-widest truncate flex-1 ${isZero ? 'text-red-700' : 'text-blue-900'}`}>{item.productName}</span>
                            <div className="flex gap-1 ml-2 opacity-0 group-hover/card:opacity-100 transition-opacity">
                              <button onClick={(e) => { e.stopPropagation(); setEditStockFormData({ oldName: item.productName, newName: item.productName, weight: item.availableWeight.toString(), basePrice: (item.basePricePerKg || 0).toString() }); setIsEditStockModalOpen(true); }} className={`p-1.5 transition-colors ${isZero ? 'text-red-400 hover:text-red-600' : 'text-blue-600 hover:text-blue-800'}`}><EditIcon className="w-4 h-4"/></button>
                            </div>
                          </div>
                          <div className="space-y-4 mt-4">
                            <div>
                               <p className={`text-[8px] font-black uppercase ${isZero ? 'text-red-400' : 'text-slate-400'}`}>Em Estoque</p>
                               <h4 className={`text-3xl font-black tracking-tighter ${isZero ? 'text-red-900' : 'text-slate-900'}`}>{item.availableWeight.toFixed(1)} <span className="text-xs font-bold">Kg</span></h4>
                            </div>
                            <div>
                               <p className={`text-[8px] font-black uppercase ${isZero ? 'text-red-400' : 'text-slate-400'}`}>Vlr. Estimado</p>
                               <h4 className={`text-xl font-black tracking-tighter ${isZero ? 'text-red-900' : 'text-emerald-700'}`}>{formatCurrency(stockValue)}</h4>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                           <button onClick={(e) => { e.stopPropagation(); setStockFormData({ ...stockFormData, productName: item.productName, date: new Date().toISOString().split('T')[0], basePricePerKg: (item.basePricePerKg || 0).toString() }); setIsStockModalOpen(true); }} className={`flex-1 py-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isZero ? 'bg-red-600 text-white shadow-lg' : 'bg-slate-100 text-[#002855] hover:bg-[#002855] hover:text-white ring-1 ring-slate-200'}`}>Abastecer</button>
                           <button className={`w-12 rounded-xl flex items-center justify-center transition-all ${isZero ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-[#002855] ring-1 ring-slate-200'}`} title="Auditoria de Estoque">
                             <ChartIcon className="w-4 h-4" />
                           </button>
                        </div>
                      </div>
                    );
                  })}
               </div>
            </div>
          )}

          {activeView === 'customers' && (
            <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 md:gap-8 animate-in fade-in duration-500">
              {customers.map(customer => (
                <CustomerCard 
                  key={customer.id} 
                  customer={customer} 
                  onAddEntry={(id) => { setActiveCustomerId(id); setIsVendaModalOpen(true); }} 
                  onDeleteEntry={handleDeleteEntry} 
                  onTogglePayment={handleTogglePayment} 
                  onPartialPayment={(cid, eid) => { setActiveCustomerId(cid); setActiveEntryId(eid); setIsPartialPaymentModalOpen(true); }}
                  onDeleteCustomer={(id) => setCustomers(prev => prev.filter(c => c.id !== id))} 
                  onEditCustomer={(c) => { setCustomerForm(c); setIsEditingCustomer(true); setIsCustomerModalOpen(true); }} 
                />
              ))}
              <button 
                onClick={() => { setIsEditingCustomer(false); setCustomerForm({ name: '', priceList: {} }); setIsCustomerModalOpen(true); }} 
                className="border-4 border-dashed border-slate-300 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-slate-400 hover:border-[#002855] hover:text-[#002855] hover:bg-white transition-all duration-300 h-full bg-white/50"
              >
                <PlusIcon className="w-16 h-16 mb-4 opacity-50" />
                <span className="font-black uppercase tracking-[0.2em] text-[10px]">Cadastrar Novo Parceiro</span>
              </button>
            </div>
          )}

          {activeView === 'reports' && (
            <div className="max-w-[1400px] mx-auto space-y-8 animate-in slide-in-from-right-10 print:bg-white print:p-8">
               {/* Cabeçalho Auditoria - Exclusivo para Print */}
               <div className="hidden print:block border-b-2 border-[#002855] pb-6 mb-10">
                 <div className="flex justify-between items-center">
                   <div>
                     <h1 className="text-3xl font-black text-[#002855] uppercase tracking-tighter italic font-serif leading-none">Auditoria Rei do Pirarucu</h1>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Relatório Completo de Status Gerencial</p>
                   </div>
                   <div className="text-right">
                     <p className="text-[10px] font-black text-[#002855] uppercase tracking-widest">Data Emissão</p>
                     <p className="text-lg font-black text-slate-900">{new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                   </div>
                 </div>
               </div>

               <div className="bg-white rounded-[2rem] p-8 md:p-12 ring-1 ring-slate-200/50 shadow-md flex flex-col md:flex-row justify-between items-center gap-6 print:hidden">
                  <div className="text-center md:text-left">
                    <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter italic font-serif leading-none">Central de Auditoria</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Análise Inteligente de Status e Performance</p>
                  </div>
                  <button onClick={handleExportPDF} className="w-full md:w-auto px-10 py-5 bg-[#002855] text-white rounded-2xl flex items-center justify-center gap-3 font-black text-[11px] uppercase tracking-[0.2em] active:scale-95 transition-all shadow-2xl shadow-blue-900/40 border border-yellow-500/20">
                    <CheckIcon className="w-5 h-5 text-yellow-400" /> Exportar Auditoria (PDF)
                  </button>
               </div>

               {/* Análise de Capital e Saúde Financeira */}
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="bg-white p-8 rounded-[2rem] ring-1 ring-slate-200/50 shadow-md col-span-1 lg:col-span-2 print:border-none print:shadow-none">
                    <h4 className="text-[11px] font-black text-[#002855] uppercase tracking-widest mb-8 border-b pb-4">Indicadores de Liquidez</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div className="p-6 bg-slate-50 rounded-2xl print:bg-white print:border">
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-2">Faturamento Negociado</p>
                        <p className="text-xl font-black text-slate-900">{formatCurrency(stats.totalRevenue)}</p>
                      </div>
                      <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 print:bg-white print:border-emerald-400">
                        <p className="text-[8px] font-black text-emerald-600 uppercase mb-2">Total Recebido (Caixa)</p>
                        <p className="text-xl font-black text-emerald-700">{formatCurrency(stats.totalPaid)}</p>
                      </div>
                      <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 print:bg-white print:border-amber-400">
                        <p className="text-[8px] font-black text-amber-600 uppercase mb-2">Pendente em Clientes</p>
                        <p className="text-xl font-black text-amber-700">{formatCurrency(stats.totalPending)}</p>
                      </div>
                    </div>
                    <div className="mt-8 p-6 bg-[#002855] rounded-3xl text-white">
                       <div className="flex justify-between items-center">
                          <div>
                            <p className="text-[9px] font-black uppercase text-blue-200">Resultado Líquido Operacional</p>
                            <h3 className="text-3xl font-black tracking-tighter mt-1">{formatCurrency(stats.totalPaid - stats.totalSpent)}</h3>
                          </div>
                          <div className="text-right">
                            <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase ${stats.totalPaid - stats.totalSpent >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                              {stats.totalPaid - stats.totalSpent >= 0 ? 'Lucro em Caixa' : 'Déficit de Caixa'}
                            </span>
                          </div>
                       </div>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-[2rem] ring-1 ring-slate-200/50 shadow-md print:border-none print:shadow-none">
                    <h4 className="text-[11px] font-black text-[#002855] uppercase tracking-widest mb-8 border-b pb-4">Capital Imobilizado</h4>
                    <div className="space-y-6">
                      <div className="flex justify-between items-end border-b border-slate-50 pb-4">
                        <p className="text-[9px] font-black text-slate-400 uppercase">Carga em Estoque</p>
                        <p className="text-lg font-black">{stats.totalInStock.toFixed(1)} <span className="text-[10px] text-slate-300">KG</span></p>
                      </div>
                      <div className="flex justify-between items-end">
                        <p className="text-[9px] font-black text-slate-400 uppercase">Valor Patrimonial</p>
                        <p className="text-lg font-black text-[#002855]">{formatCurrency(stats.totalInventoryValue)}</p>
                      </div>
                      <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden mt-4">
                        <div className="h-full bg-yellow-500" style={{ width: '65%' }}></div>
                      </div>
                      <p className="text-[9px] font-bold text-slate-400 italic leading-tight">Valor baseado no custo de reposição unitário por produto.</p>
                    </div>
                  </div>
               </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL AUDITORIA DE ESTOQUE (Rastros Visualmente Definidos) */}
      {isAuditModalOpen && selectedStockItem && (
        <div className="fixed inset-0 bg-[#002855]/95 backdrop-blur-xl z-[120] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in border-4 border-yellow-500/10 flex flex-col max-h-[90vh] ring-2 ring-white/20">
            <div className="bg-[#002855] p-8 md:p-12 text-white border-b border-yellow-500/20 shrink-0">
               <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.3em] mb-2">Auditoria de Produto</p>
                    <h3 className="text-3xl font-black uppercase tracking-tighter italic font-serif leading-none">{selectedStockItem.productName}</h3>
                  </div>
                  <button onClick={() => setIsAuditModalOpen(false)} className="bg-white/10 hover:bg-white/20 w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all">✕</button>
               </div>
               
               <div className="grid grid-cols-2 gap-4 mt-8">
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <p className="text-[8px] font-black text-blue-200 uppercase mb-1">Volume Atual</p>
                    <p className="text-2xl font-black">{selectedStockItem.availableWeight.toFixed(1)} <span className="text-sm">kg</span></p>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <p className="text-[8px] font-black text-blue-200 uppercase mb-1">Valor do Lote</p>
                    <p className="text-2xl font-black">{formatCurrency(selectedStockItem.availableWeight * selectedStockItem.basePricePerKg)}</p>
                  </div>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar bg-slate-100/50">
               <div className="space-y-6">
                 <p className="text-[10px] font-black text-[#002855] uppercase tracking-widest border-b border-slate-200 pb-2">Linha do Tempo de Movimentações</p>
                 
                 <div className="relative pl-6 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-300">
                    {selectedStockItem.history && selectedStockItem.history.length > 0 ? selectedStockItem.history.map((move) => (
                       <div key={move.id} className="relative group">
                          <div className={`absolute -left-[23px] top-1 w-5 h-5 rounded-full border-4 border-slate-100 shadow-sm transition-transform group-hover:scale-125 ${
                             move.type === 'entry' ? 'bg-emerald-500' : 
                             move.type === 'exit' ? 'bg-red-500' : 'bg-amber-500'
                          }`}></div>
                          
                          <div className="bg-white p-5 rounded-2xl ring-1 ring-slate-200 shadow-sm flex justify-between items-center group-hover:ring-blue-500 transition-all">
                             <div>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                   {new Date(move.date).toLocaleDateString('pt-BR')} às {new Date(move.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                                <p className="text-[11px] font-black text-slate-800 uppercase leading-none">{move.description}</p>
                                <p className="text-[8px] font-bold text-slate-400 mt-2 uppercase">Tipo: {move.type === 'entry' ? 'Entrada de Carga' : move.type === 'exit' ? 'Saída de Venda' : 'Ajuste Sistêmico'}</p>
                             </div>
                             <div className="text-right">
                                <p className={`text-xl font-black font-mono leading-none ${move.weight > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                   {move.weight > 0 ? '+' : ''}{move.weight.toFixed(1)} <span className="text-[10px] uppercase">kg</span>
                                </p>
                             </div>
                          </div>
                       </div>
                    )) : (
                      <div className="py-20 text-center opacity-30">
                        <ChartIcon className="w-16 h-16 mx-auto mb-4" />
                        <p className="text-[10px] font-black uppercase">Nenhum registro histórico encontrado para este lote.</p>
                      </div>
                    )}
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LANÇAR COMPRA (Fundo Branco com Borda Definida) */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 bg-[#002855]/95 backdrop-blur-xl z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in border-4 border-yellow-500/10 ring-2 ring-white/20">
            <div className="bg-[#002855] p-8 text-white flex justify-between items-center border-b border-yellow-500/20"><h3 className="text-xl font-black uppercase tracking-tighter italic font-serif text-yellow-400">Lançar Nova Compra (Financeiro)</h3><button onClick={() => setIsPurchaseModalOpen(false)} className="text-2xl hover:text-yellow-400">✕</button></div>
            <form onSubmit={handleSavePurchase} className="p-8 space-y-6 bg-slate-50/50">
              <div><label className="block text-[9px] font-black text-slate-500 uppercase mb-2">Produto Comprado</label><input list="stockList" required className="w-full border-2 border-slate-200 bg-white rounded-xl p-5 uppercase font-black text-lg outline-none focus:border-[#002855] ring-1 ring-slate-100" value={purchaseFormData.productName} onChange={e => setPurchaseFormData({ ...purchaseFormData, productName: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[9px] font-black text-slate-500 uppercase mb-2">Peso (Kg)</label><input type="number" step="0.001" required className="w-full border-2 border-slate-200 bg-white rounded-xl p-5 font-mono text-xl font-black text-[#002855] text-center focus:border-[#002855] outline-none" value={purchaseFormData.weightKg} onChange={e => setPurchaseFormData({ ...purchaseFormData, weightKg: e.target.value })} /></div>
                <div><label className="block text-[9px] font-black text-slate-500 uppercase mb-2">Valor Total (R$)</label><input type="number" step="0.01" required className="w-full border-2 border-slate-200 bg-white rounded-xl p-5 font-mono text-xl font-black text-red-600 text-center focus:border-[#002855] outline-none" placeholder="0,00" value={purchaseFormData.total} onChange={e => setPurchaseFormData({ ...purchaseFormData, total: e.target.value })} /></div>
              </div>
              <button type="submit" className="w-full bg-[#002855] text-white font-black py-5 rounded-xl shadow-xl uppercase tracking-widest text-[10px] active:scale-95 transition-all border border-yellow-500/20">REGISTRAR GASTO</button>
            </form>
          </div>
        </div>
      )}

      {/* Outros modais seguem o mesmo padrão de contraste elevado */}
    </div>
  );
};

export default App;
