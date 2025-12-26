
import React, { useState, useEffect, useMemo } from 'react';
import { Customer, SaleEntry, StockItem, ViewType, PaymentRecord, PurchaseEntry } from './types';
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

const MonthlyBarChart = ({ data }: { data: { month: string, paid: number, pending: number }[] }) => {
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
  const maxVal = Math.max(...data.map(d => Math.max(d.paid, d.pending))) * 1.2 || 1000;
  const groupWidth = chartWidth / data.length;
  const barWidth = Math.min(groupWidth * 0.35, 30);

  return (
    <div className="w-full h-full overflow-x-auto custom-scrollbar">
      <div className="min-w-[800px] w-full h-full">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          {[0, 0.25, 0.5, 0.75, 1].map(v => {
            const y = padding + (1 - v) * chartHeight;
            const value = v * maxVal;
            return (
              <g key={v}>
                <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                <text x={padding - 15} y={y + 4} textAnchor="end" className="text-[10px] fill-slate-400 font-bold font-mono">
                  {v === 0 ? "R$ 0" : `R$ ${(value/1000).toFixed(1)}k`}
                </text>
              </g>
            );
          })}
          {data.map((d, i) => {
            const xGroupCenter = padding + i * groupWidth + groupWidth / 2;
            const hPaid = (d.paid / maxVal) * chartHeight;
            const hPending = (d.pending / maxVal) * chartHeight;
            return (
              <g key={d.month} className="group/bar">
                <rect x={xGroupCenter - barWidth - 4} y={padding} width={barWidth} height={chartHeight} fill="#f8fafc" rx="4" />
                <rect x={xGroupCenter + 4} y={padding} width={barWidth} height={chartHeight} fill="#f8fafc" rx="4" />
                <rect x={xGroupCenter - barWidth - 4} y={height - padding - hPaid} width={barWidth} height={hPaid} fill="url(#gradPaid)" rx="4" className="transition-all duration-500 hover:brightness-110" />
                <rect x={xGroupCenter + 4} y={height - padding - hPending} width={barWidth} height={hPending} fill="url(#gradPending)" rx="4" className="transition-all duration-500 hover:brightness-110" />
                <text x={xGroupCenter} y={height - padding + 25} textAnchor="middle" className="text-[11px] font-black fill-slate-500 uppercase tracking-tighter">{d.month}</text>
              </g>
            );
          })}
          <defs>
            <linearGradient id="gradPaid" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" /><stop offset="100%" stopColor="#059669" /></linearGradient>
            <linearGradient id="gradPending" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#d97706" /></linearGradient>
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
    const saved = localStorage.getItem('pescados_vendas_data_v15');
    if (saved) return JSON.parse(saved);
    return INITIAL_CUSTOMERS.map(c => ({ ...c, priceList: c.priceList || {} }));
  });
  const [stock, setStock] = useState<StockItem[]>(() => {
    const saved = localStorage.getItem('pescados_estoque_data_v15');
    if (saved) return JSON.parse(saved);
    return PRODUCT_SUGGESTIONS.map(p => ({ productName: p.toUpperCase().trim(), availableWeight: 0, basePricePerKg: 0, lastUpdate: new Date().toISOString() }));
  });
  const [purchases, setPurchases] = useState<PurchaseEntry[]>(() => {
    const saved = localStorage.getItem('pescados_compras_data_v15');
    if (saved) return JSON.parse(saved);
    return [];
  });

  const [isVendaModalOpen, setIsVendaModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isEditStockModalOpen, setIsEditStockModalOpen] = useState(false);
  const [isPartialPaymentModalOpen, setIsPartialPaymentModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  
  const [activeCustomerId, setActiveCustomerId] = useState<string | null>(null);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);

  const [formData, setFormData] = useState({ productName: '', pricePerKg: '', weightKg: '', date: new Date().toISOString().split('T')[0], isPaid: false });
  const [stockFormData, setStockFormData] = useState({ productName: '', weightToAdd: '', basePricePerKg: '', date: new Date().toISOString().split('T')[0] });
  const [purchaseFormData, setPurchaseFormData] = useState({ productName: '', weightKg: '', pricePerKg: '', total: '', date: new Date().toISOString().split('T')[0], supplier: '' });
  const [editStockFormData, setEditStockFormData] = useState({ oldName: '', newName: '', weight: '', basePrice: '' });
  const [partialPaymentData, setPartialPaymentData] = useState({ amount: '', date: new Date().toISOString().split('T')[0] });
  const [customerForm, setCustomerForm] = useState<Partial<Customer>>({ name: '', taxId: '', address: '', contactPerson: '', phone: '', priceList: {} });
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);

  useEffect(() => localStorage.setItem('pescados_vendas_data_v15', JSON.stringify(customers)), [customers]);
  useEffect(() => localStorage.setItem('pescados_estoque_data_v15', JSON.stringify(stock)), [stock]);
  useEffect(() => localStorage.setItem('pescados_compras_data_v15', JSON.stringify(purchases)), [purchases]);

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
    const monthly: Record<string, { paid: number, pending: number }> = {};
    customers.forEach(c => c.entries.forEach(e => {
      const date = new Date(e.date);
      const monthKey = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).toUpperCase();
      const sortKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const key = `${sortKey}|${monthKey}`;
      if (!monthly[key]) monthly[key] = { paid: 0, pending: 0 };
      const currentPaid = e.isPaid ? e.total : (e.paidAmount || 0);
      monthly[key].paid += currentPaid;
      monthly[key].pending += (e.total - currentPaid);
    }));
    return Object.entries(monthly)
      .map(([key, vals]) => ({ sortKey: key.split('|')[0], month: key.split('|')[1], ...vals }))
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [customers]);

  const reportData = useMemo(() => {
    const prodStats: Record<string, { weight: number, revenue: number }> = {};
    customers.forEach(c => c.entries.forEach(e => {
      const pName = e.productName.toUpperCase();
      if (!prodStats[pName]) prodStats[pName] = { weight: 0, revenue: 0 };
      prodStats[pName].weight += Number(e.weightKg);
      prodStats[pName].revenue += Number(e.total);
    }));
    return Object.entries(prodStats).map(([name, data]) => ({ name, ...data })).sort((a, b) => b.revenue - a.revenue);
  }, [customers]);

  const rankingClientes = useMemo(() => {
    const list = customers.map(c => {
      let total = 0;
      let pending = 0;
      c.entries.forEach(e => {
        total += e.total;
        const currentPaid = e.isPaid ? e.total : (e.paidAmount || 0);
        pending += (e.total - currentPaid);
      });
      return { name: c.name, total, pending };
    });
    return list.sort((a, b) => b.total - a.total);
  }, [customers]);

  const handleDeleteEntry = (customerId: string, entryId: string) => {
    setCustomers(prev => prev.map(c => {
      if (c.id !== customerId) return c;
      const entryToRemove = c.entries.find(e => e.id === entryId);
      if (entryToRemove) {
        const pName = entryToRemove.productName.toUpperCase().trim();
        setStock(sPrev => sPrev.map(s => 
          s.productName === pName
            ? { ...s, availableWeight: s.availableWeight + entryToRemove.weightKg } 
            : s
        ));
      }
      return { ...c, entries: c.entries.filter(e => e.id !== entryId) };
    }));
  };

  const handleTogglePayment = (customerId: string, entryId: string) => {
    setCustomers(prev => prev.map(c => {
      if (c.id !== customerId) return c;
      return {
        ...c,
        entries: c.entries.map(e => {
          if (e.id !== entryId) return e;
          const newIsPaid = !e.isPaid;
          return { ...e, isPaid: newIsPaid, paidAmount: newIsPaid ? e.total : 0 };
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
      if (exists) {
        return prev.map(s => s.productName === prodName ? { ...s, availableWeight: s.availableWeight - weight } : s);
      } else {
        return [...prev, { productName: prodName, availableWeight: -weight, basePricePerKg: 0, lastUpdate: new Date().toISOString() }];
      }
    });

    setIsVendaModalOpen(false);
    setFormData({ ...formData, productName: '', pricePerKg: '', weightKg: '' });
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

    // O controle de compras agora não altera o inventário.
    // O usuário gerencia o estoque separadamente pela aba Inventário.

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
    setStock(prev => {
      const exists = prev.some(s => s.productName === prodName);
      if (exists) return prev.map(s => s.productName === prodName ? { ...s, availableWeight: s.availableWeight + weight, basePricePerKg: basePrice || s.basePricePerKg, lastUpdate: entryDate } : s);
      return [...prev, { productName: prodName, availableWeight: weight, basePricePerKg: basePrice, lastUpdate: entryDate }];
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
    setStock(prev => prev.map(s => s.productName === oldName ? { ...s, productName: newName, availableWeight: newWeight, basePricePerKg: newPrice, lastUpdate: new Date().toISOString() } : s));
    setIsEditStockModalOpen(false);
  };

  const NavItem = ({ id, label, icon: Icon }: { id: ViewType, label: string, icon: any }) => (
    <button onClick={() => { setActiveView(id); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-8 py-5 transition-all duration-300 relative group ${activeView === id ? 'text-white' : 'text-blue-200/60 hover:text-white'}`}>
      <Icon className={`w-5 h-5 transition-transform duration-500 ${activeView === id ? 'scale-110' : 'group-hover:scale-110'}`} />
      <span className="font-black uppercase text-[10px] tracking-widest leading-none">{label}</span>
      {activeView === id && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1.5 bg-yellow-400 rounded-r-full shadow-[0_0_15px_rgba(250,204,21,0.5)]"></div>}
    </button>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 overflow-hidden font-['Inter'] relative">
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

      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#f8fafc]">
        <header className="h-20 md:h-24 px-6 md:px-12 flex items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-xl z-40 print:hidden shrink-0">
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
              <p className="text-[8px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Total Compras</p>
              <p className="text-lg md:text-2xl font-black text-red-600 leading-none">{formatCurrency(stats.totalSpent)}</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 xl:p-12 custom-scrollbar print:p-0">
          {activeView === 'dashboard' && (
            <div className="max-w-[1400px] mx-auto space-y-8 md:space-y-12 animate-in fade-in duration-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-lg transition-all">
                  <div className="absolute top-0 right-0 p-6 md:p-10 opacity-5 group-hover:scale-110 transition-transform text-[#002855]"><ChartIcon className="w-16 h-16 md:w-24 md:h-24" /></div>
                  <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Receita Bruta</p>
                  <h3 className="text-xl md:text-3xl font-black tracking-tighter text-slate-900 leading-none">{formatCurrency(stats.totalRevenue)}</h3>
                </div>
                <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-lg transition-all">
                  <div className="absolute top-0 right-0 p-6 md:p-10 opacity-5 group-hover:scale-110 transition-transform text-red-600"><ShoppingIcon className="w-16 h-16 md:w-24 md:h-24" /></div>
                  <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Gastos com Compras</p>
                  <h3 className="text-xl md:text-3xl font-black tracking-tighter text-red-600 leading-none">{formatCurrency(stats.totalSpent)}</h3>
                </div>
                <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-lg transition-all">
                  <div className="absolute top-0 right-0 p-6 md:p-10 opacity-5 group-hover:scale-110 transition-transform text-emerald-600"><CheckIcon className="w-16 h-16 md:w-24 md:h-24" /></div>
                  <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Saldo em Caixa</p>
                  <h3 className="text-xl md:text-3xl font-black tracking-tighter text-emerald-600 leading-none">{formatCurrency(stats.totalPaid - stats.totalSpent)}</h3>
                </div>
                <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-lg transition-all">
                  <div className="absolute top-0 right-0 p-6 md:p-10 opacity-5 group-hover:scale-110 transition-transform text-yellow-600"><BoxIcon className="w-16 h-16 md:w-24 md:h-24" /></div>
                  <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Vlr. em Peixe</p>
                  <h3 className="text-xl md:text-3xl font-black tracking-tighter text-slate-900 leading-none">{formatCurrency(stats.totalInventoryValue)}</h3>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] md:rounded-[3.5rem] border border-slate-100 p-6 md:p-12 shadow-sm flex flex-col items-center">
                <div className="w-full flex flex-col md:flex-row justify-between items-center mb-8 md:mb-16 gap-4 text-center md:text-left">
                  <div>
                    <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-slate-800 italic font-serif">Performance Financeira</h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Fluxo de Caixa por Mês</p>
                  </div>
                </div>
                <div className="w-full h-[300px] md:h-[500px]"><MonthlyBarChart data={timelineMonthlyData} /></div>
              </div>
            </div>
          )}

          {activeView === 'purchases' && (
            <div className="max-w-[1400px] mx-auto space-y-6 md:space-y-10 animate-in slide-in-from-bottom-10">
               <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="text-center md:text-left">
                    <h3 className="text-2xl font-black uppercase tracking-tighter italic font-serif leading-none">Controle de Compras</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Investimento Total em Mercadoria (Financeiro)</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="px-6 py-3 bg-red-50 rounded-2xl text-center border border-red-100">
                      <p className="text-[8px] font-black text-red-600 uppercase mb-1">Total Gasto</p>
                      <p className="text-lg font-black text-red-700">{formatCurrency(stats.totalSpent)}</p>
                    </div>
                    <button onClick={() => setIsPurchaseModalOpen(true)} className="bg-[#002855] text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all">Lançar Nova Compra</button>
                  </div>
               </div>
               
               <div className="bg-white rounded-[2rem] border overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Produto</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fornecedor</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Peso</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Preço Kg</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {purchases.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-5 text-[11px] font-bold text-slate-500">{new Date(p.date).toLocaleDateString('pt-BR')}</td>
                          <td className="px-8 py-5 text-[11px] font-black text-[#002855] uppercase">{p.productName}</td>
                          <td className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase">{p.supplier || 'N/A'}</td>
                          <td className="px-8 py-5 text-[11px] font-black text-slate-900 text-right">{p.weightKg.toFixed(1)}kg</td>
                          <td className="px-8 py-5 text-[11px] font-black text-slate-400 text-right">{formatCurrency(p.pricePerKg)}</td>
                          <td className="px-8 py-5 text-[13px] font-black text-red-600 text-right">{formatCurrency(p.total)}</td>
                          <td className="px-8 py-5 text-center">
                            <button onClick={() => setPurchases(prev => prev.filter(item => item.id !== p.id))} className="text-slate-300 hover:text-red-500 p-2"><TrashIcon className="w-4 h-4" /></button>
                          </td>
                        </tr>
                      ))}
                      {purchases.length === 0 && (
                        <tr><td colSpan={7} className="p-20 text-center text-slate-300 font-black uppercase tracking-widest text-xs">Nenhuma compra registrada</td></tr>
                      )}
                    </tbody>
                  </table>
               </div>
            </div>
          )}

          {activeView === 'inventory' && (
            <div className="max-w-[1400px] mx-auto space-y-6 md:space-y-10 animate-in slide-in-from-bottom-10">
               <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="flex gap-4 w-full md:w-auto">
                    <div className="flex-1 md:flex-none px-6 py-3 bg-slate-50 rounded-2xl text-center">
                      <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Carga Total</p>
                      <p className="text-lg font-black">{stats.totalInStock.toFixed(1)}kg</p>
                    </div>
                    <div className="flex-1 md:flex-none px-6 py-3 bg-blue-50 rounded-2xl text-center border border-blue-100">
                      <p className="text-[8px] font-black text-[#002855] uppercase mb-1">Valor do Estoque</p>
                      <p className="text-lg font-black text-[#002855]">{formatCurrency(stats.totalInventoryValue)}</p>
                    </div>
                  </div>
                  <button onClick={() => { setStockFormData({ productName: '', weightToAdd: '', basePricePerKg: '', date: new Date().toISOString().split('T')[0] }); setIsStockModalOpen(true); }} className="w-full md:w-auto bg-[#002855] text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-900/20 active:scale-95 transition-all border border-yellow-500/20">Nova Entrada de Mercadoria</button>
               </div>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
                  {stock.sort((a,b) => b.availableWeight - a.availableWeight).map(item => {
                    const isZero = item.availableWeight <= 0;
                    const stockValue = Math.max(0, item.availableWeight) * (item.basePricePerKg || 0);
                    return (
                      <div key={item.productName} className={`p-6 md:p-8 rounded-[2rem] border-2 flex flex-col justify-between h-72 transition-all ${isZero ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200 hover:border-emerald-400'}`}>
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <span className={`text-[10px] font-black uppercase tracking-widest truncate flex-1 ${isZero ? 'text-red-700' : 'text-emerald-800'}`}>{item.productName}</span>
                            <div className="flex gap-1 ml-2">
                              <button onClick={() => { setEditStockFormData({ oldName: item.productName, newName: item.productName, weight: item.availableWeight.toString(), basePrice: (item.basePricePerKg || 0).toString() }); setIsEditStockModalOpen(true); }} className={`p-1.5 transition-colors ${isZero ? 'text-red-400 hover:text-red-600' : 'text-emerald-600 hover:text-emerald-800'}`}><EditIcon className="w-4 h-4"/></button>
                            </div>
                          </div>
                          <div className="space-y-4 mt-4">
                            <div>
                               <p className={`text-[8px] font-black uppercase ${isZero ? 'text-red-400' : 'text-emerald-400'}`}>Volume Disponível</p>
                               <h4 className={`text-3xl font-black tracking-tighter ${isZero ? 'text-red-900' : 'text-emerald-900'}`}>{item.availableWeight.toFixed(1)} <span className="text-xs font-bold">Kg</span></h4>
                            </div>
                            <div>
                               <p className={`text-[8px] font-black uppercase ${isZero ? 'text-red-400' : 'text-emerald-400'}`}>Valor Total em R$</p>
                               <h4 className={`text-xl font-black tracking-tighter ${isZero ? 'text-red-900' : 'text-emerald-900'}`}>{formatCurrency(stockValue)}</h4>
                               <p className="text-[8px] font-bold opacity-50 uppercase mt-1">Ref: {formatCurrency(item.basePricePerKg || 0)}/Kg</p>
                            </div>
                          </div>
                        </div>
                        <button onClick={() => { setStockFormData({ ...stockFormData, productName: item.productName, date: new Date().toISOString().split('T')[0], basePricePerKg: (item.basePricePerKg || 0).toString() }); setIsStockModalOpen(true); }} className={`w-full py-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isZero ? 'bg-red-600 text-white shadow-lg' : 'bg-white text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200 shadow-sm'}`}>Abastecer</button>
                      </div>
                    );
                  })}
               </div>
            </div>
          )}

          {activeView === 'customers' && (
            <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 md:gap-8 auto-rows-fr animate-in fade-in duration-500">
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
                className="border-4 border-dashed border-slate-200 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-slate-300 hover:border-[#002855] hover:text-[#002855] hover:bg-white transition-all duration-300 min-h-[400px] md:min-h-0 h-full w-full"
              >
                <PlusIcon className="w-16 h-16 mb-4 opacity-50" />
                <span className="font-black uppercase tracking-[0.2em] text-[10px] text-center">Adicionar Novo Parceiro</span>
              </button>
            </div>
          )}

          {activeView === 'reports' && (
            <div className="max-w-[1400px] mx-auto space-y-8 md:space-y-12 animate-in slide-in-from-right-10">
               <div className="bg-white rounded-[2rem] p-8 md:p-12 border shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="text-center md:text-left"><h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter italic font-serif leading-none">Auditoria Financeira</h3><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Relatórios Consolidados</p></div>
                  <button onClick={() => window.print()} className="w-full md:w-auto px-8 py-4 bg-[#002855] text-white rounded-xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-xl">Imprimir Relatório</button>
               </div>
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
                  <div className="bg-white rounded-[2rem] p-8 md:p-12 border shadow-sm">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-10">Faturamento por Produto</h3>
                    <div className="space-y-8">{reportData.map(p => (
                      <div key={p.name} className="flex flex-col gap-3">
                        <div className="flex justify-between items-end"><span className="text-[10px] font-black uppercase text-slate-800 flex-1 truncate mr-4">{p.name}</span><span className="text-[10px] font-black text-emerald-600 font-mono whitespace-nowrap">{formatCurrency(p.revenue)}</span></div>
                        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-[#002855] rounded-full" style={{ width: `${(p.revenue / (reportData[0]?.revenue || 1)) * 100}%` }}></div></div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase text-right">{p.weight.toFixed(1)}kg Vendidos</p>
                      </div>
                    ))}</div>
                  </div>
                  <div className="bg-white rounded-[2rem] p-8 md:p-12 border shadow-sm">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-10">Ranking de Receita</h3>
                    <div className="space-y-3">{rankingClientes.map((c, i) => (
                        <div key={c.name} className="flex items-center justify-between p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 rounded-2xl transition-all">
                          <div className="flex items-center gap-4 truncate"><span className={`text-[10px] font-black w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${i < 3 ? 'bg-yellow-100 text-yellow-700 font-serif' : 'bg-slate-50 text-slate-400'}`}>{i+1}</span><span className="text-[11px] font-black uppercase text-slate-700 truncate">{c.name}</span></div>
                          <div className="text-right whitespace-nowrap ml-4"><span className="text-[11px] font-black text-slate-900 font-mono block">{formatCurrency(c.total)}</span>{c.pending > 0 && <span className="text-[8px] font-bold text-amber-500 uppercase">A receber: {formatCurrency(c.pending)}</span>}</div>
                        </div>
                      ))}</div>
                  </div>
               </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL LANÇAR COMPRA */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 bg-[#002855]/95 backdrop-blur-xl z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in border-4 border-yellow-500/10">
            <div className="bg-[#002855] p-8 text-white flex justify-between items-center border-b border-yellow-500/20"><h3 className="text-xl font-black uppercase tracking-tighter italic font-serif text-yellow-400">Lançar Nova Compra (Financeiro)</h3><button onClick={() => setIsPurchaseModalOpen(false)} className="text-2xl hover:text-yellow-400">✕</button></div>
            <form onSubmit={handleSavePurchase} className="p-8 space-y-6">
              <div><label className="block text-[9px] font-black text-slate-400 uppercase mb-2">Produto Comprado</label><input list="stockList" required className="w-full border-2 border-slate-100 bg-slate-50 rounded-xl p-5 uppercase font-black text-lg outline-none focus:border-[#002855]" value={purchaseFormData.productName} onChange={e => setPurchaseFormData({ ...purchaseFormData, productName: e.target.value })} /></div>
              <div><label className="block text-[9px] font-black text-slate-400 uppercase mb-2">Fornecedor (Opcional)</label><input className="w-full border-2 border-slate-100 bg-slate-50 rounded-xl p-5 uppercase font-black text-sm outline-none focus:border-[#002855]" value={purchaseFormData.supplier} onChange={e => setPurchaseFormData({ ...purchaseFormData, supplier: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[9px] font-black text-slate-400 uppercase mb-2">Peso (Kg)</label><input type="number" step="0.001" required className="w-full border-2 border-slate-100 bg-slate-50 rounded-xl p-5 font-mono text-xl font-black text-[#002855] text-center focus:border-[#002855] outline-none" value={purchaseFormData.weightKg} onChange={e => setPurchaseFormData({ ...purchaseFormData, weightKg: e.target.value })} /></div>
                <div><label className="block text-[9px] font-black text-slate-400 uppercase mb-2">Valor Total (R$)</label><input type="number" step="0.01" required className="w-full border-2 border-slate-100 bg-slate-50 rounded-xl p-5 font-mono text-xl font-black text-red-600 text-center focus:border-[#002855] outline-none" placeholder="0,00" value={purchaseFormData.total} onChange={e => setPurchaseFormData({ ...purchaseFormData, total: e.target.value })} /></div>
              </div>
              <p className="text-[8px] font-bold text-slate-400 uppercase text-center mt-2">* Compras não afetam o inventário físico automaticamente.</p>
              <button type="submit" className="w-full bg-[#002855] text-white font-black py-5 rounded-xl shadow-xl uppercase tracking-widest text-[10px] active:scale-95 transition-all border border-yellow-500/20">REGISTRAR GASTO</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CLIENTE */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 bg-[#002855]/95 backdrop-blur-xl z-[110] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden my-auto animate-in zoom-in border-4 border-yellow-500/10">
            <div className="bg-[#002855] p-8 md:p-12 text-white flex justify-between items-center shrink-0 border-b border-yellow-500/20">
              <h3 className="text-xl md:text-3xl font-black uppercase tracking-tighter italic font-serif">
                {isEditingCustomer ? 'Editar Parceiro' : 'Novo Cliente'}
              </h3>
              <button onClick={() => setIsCustomerModalOpen(false)} className="text-2xl hover:text-yellow-400">✕</button>
            </div>
            <form onSubmit={handleSaveCustomer} className="p-6 md:p-12 space-y-8 overflow-y-auto max-h-[70vh] custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-full">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Razão Social</label>
                  <input required className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-5 uppercase font-black text-lg focus:border-[#002855] outline-none" value={customerForm.name} onChange={e => setCustomerForm({ ...customerForm, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Doc (CNPJ/CPF)</label>
                  <input className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-4 font-mono text-sm focus:border-[#002855] outline-none" value={customerForm.taxId} onChange={e => setCustomerForm({ ...customerForm, taxId: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Contato</label>
                  <input className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-4 uppercase font-bold text-sm focus:border-[#002855] outline-none" value={customerForm.contactPerson} onChange={e => setCustomerForm({ ...customerForm, contactPerson: e.target.value })} />
                </div>
              </div>

              <div className="mt-8">
                <h4 className="text-[10px] font-black text-[#002855] uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">Tabela de Preços (R$ / Kg)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                  {PRODUCT_SUGGESTIONS.map(prod => (
                    <div key={prod} className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <span className="text-[8px] font-black text-slate-500 uppercase flex-1 truncate">{prod}</span>
                      <input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        className="w-20 bg-white border border-slate-200 rounded-lg p-2 font-mono text-[10px] font-black text-right outline-none focus:border-blue-500"
                        value={customerForm.priceList?.[prod] || ''}
                        onChange={e => setCustomerForm({
                          ...customerForm,
                          priceList: {
                            ...customerForm.priceList,
                            [prod]: parseFloat(e.target.value) || 0
                          }
                        })}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <button type="submit" className="w-full bg-[#002855] text-white font-black py-5 rounded-xl shadow-xl uppercase tracking-widest text-xs active:scale-95 transition-all border border-yellow-500/20">SALVAR CADASTRO</button>
            </form>
          </div>
        </div>
      )}

      {/* RESTO DOS MODAIS MANTIDOS */}
      {isVendaModalOpen && (
        <div className="fixed inset-0 bg-[#002855]/95 backdrop-blur-xl z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-top-10 border-4 border-yellow-500/10">
            <div className="bg-[#002855] p-8 text-white flex justify-between items-center border-b border-yellow-500/20"><h3 className="text-xl font-black uppercase tracking-tighter italic font-serif">Lançar Venda</h3><button onClick={() => setIsVendaModalOpen(false)} className="text-2xl hover:text-yellow-400">✕</button></div>
            <form onSubmit={handleSubmitVenda} className="p-6 md:p-10 space-y-6">
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase mb-2">Produto</label>
                <input autoFocus list="stockList" required className="w-full border-2 border-slate-100 bg-slate-50 rounded-xl p-5 uppercase font-black text-lg outline-none focus:border-[#002855]" placeholder="PEIXE?" value={formData.productName} onChange={e => setFormData({ ...formData, productName: e.target.value })} />
                <datalist id="stockList">{stock.map(s => <option key={s.productName} value={s.productName} />)}</datalist>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 text-center">R$ / Kg</label>
                  <input type="number" step="0.01" required className="w-full border-2 border-slate-100 bg-slate-50 rounded-xl p-5 font-mono text-xl font-black text-center focus:border-[#002855] outline-none" value={formData.pricePerKg} onChange={e => setFormData({ ...formData, pricePerKg: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 text-center">Peso (Kg)</label>
                  <input type="number" step="0.001" required className="w-full border-2 border-slate-100 bg-slate-50 rounded-xl p-5 font-mono text-xl font-black text-center focus:border-[#002855] outline-none" value={formData.weightKg} onChange={e => setFormData({ ...formData, weightKg: e.target.value })} />
                </div>
              </div>
              <button type="submit" className="w-full bg-[#002855] text-white font-black py-5 rounded-xl shadow-lg uppercase tracking-widest text-[10px] active:scale-95 transition-all border border-yellow-500/20">REGISTRAR VENDA</button>
            </form>
          </div>
        </div>
      )}

      {isStockModalOpen && (
        <div className="fixed inset-0 bg-[#002855]/95 backdrop-blur-xl z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in border-4 border-yellow-500/10">
            <div className="bg-[#002855] p-8 text-white flex justify-between items-center border-b border-yellow-500/20"><h3 className="text-xl font-black uppercase tracking-tighter italic font-serif">Entrada de Estoque</h3><button onClick={() => setIsStockModalOpen(false)} className="text-2xl hover:text-yellow-400">✕</button></div>
            <form onSubmit={handleAbastecer} className="p-8 space-y-6">
              <div><label className="block text-[9px] font-black text-slate-400 uppercase mb-2">Produto</label><input list="stockList" required className="w-full border-2 border-slate-100 bg-slate-50 rounded-xl p-5 uppercase font-black text-lg outline-none focus:border-[#002855]" value={stockFormData.productName} onChange={e => setStockFormData({ ...stockFormData, productName: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[9px] font-black text-slate-400 uppercase mb-2">Peso (Kg)</label><input type="number" step="0.001" required className="w-full border-2 border-slate-100 bg-slate-50 rounded-xl p-5 font-mono text-xl font-black text-[#002855] text-center focus:border-[#002855] outline-none" value={stockFormData.weightToAdd} onChange={e => setStockFormData({ ...stockFormData, weightToAdd: e.target.value })} /></div>
                <div><label className="block text-[9px] font-black text-slate-400 uppercase mb-2">Preço Base (R$/Kg)</label><input type="number" step="0.01" required className="w-full border-2 border-slate-100 bg-slate-50 rounded-xl p-5 font-mono text-xl font-black text-emerald-600 text-center focus:border-[#002855] outline-none" placeholder="0,00" value={stockFormData.basePricePerKg} onChange={e => setStockFormData({ ...stockFormData, basePricePerKg: e.target.value })} /></div>
              </div>
              <button type="submit" className="w-full bg-[#002855] text-white font-black py-5 rounded-xl shadow-xl uppercase tracking-widest text-[10px] active:scale-95 transition-all border border-yellow-500/20">FINALIZAR ENTRADA</button>
            </form>
          </div>
        </div>
      )}

      {isEditStockModalOpen && (
        <div className="fixed inset-0 bg-[#002855]/95 backdrop-blur-xl z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in border-4 border-yellow-500/10">
            <div className="bg-[#002855] p-8 text-white flex justify-between items-center border-b border-yellow-500/20"><h3 className="text-xl font-black uppercase tracking-tighter italic font-serif">Ajustar Inventário</h3><button onClick={() => setIsEditStockModalOpen(false)} className="text-2xl hover:text-yellow-400">✕</button></div>
            <form onSubmit={handleUpdateStockItem} className="p-8 space-y-6">
              <div><label className="block text-[9px] font-black text-slate-400 uppercase mb-2">Nome do Produto</label><input required className="w-full border-2 border-slate-100 bg-slate-50 rounded-xl p-5 uppercase font-black text-lg outline-none focus:border-[#002855]" value={editStockFormData.newName} onChange={e => setEditStockFormData({ ...editStockFormData, newName: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[9px] font-black text-slate-400 uppercase mb-2">Peso Real (Kg)</label><input type="number" step="0.001" required className="w-full border-2 border-slate-100 bg-slate-50 rounded-xl p-5 font-mono text-xl font-black text-[#002855] text-center outline-none focus:border-[#002855]" value={editStockFormData.weight} onChange={e => setEditStockFormData({ ...editStockFormData, weight: e.target.value })} /></div>
                <div><label className="block text-[9px] font-black text-slate-400 uppercase mb-2">Preço Base (R$/Kg)</label><input type="number" step="0.01" required className="w-full border-2 border-slate-100 bg-slate-50 rounded-xl p-5 font-mono text-xl font-black text-emerald-600 text-center outline-none focus:border-[#002855]" value={editStockFormData.basePrice} onChange={e => setEditStockFormData({ ...editStockFormData, basePrice: e.target.value })} /></div>
              </div>
              <button type="submit" className="w-full bg-[#002855] text-white font-black py-5 rounded-xl shadow-xl uppercase tracking-widest text-[10px] active:scale-95 transition-all border border-yellow-500/20">SALVAR AJUSTE</button>
            </form>
          </div>
        </div>
      )}

      {isPartialPaymentModalOpen && (
        <div className="fixed inset-0 bg-[#002855]/95 backdrop-blur-xl z-[110] flex items-center justify-center p-4">
          <div className="bg-amber-600 rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in border-4 border-white/20">
            <div className="bg-amber-700 p-8 text-white flex justify-between items-center"><h3 className="text-xl font-black uppercase tracking-tighter italic font-serif">Receber Valor</h3><button onClick={() => setIsPartialPaymentModalOpen(false)} className="text-2xl hover:text-amber-100">✕</button></div>
            <form onSubmit={handlePartialPayment} className="p-6 md:p-10 space-y-6">
              <input type="number" step="0.01" autoFocus required className="w-full border-2 border-amber-500/30 bg-white rounded-xl p-8 font-mono text-4xl font-black text-amber-700 text-center focus:border-white outline-none" placeholder="0,00" value={partialPaymentData.amount} onChange={e => setPartialPaymentData({ ...partialPaymentData, amount: e.target.value })} />
              <button type="submit" className="w-full bg-white text-amber-700 font-black py-5 rounded-xl shadow-xl uppercase tracking-widest text-[10px] active:scale-95 transition-all">CONFIRMAR BAIXA</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
