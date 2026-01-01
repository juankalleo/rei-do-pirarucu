
import React, { useState, useEffect, useMemo } from 'react';
import { Customer, SaleEntry, StockItem, ViewType, PurchaseEntry } from './types';
import { supabase } from './supabase/client';
import { INITIAL_CUSTOMERS, PRODUCT_SUGGESTIONS } from './constants';
import { 
  FishIcon, PlusIcon, BoxIcon, CheckIcon, 
  ChartIcon, LayoutIcon, UsersIcon, TrashIcon, 
  EditIcon, ShoppingIcon, PrinterIcon, CreditCardIcon
} from './components/Icons';
import CustomerCard from './components/CustomerCard';

const formatCurrency = (val: number) => 
  val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const BrandLogo = () => (
  <div className="flex flex-col items-center text-center select-none py-4 px-2">
    <div className="relative mb-1">
      <FishIcon className="w-20 h-20 text-yellow-500 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
    </div>
    <div className="flex items-center gap-3 w-full mb-0.5">
      <div className="h-[1px] flex-1 bg-yellow-500/40"></div>
      <span className="text-[9px] font-bold text-yellow-500 tracking-[0.4em] uppercase leading-none">Pescados</span>
      <div className="h-[1px] flex-1 bg-yellow-500/40"></div>
    </div>
    <h1 className="font-serif font-bold text-3xl text-white uppercase tracking-tight leading-none italic">
      Rei do <span className="text-yellow-500">Pirarucu</span>
    </h1>
  </div>
);

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Safe initialization from LocalStorage
  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem('pirarucu_v7_customers');
      return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
    } catch (e) {
      console.error("Erro ao carregar clientes do storage:", e);
      return INITIAL_CUSTOMERS;
    }
  });
  
  const [stock, setStock] = useState<StockItem[]>(() => {
    try {
      const saved = localStorage.getItem('pirarucu_v7_stock');
      return saved ? JSON.parse(saved) : PRODUCT_SUGGESTIONS.map(p => ({ 
        productName: p.toUpperCase().trim(), availableWeight: 0, basePricePerKg: 0, lastUpdate: new Date().toISOString(), history: []
      }));
    } catch (e) {
      console.error("Erro ao carregar estoque do storage:", e);
      return PRODUCT_SUGGESTIONS.map(p => ({ 
        productName: p.toUpperCase().trim(), availableWeight: 0, basePricePerKg: 0, lastUpdate: new Date().toISOString(), history: []
      }));
    }
  });

  const [purchases, setPurchases] = useState<PurchaseEntry[]>(() => {
    try {
      const saved = localStorage.getItem('pirarucu_v7_purchases');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Erro ao carregar compras do storage:", e);
      return [];
    }
  });

  const SERVICE_ITEMS = ['FRETE', 'CAIXA', 'DEPOSITO'];

  const [isVendaModalOpen, setIsVendaModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);

  const [activeCustomerId, setActiveCustomerId] = useState<string | null>(null);
  const [activePartialEntryId, setActivePartialEntryId] = useState<string | null>(null);
  const [lastSale, setLastSale] = useState<{customer: Customer, sale: SaleEntry} | null>(null);
  const [selectedStockItem, setSelectedStockItem] = useState<StockItem | null>(null);
  const [orderToPrint, setOrderToPrint] = useState<{customer: Customer, entries: SaleEntry[]} | null>(null);
  
  const [formData, setFormData] = useState({ productName: '', pricePerKg: '', weightKg: '', date: new Date().toISOString().split('T')[0] });
  const [stockFormData, setStockFormData] = useState({ name: '', weight: '', price: '' });
  const [purchaseFormData, setPurchaseFormData] = useState({ productName: '', weightKg: '', pricePerKg: '', total: '', date: new Date().toISOString().split('T')[0], supplier: '' });
  const [creditFormData, setCreditFormData] = useState({ limit: '', walletAdd: '' });
  const [customerFormData, setCustomerFormData] = useState({ name: '', taxId: '', phone: '', address: '' });
  const [newProductFormData, setNewProductFormData] = useState({ name: '', weight: '', price: '' });
  const [payData, setPayData] = useState({ amount: '', method: 'Pix', date: new Date().toISOString().split('T')[0] });
  const [payError, setPayError] = useState<string | null>(null);

  // Lock body scroll when sidebar is open on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(false);
        document.body.style.overflow = "auto";
      }
    };
    window.addEventListener('resize', handleResize);
    
    if (isSidebarOpen && window.innerWidth < 768) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      document.body.style.overflow = "auto";
    };
  }, [isSidebarOpen]);

  useEffect(() => {
    try {
      localStorage.setItem('pirarucu_v7_customers', JSON.stringify(customers));
    } catch (e) { console.error("Quota do LocalStorage excedida."); }
  }, [customers]);

  useEffect(() => {
    try {
      localStorage.setItem('pirarucu_v7_stock', JSON.stringify(stock));
    } catch (e) { console.error("Quota do LocalStorage excedida."); }
  }, [stock]);

  useEffect(() => {
    try {
      localStorage.setItem('pirarucu_v7_purchases', JSON.stringify(purchases));
    } catch (e) { console.error("Quota do LocalStorage excedida."); }
  }, [purchases]);

  const stats = useMemo(() => {
    let rev = 0, rec = 0, pend = 0, kg = 0, saleCount = 0, totalExposure = 0;
    const customerRanking: Record<string, { name: string, total: number, sales: number, pending: number }> = {};
    const productRanking: Record<string, { weight: number, revenue: number, transactions: number }> = {};

    customers.forEach(c => {
      totalExposure += (c.creditLimit || 0);
      customerRanking[c.id] = { name: c.name, total: 0, sales: 0, pending: 0 };
      c.entries.forEach(e => {
        rev += e.total;
        if (!SERVICE_ITEMS.includes(e.productName)) kg += e.weightKg;
        saleCount++;
        const paid = e.isPaid ? e.total : (e.paidAmount || 0);
        rec += paid;
        const entryPending = e.total - paid;
        pend += entryPending;
        
        customerRanking[c.id].total += e.total;
        customerRanking[c.id].sales += 1;
        customerRanking[c.id].pending += entryPending;
        
        if (!productRanking[e.productName]) productRanking[e.productName] = { weight: 0, revenue: 0, transactions: 0 };
        productRanking[e.productName].weight += e.weightKg;
        productRanking[e.productName].revenue += e.total;
        productRanking[e.productName].transactions += 1;
      });
    });
    
    const costs = purchases.reduce((a, b) => a + (Number(b.total) || 0), 0);
    const profit = rev - costs;
    const efficiency = rev > 0 ? (rec / rev) * 100 : 0;
    const ticketMedio = saleCount > 0 ? rev / saleCount : 0;

    const monthlyData = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthKey = d.toISOString().substring(0, 7);
      const mRev = customers.reduce((acc, c) => acc + c.entries.filter(e => e.date.startsWith(monthKey)).reduce((sum, e) => sum + e.total, 0), 0);
      const mCosts = purchases.filter(p => p.date.startsWith(monthKey)).reduce((sum, p) => sum + (Number(p.total) || 0), 0);
      return { month: monthKey, revenue: mRev, costs: mCosts };
    }).reverse();

    const insights = [];
    if (efficiency < 60) insights.push({ type: 'warning', text: "A eficiência de cobrança está baixa. Priorize recebimentos pendentes." });
    if (profit < 0) insights.push({ type: 'error', text: "Custos de compra excedem o faturamento total. Revise margens." });
    
    const sortedProducts = Object.entries(productRanking).sort((a,b) => b[1].revenue - a[1].revenue);
    const topProd = sortedProducts[0];
    if (topProd) insights.push({ type: 'success', text: `O produto "${topProd[0]}" é sua principal fonte de receita (${formatCurrency(topProd[1].revenue)}).` });

    const totalWeightInStock = stock.reduce((a,b) => a + (SERVICE_ITEMS.includes(b.productName) ? 0 : b.availableWeight), 0);
    const stockAssetValue = stock.reduce((a,b) => a + (b.availableWeight * b.basePricePerKg), 0);

    return { 
      rev, rec, pend, kg, costs, profit, efficiency, ticketMedio, totalExposure,
      topPerformanceCustomers: Object.values(customerRanking).sort((a, b) => b.total - a.total).slice(0, 5),
      mostProfitableProducts: sortedProducts.slice(0, 10),
      monthlyData,
      lowStock: stock.filter(i => !SERVICE_ITEMS.includes(i.productName) && i.availableWeight < 50).sort((a,b) => a.availableWeight - b.availableWeight),
      insights,
      totalWeightInStock,
      stockAssetValue,
      customerRiskRanking: Object.values(customerRanking).sort((a,b) => b.pending - a.pending).slice(0, 5)
    };
  }, [customers, purchases, stock]);

  const handleLaunchSale = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const weight = Number(formData.weightKg);
      const pName = formData.productName.toUpperCase().trim();
      const customer = customers.find(c => c.id === activeCustomerId);
      const totalVenda = weight * Number(formData.pricePerKg);
      if (!customer || !pName || weight <= 0) return;
      if (!SERVICE_ITEMS.includes(pName)) {
        const item = stock.find(s => s.productName === pName);
        if (!item) {
          alert('Produto não encontrado no estoque. Ajuste o estoque manualmente antes de vender.');
          return;
        }
        if (item.availableWeight < weight) {
          alert('Estoque insuficiente para esta venda. Ajuste o estoque ou reduza a quantidade.');
          return;
        }
        setStock(prev => prev.map(s => s.productName === pName ? { 
          ...s, 
          availableWeight: +(s.availableWeight - weight).toFixed(3),
          history: [{ id: Date.now().toString(), type: 'exit', weight: -weight, date: formData.date, description: `Venda p/ ${customer.name}` }, ...(s.history || [])]
        } : s));
      }
      const newSale: SaleEntry = {
        id: Math.random().toString(36).substr(2, 9).toUpperCase(),
        productName: pName,
        pricePerKg: Number(formData.pricePerKg),
        weightKg: weight,
        total: totalVenda,
        date: formData.date,
        isPaid: false
      };
      setCustomers(prev => prev.map(c => c.id === activeCustomerId ? { ...c, entries: [newSale, ...c.entries] } : c));
      setIsVendaModalOpen(false);
      setLastSale({ customer, sale: newSale });
      setIsSuccessModalOpen(true);
    } catch (err) {
      console.error("Erro ao lançar venda:", err);
    }
  };

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerFormData.name) return;
    const newCust: Customer = {
      id: Date.now().toString(),
      name: customerFormData.name.toUpperCase().trim(),
      taxId: customerFormData.taxId,
      phone: customerFormData.phone,
      address: customerFormData.address,
      priceList: {},
      entries: [],
      walletBalance: 0,
      creditLimit: 0
    };
    setCustomers(prev => [newCust, ...prev]);
    setIsCustomerModalOpen(false);
    setCustomerFormData({ name: '', taxId: '', phone: '', address: '' });
  };

  const handleAddNewProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newProductFormData.name.toUpperCase().trim();
    if (!name) return;
    const weight = Number(newProductFormData.weight) || 0;
    const price = Number(newProductFormData.price) || 0;
    const newItem: StockItem = {
      productName: name,
      availableWeight: weight,
      basePricePerKg: price,
      lastUpdate: new Date().toISOString(),
      history: weight > 0 ? [{ id: Date.now().toString(), type: 'adjustment', weight, date: new Date().toISOString(), description: 'Cadastro Inicial' }] : []
    };
    setStock(prev => [newItem, ...prev]);
    setIsNewProductModalOpen(false);
    setNewProductFormData({ name: '', weight: '', price: '' });
  };

  const handleManualStockUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const weight = Number(stockFormData.weight);
    setStock(prev => prev.map(s => {
      if (s.productName === stockFormData.name) {
        const diff = weight - s.availableWeight;
        return {
          ...s,
          availableWeight: weight,
          basePricePerKg: Number(stockFormData.price),
          history: [{ id: Date.now().toString(), type: 'adjustment', weight: diff, date: new Date().toISOString(), description: 'Ajuste Manual' }, ...(s.history || [])]
        };
      }
      return s;
    }));
    setIsStockModalOpen(false);
  };

  const handlePurchaseEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const pName = purchaseFormData.productName.toUpperCase().trim();
    const weight = Number(purchaseFormData.weightKg);
    const price = Number(purchaseFormData.pricePerKg);
    const total = Number(purchaseFormData.total) || (weight * price);
    const newPurchase: PurchaseEntry = { id: `PUR-${Date.now().toString().slice(-6)}`, productName: pName, weightKg: weight, pricePerKg: price, total, date: purchaseFormData.date, supplier: purchaseFormData.supplier };
    
    // push to local state first for instant UX
    setPurchases(prev => [newPurchase, ...prev]);

    // Try to persist to Supabase if configured; do not change stock here (business rule)
    (async () => {
      try {
        if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
          const { error } = await supabase.from('purchases').insert([{ 
            id: newPurchase.id,
            product_name: newPurchase.productName,
            weight_kg: newPurchase.weightKg,
            price_per_kg: newPurchase.pricePerKg,
            total: newPurchase.total,
            date: newPurchase.date,
            supplier: newPurchase.supplier
          }]);
          if (error) {
            console.error('Erro ao salvar compra no Supabase:', error);
            // keep local fallback; optionally notify user
          }
        }
      } catch (err) {
        console.error('Erro ao persistir compra:', err);
      }
    })();
    setIsPurchaseModalOpen(false);
    setPurchaseFormData({ productName: '', weightKg: '', pricePerKg: '', total: '', date: new Date().toISOString().split('T')[0], supplier: '' });
  };

  const handleDeletePurchase = (id: string) => {
    if (!window.confirm('Deseja remover esta compra? Esta ação remove apenas o registro, sem alterar o estoque.')) return;
    setPurchases(prev => prev.filter(p => p.id !== id));
  };

  const handleCreditUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomers(prev => prev.map(c => c.id === activeCustomerId ? { ...c, creditLimit: Number(creditFormData.limit), walletBalance: (c.walletBalance || 0) + Number(creditFormData.walletAdd) } : c));
    setIsCreditModalOpen(false);
  };

  const handlePartialPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(payData.amount);
    if (isNaN(amount) || amount <= 0) return;
    const customer = customers.find(c => c.id === activeCustomerId);
    const entry = customer?.entries.find(ent => ent.id === activePartialEntryId);
    if (!entry) return;
    const pending = entry.total - (entry.paidAmount || 0);
    if (amount > pending + 0.01) {
      setPayError(`Erro: O valor inserido (${formatCurrency(amount)}) excede o saldo devedor desta venda (${formatCurrency(pending)}).`);
      return;
    }
    setPayError(null);
    setCustomers(prev => prev.map(c => {
      if (c.id !== activeCustomerId) return c;
      return {
        ...c,
        entries: c.entries.map(ent => {
          if (ent.id !== activePartialEntryId) return ent;
          const newPaidAmount = (ent.paidAmount || 0) + amount;
          const isFullyPaid = newPaidAmount >= ent.total - 0.01;
          return {
            ...ent,
            paidAmount: newPaidAmount,
            isPaid: isFullyPaid,
            paidAt: isFullyPaid ? payData.date : ent.paidAt,
            paymentHistory: [...(ent.paymentHistory || []), { id: Date.now().toString(), date: payData.date, amount, method: payData.method }]
          };
        })
      };
    }));
    setIsDispatchModalOpen(false);
    setActivePartialEntryId(null);
  };

  const navigateTo = (view: ViewType) => {
    setActiveView(view);
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-[#f1f5f9] font-['Inter'] w-full max-w-full overflow-x-hidden">
      {/* MOBILE BACKDROP */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[55] md:hidden transition-opacity duration-300 ease-in-out"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR DRAWER */}
      <aside className={`fixed md:relative inset-y-0 left-0 w-[min(80vw,320px)] md:w-72 bg-[#002855] text-white flex flex-col shadow-2xl z-[60] transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-8 border-b border-white/10 flex justify-between items-start">
          <BrandLogo />
          {/* MOBILE CLOSE BUTTON */}
          <button 
            onClick={() => setIsSidebarOpen(false)} 
            className="md:hidden p-2 text-white/40 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <nav className="flex-1 mt-6 overflow-y-auto custom-scrollbar">
          <NavItem label="Dashboard" icon={LayoutIcon} active={activeView === 'dashboard'} onClick={() => navigateTo('dashboard')} />
          <NavItem label="Estoque Físico" icon={BoxIcon} active={activeView === 'inventory'} onClick={() => navigateTo('inventory')} />
          <NavItem label="Compras" icon={ShoppingIcon} active={activeView === 'purchases'} onClick={() => navigateTo('purchases')} />
          <NavItem label="Clientes" icon={UsersIcon} active={activeView === 'customers'} onClick={() => navigateTo('customers')} />
          <NavItem label="Relatório Inteligente" icon={ChartIcon} active={activeView === 'reports'} onClick={() => navigateTo('reports')} />
        </nav>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden w-full max-w-full">
        <header className="min-h-[5rem] h-auto py-4 md:py-0 px-4 md:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b bg-white/95 backdrop-blur-md z-40 print:hidden w-full max-w-full overflow-hidden">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 shrink-0 hover:bg-slate-100 rounded-lg transition-colors"><LayoutIcon className="w-6 h-6 text-[#002855]"/></button>
            <h2 className="text-lg md:text-xl font-black text-[#002855] uppercase italic truncate flex-1 min-w-0">Central <span className="text-yellow-500">Operacional</span></h2>
          </div>
          <div className="flex flex-row flex-wrap gap-4 md:gap-8 w-full md:w-auto justify-between md:justify-end">
            <Stat label="Recebido Real" val={formatCurrency(stats.rec)} color="text-emerald-600" />
            <Stat label="Pendência Bruta" val={formatCurrency(stats.pend)} color="text-red-600" />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar print:hidden w-full max-w-full">
          {activeView === 'dashboard' && (
             <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                   <DashCard label="Faturamento Total" val={formatCurrency(stats.rev)} subLabel={`${stats.efficiency.toFixed(1)}% Eficiência`} color="blue" />
                   <DashCard label="Lucro Bruto Est." val={formatCurrency(stats.profit)} subLabel="Rev - Compras" color="emerald" />
                   <DashCard label="Ticket Médio" val={formatCurrency(stats.ticketMedio)} subLabel="Por Venda" color="yellow" />
                   <DashCard label="Volume Vendido" val={`${stats.kg.toFixed(0)} kg`} subLabel="Itens Físicos" color="red" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                   <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200 overflow-x-auto custom-scrollbar">
                      <div className="flex justify-between items-center mb-8 min-w-[300px]">
                         <h3 className="text-sm font-black uppercase text-[#002855] italic">Fluxo de Caixa (Últimos 6 meses)</h3>
                         <div className="flex gap-4">
                            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#002855] rounded-full"></div><span className="text-[10px] font-bold text-slate-400">VENDAS</span></div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-400 rounded-full"></div><span className="text-[10px] font-bold text-slate-400">CUSTOS</span></div>
                         </div>
                      </div>
                      <div className="h-64 flex items-end gap-4 px-2 min-w-[400px]">
                         {stats.monthlyData.map((d, i) => {
                           const maxVal = Math.max(...stats.monthlyData.map(m => Math.max(m.revenue, m.costs)), 1);
                           const hRev = (d.revenue / maxVal) * 100;
                           const hCost = (d.costs / maxVal) * 100;
                           return (
                             <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                                <div className="w-full flex items-end justify-center gap-1.5 h-full">
                                   <div className="w-full max-w-[20px] bg-[#002855] rounded-t-lg transition-all duration-500 relative" style={{ height: `${hRev}%` }}>
                                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">{formatCurrency(d.revenue)}</div>
                                   </div>
                                   <div className="w-full max-w-[20px] bg-red-400 rounded-t-lg transition-all duration-500 relative" style={{ height: `${hCost}%` }}>
                                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[8px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">{formatCurrency(d.costs)}</div>
                                   </div>
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase">{new Date(d.month + '-01').toLocaleString('pt-BR', {month: 'short'})}</span>
                             </div>
                           )
                         })}
                      </div>
                   </div>

                   <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200">
                      <h3 className="text-sm font-black uppercase text-[#002855] italic mb-6">Alertas de Reposição</h3>
                      <div className="space-y-4">
                         {stats.lowStock.length === 0 ? (
                            <p className="text-xs text-slate-400 font-bold uppercase py-10 text-center">Tudo abastecido!</p>
                         ) : stats.lowStock.slice(0, 5).map(item => (
                            <div key={item.productName} className="flex justify-between items-center p-4 bg-red-50 rounded-2xl border border-red-100">
                               <div className="min-w-0 flex-1">
                                  <p className="text-[10px] font-black text-red-900 uppercase leading-none mb-1 truncate">{item.productName}</p>
                                  <p className="text-[9px] font-bold text-red-400">Abaixo de 50kg</p>
                               </div>
                               <span className="text-lg font-black text-red-600 tabular-nums shrink-0 ml-2">{item.availableWeight.toFixed(1)} <span className="text-[10px]">kg</span></span>
                            </div>
                         ))}
                      </div>
                      <button onClick={() => setActiveView('inventory')} className="w-full mt-6 py-4 bg-slate-100 rounded-2xl text-[10px] font-black uppercase text-slate-500 hover:bg-slate-200 transition-all">Ver Estoque Completo</button>
                   </div>
                </div>
             </div>
          )}

          {activeView === 'inventory' && (
            <div className="max-w-6xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500">
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                 <h3 className="text-2xl font-black text-[#002855] italic">Gestão de Inventário</h3>
                 <button onClick={() => setIsNewProductModalOpen(true)} className="w-full sm:w-auto bg-[#002855] text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg hover:bg-blue-900 transition-all active:scale-95"><PlusIcon className="w-4 h-4" /> NOVO PRODUTO</button>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                 {stock.filter(i => !SERVICE_ITEMS.includes(i.productName)).map(item => {
                   const isOutOfStock = item.availableWeight <= 0;
                   return (
                     <div 
                       key={item.productName} 
                       className={`p-6 rounded-[2.5rem] shadow-sm border transition-all duration-300 flex flex-col justify-between h-52 group hover:shadow-xl hover:scale-[1.02] ${
                         isOutOfStock 
                         ? 'bg-red-50 border-red-200 shadow-red-100/20' 
                         : 'bg-emerald-50 border-emerald-200 shadow-emerald-100/20'
                       }`}
                     >
                        <div className="flex justify-between items-start">
                           <h4 className={`text-[9px] font-black uppercase tracking-widest leading-none flex-1 min-w-0 truncate pr-2 ${isOutOfStock ? 'text-red-400' : 'text-emerald-400'}`}>
                              {item.productName}
                           </h4>
                           <button onClick={() => { setStockFormData({ name: item.productName, weight: item.availableWeight.toString(), price: item.basePricePerKg.toString() }); setIsStockModalOpen(true); }} className="p-2 hover:bg-white/50 rounded-lg shrink-0"><EditIcon className="w-4 h-4 text-[#002855]"/></button>
                        </div>
                        <div className="min-w-0">
                           <p className={`text-4xl font-black tabular-nums truncate ${isOutOfStock ? 'text-red-600' : 'text-emerald-600'}`}>
                             {item.availableWeight.toFixed(1)}<span className="text-sm font-bold ml-1 opacity-50">kg</span>
                           </p>
                           <p className={`text-[9px] font-bold uppercase mt-1 truncate ${isOutOfStock ? 'text-red-300' : 'text-emerald-400'}`}>
                             Custo Médio: {formatCurrency(item.basePricePerKg)}
                           </p>
                        </div>
                        <button onClick={() => { setSelectedStockItem(item); setIsHistoryModalOpen(true); }} className={`text-[9px] font-black uppercase text-center border-t pt-4 transition-colors ${isOutOfStock ? 'border-red-100 text-red-400 hover:text-red-700' : 'border-emerald-100 text-emerald-400 hover:text-emerald-700'}`}>
                           Extrato de Movimentação
                        </button>
                     </div>
                   );
                 })}
               </div>
            </div>
          )}

          {activeView === 'customers' && (
            <div className="max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-500">
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                 <h3 className="text-2xl font-black text-[#002855] italic">Painel de Clientes</h3>
                 <button onClick={() => setIsCustomerModalOpen(true)} className="w-full sm:w-auto bg-[#002855] text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg hover:bg-blue-900 transition-all active:scale-95"><PlusIcon className="w-4 h-4" /> CADASTRAR CLIENTE</button>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                 {customers.map(c => (
                   <CustomerCard 
                     key={c.id} customer={c} 
                     onAddEntry={(id) => { setActiveCustomerId(id); setIsVendaModalOpen(true); }}
                     onDeleteCustomer={(id) => { if(window.confirm("Deseja realmente excluir este cliente e todo seu histórico?")) setCustomers(prev => prev.filter(x => x.id !== id)); }}
                     onDeleteEntry={(cid, eid) => setCustomers(prev => prev.map(cust => cust.id === cid ? { ...cust, entries: cust.entries.filter(e => e.id !== eid) } : cust))}
                     onTogglePayment={(cid, eid) => setCustomers(prev => prev.map(cust => cust.id === cid ? { ...cust, entries: cust.entries.map(e => e.id === eid ? { ...e, isPaid: !e.isPaid } : e) } : cust))}
                     onPartialPayment={(cid, eid) => {
                        const cust = customers.find(x => x.id === cid);
                        const ent = cust?.entries.find(e => e.id === eid);
                        if (ent) {
                           setActiveCustomerId(cid);
                           setActivePartialEntryId(eid);
                           setPayData({ ...payData, amount: (ent.total - (ent.paidAmount || 0)).toString() });
                           setPayError(null);
                           setIsDispatchModalOpen(true);
                        }
                     }}
                     onPrintOrder={(ents) => { setOrderToPrint({ customer: c, entries: ents }); setTimeout(() => window.print(), 500); }}
                     onDispatch={(cid, eids) => {
                        const cust = customers.find(x => x.id === cid);
                        const ent = cust?.entries.find(e => e.id === eids[0]);
                        if (ent) {
                           setActiveCustomerId(cid);
                           setActivePartialEntryId(eids[0]);
                           setPayData({ ...payData, amount: (ent.total - (ent.paidAmount || 0)).toString() });
                           setPayError(null);
                           setIsDispatchModalOpen(true);
                        }
                     }}
                     onManageCredit={(id) => { setActiveCustomerId(id); setIsCreditModalOpen(true); }}
                   />
                 ))}
               </div>
            </div>
          )}

          {activeView === 'reports' && (
            <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in zoom-in-95 duration-700">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 pb-8">
                  <div>
                     <h3 className="text-2xl md:text-3xl font-black text-[#002855] italic uppercase tracking-tighter">Relatório Inteligente</h3>
                     <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Análise de Performance e Saúde do Negócio</p>
                  </div>
                  <div className="flex gap-4">
                     <button onClick={() => window.print()} className="w-full md:w-auto bg-white border-2 border-slate-200 p-4 rounded-2xl hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center gap-2 font-black text-[10px] uppercase">
                        <PrinterIcon className="w-4 h-4" /> Exportar Relatório
                     </button>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                     <h4 className="text-[10px] font-black uppercase text-slate-400 mb-6 tracking-widest">Patrimônio em Estoque</h4>
                     <p className="text-2xl md:text-3xl font-black text-[#002855] tabular-nums break-words">{formatCurrency(stats.stockAssetValue)}</p>
                     <p className="text-xs font-bold text-slate-400 mt-2 uppercase">{stats.totalWeightInStock.toFixed(0)} kg de mercadoria física</p>
                  </div>
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                     <h4 className="text-[10px] font-black uppercase text-slate-400 mb-6 tracking-widest">Eficiência de Recebimento</h4>
                     <div className="flex items-end gap-4">
                        <p className="text-2xl md:text-3xl font-black text-emerald-600 tabular-nums shrink-0">{stats.efficiency.toFixed(1)}%</p>
                        <div className="flex-1 bg-slate-100 h-2 rounded-full mb-3 overflow-hidden">
                           <div className="bg-emerald-500 h-full transition-all duration-1000" style={{ width: `${stats.efficiency}%` }}></div>
                        </div>
                     </div>
                     <p className="text-xs font-bold text-slate-400 mt-2 uppercase">Meta Ideal: 90% ou superior</p>
                  </div>
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                     <h4 className="text-[10px] font-black uppercase text-slate-400 mb-6 tracking-widest">Insights do Sistema</h4>
                     <div className="space-y-3">
                        {stats.insights.length === 0 ? (
                           <p className="text-xs font-bold text-slate-400 uppercase">Operação estável, sem alertas críticos.</p>
                        ) : stats.insights.map((ins, idx) => (
                           <div key={idx} className={`flex items-start gap-3 p-3 rounded-xl border text-[9px] font-black uppercase leading-tight ${
                              ins.type === 'error' ? 'bg-red-50 border-red-100 text-red-700' : 
                              ins.type === 'warning' ? 'bg-yellow-50 border-yellow-100 text-yellow-700' : 
                              'bg-emerald-50 border-emerald-100 text-emerald-700'
                           }`}>
                              <span className="mt-0.5 shrink-0">•</span> {ins.text}
                           </div>
                        ))}
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="bg-white rounded-[3rem] p-6 md:p-10 shadow-sm border border-slate-200">
                     <h4 className="text-sm font-black uppercase text-[#002855] italic mb-8 border-b border-slate-100 pb-4">Análise de Receita por Produto</h4>
                     <div className="space-y-6">
                        {stats.mostProfitableProducts.map(([name, data], i) => (
                           <div key={i} className="group">
                              <div className="flex flex-col sm:flex-row justify-between sm:items-end mb-2 gap-1">
                                 <div className="min-w-0 flex-1">
                                    <span className="text-[10px] font-black text-slate-400 mr-2 shrink-0">#{i+1}</span>
                                    <span className="text-xs font-black uppercase text-[#002855] truncate">{name}</span>
                                 </div>
                                 <div className="sm:text-right">
                                    <p className="text-sm font-black text-slate-900 tabular-nums truncate">{formatCurrency(data.revenue)}</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase truncate">{data.weight.toFixed(1)} kg vendidos</p>
                                 </div>
                              </div>
                              <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden">
                                 <div className="bg-[#002855] h-full transition-all duration-1000 group-hover:bg-yellow-500" style={{ width: `${(data.revenue / (stats.rev || 1)) * 100}%` }}></div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className="bg-white rounded-[3rem] p-6 md:p-10 shadow-sm border border-slate-200">
                     <h4 className="text-sm font-black uppercase text-red-600 italic mb-8 border-b border-slate-100 pb-4">Ranking de Exposição (Dívida Acumulada)</h4>
                     <div className="space-y-4">
                        {stats.customerRiskRanking.map((c, i) => (
                           <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-slate-50 rounded-[2rem] border border-slate-200 group hover:border-red-200 hover:bg-red-50 transition-all gap-4">
                              <div className="flex items-center gap-4 min-w-0 flex-1">
                                 <span className="w-10 h-10 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center font-black text-xs text-slate-400 group-hover:border-red-400 group-hover:text-red-600 transition-all shrink-0">{i+1}</span>
                                 <div className="min-w-0 flex-1">
                                    <p className="text-xs font-black uppercase text-[#002855] truncate">{c.name}</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase truncate">Concentra {((c.pending / (stats.pend || 1)) * 100).toFixed(1)}% do valor pendente</p>
                                 </div>
                              </div>
                              <div className="sm:text-right w-full sm:w-auto">
                                 <p className="text-sm font-black text-red-600 tabular-nums truncate">{formatCurrency(c.pending)}</p>
                                 <p className="text-[8px] font-black uppercase text-slate-400">Total Devido</p>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeView === 'purchases' && (
            <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                 <h3 className="text-2xl font-black text-[#002855] italic">Central de Compras</h3>
                 <button onClick={() => setIsPurchaseModalOpen(true)} className="w-full sm:w-auto bg-red-600 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg hover:bg-red-700 transition-all active:scale-95"><ShoppingIcon className="w-4 h-4" /> LANÇAR COMPRA</button>
              </div>
              <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-x-auto shadow-sm custom-scrollbar">
                <table className="w-full text-left text-sm min-w-[700px]">
                  <thead className="bg-slate-50 text-[10px] uppercase font-black tracking-widest text-slate-500">
                    <tr><th className="p-6">Data</th><th className="p-6">Produto</th><th className="p-6">Origem/Fornecedor</th><th className="p-6 text-right">Peso</th><th className="p-6 text-right">Custo Total</th><th className="p-6 text-right">Ações</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {purchases.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-6 text-slate-500 font-bold whitespace-nowrap">{new Date(p.date).toLocaleDateString()}</td>
                        <td className="p-6 font-black text-[#002855] uppercase truncate">{p.productName}</td>
                        <td className="p-6 text-slate-500 font-bold uppercase truncate">{p.supplier || 'MERCADO'}</td>
                        <td className="p-6 text-right font-black tabular-nums whitespace-nowrap">{p.weightKg} kg</td>
                        <td className="p-6 text-right text-red-600 font-black tabular-nums whitespace-nowrap">{formatCurrency(Number(p.total) || 0)}</td>
                        <td className="p-6 text-right">
                          <button onClick={() => handleDeletePurchase(p.id)} className="text-red-600 font-black uppercase text-[10px] px-3 py-2 rounded-lg hover:bg-red-50 transition-colors">Remover</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* MODALS */}
        {isPurchaseModalOpen && (
          <Modal title="Lançar Nova Compra de Mercadoria" onClose={() => setIsPurchaseModalOpen(false)}>
             <form onSubmit={handlePurchaseEntry} className="space-y-6">
                <div>
                   <Input 
                      label="Produto / Espécie" 
                      list="purchaselist" 
                      uppercase 
                      required 
                      value={purchaseFormData.productName} 
                      onChange={(v: string) => setPurchaseFormData({...purchaseFormData, productName: v})} 
                   />
                   <datalist id="purchaselist">
                      {PRODUCT_SUGGESTIONS.map(s => <option key={s} value={s} />)}
                   </datalist>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                   <Input 
                      label="Peso Bruto (kg)" 
                      type="number" 
                      step="0.01" 
                      required 
                      value={purchaseFormData.weightKg} 
                      onChange={(v: string) => setPurchaseFormData({...purchaseFormData, weightKg: v})} 
                   />
                   <Input 
                      label="Preço por Quilo (R$)" 
                      type="number" 
                      step="0.01" 
                      required 
                      value={purchaseFormData.pricePerKg} 
                      onChange={(v: string) => setPurchaseFormData({...purchaseFormData, pricePerKg: v})} 
                   />
                </div>

                <Input 
                   label="Fornecedor / Origem" 
                   uppercase 
                   value={purchaseFormData.supplier} 
                   onChange={(v: string) => setPurchaseFormData({...purchaseFormData, supplier: v})} 
                />

                <div className="grid grid-cols-2 gap-4">
                   <Input 
                      label="Data da Compra" 
                      type="date" 
                      value={purchaseFormData.date} 
                      onChange={(v: string) => setPurchaseFormData({...purchaseFormData, date: v})} 
                   />
                   <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-200 shadow-inner flex flex-col justify-center">
                      <p className="text-[8px] font-black uppercase text-slate-400 mb-1">Cálculo Total</p>
                      <p className="text-lg font-black text-[#002855] font-mono truncate">
                         {formatCurrency(Number(purchaseFormData.weightKg) * Number(purchaseFormData.pricePerKg) || 0)}
                      </p>
                   </div>
                </div>

                 <div className="p-4 rounded-2xl border border-yellow-100 bg-yellow-50 text-[12px] font-bold text-yellow-800">
                   <p className="uppercase">Observação: Esta tela registra apenas a compra para controle financeiro/histórico.</p>
                   <p className="text-[11px] font-semibold mt-1">Registrar uma compra <strong>não</strong> altera automaticamente o estoque físico. Use a opção de ajuste manual para atualizar saldos.</p>
                 </div>

                 <PrimaryButton color="red">Registrar Compra</PrimaryButton>
             </form>
          </Modal>
        )}

        {isDispatchModalOpen && (
          <Modal title="Pagamento / Quitação" onClose={() => setIsDispatchModalOpen(false)}>
             <div className="mb-6 p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
                <p className="text-[10px] font-black uppercase text-emerald-800 tracking-widest mb-1">Dívida Selecionada</p>
                {activePartialEntryId && (() => {
                   const c = customers.find(x => x.id === activeCustomerId);
                   const e = c?.entries.find(ent => ent.id === activePartialEntryId);
                   return e ? (
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2">
                         <div className="min-w-0 flex-1">
                            <p className="text-sm font-black text-[#002855] uppercase leading-none truncate">{e.productName}</p>
                            <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">EMITIDO EM {new Date(e.date).toLocaleDateString()}</p>
                         </div>
                         <p className="text-lg font-black text-slate-900 tabular-nums shrink-0">{formatCurrency(e.total - (e.paidAmount || 0))}</p>
                      </div>
                   ) : null;
                })()}
             </div>

             <form onSubmit={handlePartialPaymentSubmit} className="space-y-6">
                <div>
                   <Input 
                      label="Valor do Recebimento (R$)" 
                      type="number" 
                      step="0.01" 
                      required 
                      value={payData.amount} 
                      onChange={(v: string) => { setPayData({...payData, amount: v}); setPayError(null); }} 
                   />
                   {payError && <p className="mt-2 text-[10px] font-bold text-red-600 uppercase px-4">{payError}</p>}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-4">Meio de Pagto</label>
                      <select 
                         className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-5 font-bold text-sm outline-none focus:border-[#002855] transition-all shadow-inner"
                         value={payData.method}
                         onChange={e => setPayData({...payData, method: e.target.value})}
                      >
                         <option>Pix</option>
                         <option>Dinheiro</option>
                         <option>Cartão</option>
                         <option>Depósito</option>
                      </select>
                   </div>
                   <Input label="Data do Recebimento" type="date" value={payData.date} onChange={(v: string) => setPayData({...payData, date: v})} />
                </div>

                <PrimaryButton color="emerald">Confirmar Recebimento</PrimaryButton>
             </form>
          </Modal>
        )}

        {isCustomerModalOpen && (
          <Modal title="Cadastrar Novo Cliente" onClose={() => setIsCustomerModalOpen(false)}>
            <form onSubmit={handleAddCustomer} className="space-y-6">
              <Input label="Nome Completo / Razão Social" uppercase required value={customerFormData.name} onChange={(v: string) => setCustomerFormData({...customerFormData, name: v})} />
              <Input label="CPF ou CNPJ (Opcional)" value={customerFormData.taxId} onChange={(v: string) => setCustomerFormData({...customerFormData, taxId: v})} />
              <PrimaryButton>Salvar Cliente</PrimaryButton>
            </form>
          </Modal>
        )}

        {isNewProductModalOpen && (
          <Modal title="Novo Produto / Espécie" onClose={() => setIsNewProductModalOpen(false)}>
            <form onSubmit={handleAddNewProduct} className="space-y-5">
              <Input label="Nome do Produto" uppercase required value={newProductFormData.name} onChange={(v: string) => setNewProductFormData({...newProductFormData, name: v})} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Saldo Inicial (kg)" type="number" value={newProductFormData.weight} onChange={(v: string) => setNewProductFormData({...newProductFormData, weight: v})} />
                <Input label="Custo Base (R$/kg)" type="number" value={newProductFormData.price} onChange={(v: string) => setNewProductFormData({...newProductFormData, price: v})} />
              </div>
              <PrimaryButton>Adicionar ao Catálogo</PrimaryButton>
            </form>
          </Modal>
        )}

        {isVendaModalOpen && (
          <Modal title="Registrar Pedido" onClose={() => setIsVendaModalOpen(false)}>
            <form onSubmit={handleLaunchSale} className="space-y-5">
              <Input label="Espécie Selecionada" list="plist" uppercase required value={formData.productName} onChange={(v: string) => setFormData({...formData, productName: v})} />
              <datalist id="plist">{stock.map(s => <option key={s.productName} value={s.productName} />)}</datalist>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Peso Vendido (kg)" type="number" step="0.01" required value={formData.weightKg} onChange={(v: string) => setFormData({...formData, weightKg: v})} />
                <Input label="Valor do Quilo (R$)" type="number" step="0.01" required value={formData.pricePerKg} onChange={(v: string) => setFormData({...formData, pricePerKg: v})} />
              </div>
              <Input label="Data da Operação" type="date" value={formData.date} onChange={(v: string) => setFormData({...formData, date: v})} />
              <PrimaryButton>Confirmar e Emitir</PrimaryButton>
            </form>
          </Modal>
        )}

        {isStockModalOpen && (
          <Modal title={`Ajuste de Saldo: ${stockFormData.name}`} onClose={() => setIsStockModalOpen(false)}>
             <form onSubmit={handleManualStockUpdate} className="space-y-6">
                <Input label="Saldo Real Contado (kg)" type="number" step="0.01" required value={stockFormData.weight} onChange={(v: string) => setStockFormData({...stockFormData, weight: v})} />
                <Input label="Preço Médio / Custo (R$)" type="number" step="0.01" required value={stockFormData.price} onChange={(v: string) => setStockFormData({...stockFormData, price: v})} />
                <PrimaryButton>Sincronizar Estoque</PrimaryButton>
             </form>
          </Modal>
        )}

        {isHistoryModalOpen && selectedStockItem && (
          <Modal title={`Histórico: ${selectedStockItem.productName}`} onClose={() => setIsHistoryModalOpen(false)}>
             <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                {selectedStockItem.history.map((m, idx) => (
                   <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center gap-2">
                      <div className="min-w-0 flex-1">
                         <p className="text-[10px] font-black uppercase text-[#002855] leading-none mb-1 truncate">{m.description}</p>
                         <p className="text-[8px] font-bold text-slate-400 uppercase">{new Date(m.date).toLocaleDateString()}</p>
                      </div>
                      <span className={`text-sm font-black tabular-nums shrink-0 ${m.weight > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                         {m.weight > 0 ? '+' : ''}{m.weight.toFixed(1)} kg
                      </span>
                   </div>
                ))}
             </div>
          </Modal>
        )}

        {isCreditModalOpen && (
          <Modal title="Gestão Financeira do Cliente" onClose={() => setIsCreditModalOpen(false)}>
             <form onSubmit={handleCreditUpdate} className="space-y-6">
                <Input label="Teto de Crédito Permitido (R$)" type="number" required value={creditFormData.limit} onChange={(v: string) => setCreditFormData({...creditFormData, limit: v})} />
                <div className="p-6 bg-yellow-50 rounded-2xl border border-yellow-100">
                   <p className="text-[10px] font-black text-yellow-800 uppercase mb-2">Adicionar Crédito em Dinheiro</p>
                   <Input label="Valor do Depósito (R$)" type="number" value={creditFormData.walletAdd} onChange={(v: string) => setCreditFormData({...creditFormData, walletAdd: v})} />
                </div>
                <PrimaryButton>Aplicar Alterações</PrimaryButton>
             </form>
          </Modal>
        )}

        {orderToPrint && (
          <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-10 text-black">
             <div className="border-[12px] border-[#002855] p-10 rounded-[3rem] relative overflow-hidden">
                <div className="flex justify-between items-center border-b-4 border-[#002855] pb-8 mb-10">
                   <div>
                      <h1 className="text-6xl font-black italic uppercase text-[#002855]">REI DO <span className="text-yellow-500">PIRARUCU</span></h1>
                      <p className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-400 mt-2">Pescados e Frutos do Mar Amazônicos</p>
                   </div>
                   <div className="text-right">
                      <p className="text-2xl font-black">{new Date().toLocaleDateString('pt-BR')}</p>
                   </div>
                </div>
                <div className="bg-slate-50 p-6 rounded-3xl mb-8">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">CLIENTE</p>
                   <p className="text-3xl font-black uppercase text-[#002855]">{orderToPrint.customer.name}</p>
                </div>
                <table className="w-full text-left border-collapse rounded-3xl overflow-hidden shadow-sm">
                   <thead className="bg-[#002855] text-white uppercase text-[10px] font-black tracking-widest">
                      <tr><th className="p-6">Descrição</th><th className="p-6 text-center">Peso (kg)</th><th className="p-6 text-right">Unit.</th><th className="p-6 text-right">Total</th></tr>
                   </thead>
                   <tbody className="divide-y-2 divide-slate-100">
                      {orderToPrint.entries.map(e => (
                         <tr key={e.id} className="font-bold text-sm bg-white">
                            <td className="p-6 uppercase font-black text-[#002855]">{e.productName}</td>
                            <td className="p-6 text-center font-mono text-slate-600">{e.weightKg.toFixed(1)}</td>
                            <td className="p-6 text-right font-mono text-slate-600">{formatCurrency(e.pricePerKg)}</td>
                            <td className="p-6 text-right font-black font-mono text-slate-900">{formatCurrency(e.total)}</td>
                         </tr>
                      ))}
                   </tbody>
                   <tfoot>
                      <tr className="bg-slate-900 text-white">
                         <td colSpan={3} className="p-10 text-right text-2xl font-black uppercase italic tracking-tighter text-yellow-400">TOTAL DO PEDIDO:</td>
                         <td className="p-10 text-right text-4xl font-black text-white font-mono">{formatCurrency(orderToPrint.entries.reduce((a, b) => a + b.total, 0))}</td>
                      </tr>
                   </tfoot>
                </table>
             </div>
          </div>
        )}
      </main>

      {isSuccessModalOpen && lastSale && (
        <Modal title="Venda Processada!" onClose={() => setIsSuccessModalOpen(false)}>
           <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                 <CheckIcon className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-black text-[#002855] mb-2 px-2 break-words w-full">{lastSale.customer?.name}</h3>
              <div className="bg-slate-50 w-full p-6 rounded-3xl border border-slate-100 mb-8">
                 <p className="text-[10px] font-black uppercase text-slate-400 mb-1">VALOR TOTAL</p>
                 <p className="text-2xl md:text-3xl font-black text-[#002855] font-mono break-words">{formatCurrency(lastSale.sale?.total)}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 w-full">
                 <button onClick={() => { setOrderToPrint({ customer: lastSale.customer, entries: [lastSale.sale] }); setTimeout(() => window.print(), 500); }} className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-center gap-2 hover:bg-black transition-all">
                    <PrinterIcon className="w-5 h-5 text-yellow-500" /> <span className="text-[10px] font-black uppercase">PDF</span>
                 </button>
                 <a href={`https://wa.me/?text=Olá ${lastSale.customer?.name}, seu pedido na Rei do Pirarucu foi processado: %0A%0A*Item:* ${lastSale.sale?.productName}%0A*Total:* ${formatCurrency(lastSale.sale?.total)}`} target="_blank" rel="noreferrer" className="p-4 bg-emerald-600 text-white rounded-2xl flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all">
                    <UsersIcon className="w-5 h-5" /> <span className="text-[10px] font-black uppercase">Zap</span>
                 </a>
              </div>
              <button onClick={() => setIsSuccessModalOpen(false)} className="mt-8 text-[10px] font-black uppercase text-slate-400 hover:text-[#002855]">Fechar e Voltar</button>
           </div>
        </Modal>
      )}
    </div>
  );
};

const NavItem = ({ label, icon: Icon, active, onClick }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-8 py-5 relative transition-all group ${active ? 'text-white' : 'text-blue-200/50 hover:text-white hover:bg-white/5'}`}>
    <Icon className={`w-5 h-5 transition-transform shrink-0 ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
    <span className="font-black uppercase text-[10px] tracking-widest truncate">{label}</span>
    {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-10 w-1.5 bg-yellow-400 rounded-r-full shadow-lg" />}
  </button>
);

const DashCard = ({ label, val, subLabel, color }: any) => {
  const styles: any = { blue: "border-blue-500", emerald: "border-emerald-500", yellow: "border-yellow-500", red: "border-red-500" };
  return (
    <div className={`p-6 md:p-8 rounded-[2.5rem] border-t-8 bg-white shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 relative overflow-hidden group ${styles[color]}`}>
       <p className="text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest truncate">{label}</p>
       <p className="text-xl md:text-2xl font-black text-slate-900 tabular-nums break-words">{val}</p>
       <p className="text-[9px] font-bold text-slate-400 uppercase mt-2 tracking-tighter truncate">{subLabel}</p>
    </div>
  );
};

const Stat = ({ label, val, color }: any) => (
  <div className="text-left md:text-right flex-1 min-w-0">
    <p className="text-[9px] font-black uppercase text-slate-500 tracking-tighter truncate">{label}</p>
    <p className={`text-base md:text-xl font-black ${color} font-mono tracking-tighter break-words leading-tight`}>{val}</p>
  </div>
);

const Modal = ({ title, children, onClose }: any) => (
  <div className="fixed inset-0 bg-[#002855]/95 backdrop-blur-xl z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-300 border border-white/20">
      <div className="bg-[#002855] p-6 md:p-8 text-white flex justify-between items-center border-b border-white/10">
        <h3 className="text-[10px] md:text-xs font-black uppercase italic text-yellow-400 tracking-widest truncate flex-1 pr-2">{title}</h3>
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 flex justify-center items-center hover:bg-white/20 transition-all active:scale-90 shrink-0">✕</button>
      </div>
      <div className="p-6 md:p-10 custom-scrollbar overflow-y-auto max-h-[80vh]">{children}</div>
    </div>
  </div>
);

const Input = ({ label, uppercase, ...props }: any) => (
  <div>
    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-4 truncate">{label}</label>
    <input {...props} className={`w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 md:p-5 font-bold text-sm outline-none focus:border-[#002855] focus:bg-white transition-all shadow-inner ${uppercase ? 'uppercase' : ''}`} onChange={e => props.onChange(e.target.value)} />
  </div>
);

const PrimaryButton = ({ children, color = 'blue' }: any) => {
  const bg = color === 'blue' ? 'bg-[#002855] hover:bg-blue-900' : color === 'red' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700';
  return (
    <button type="submit" className={`w-full ${bg} text-white font-black py-5 md:py-6 rounded-2xl uppercase text-[10px] md:text-[11px] shadow-xl hover:shadow-2xl mt-4 active:scale-95 transition-all tracking-[0.2em] px-4 break-words`}>
      {children}
    </button>
  );
};

export default App;
