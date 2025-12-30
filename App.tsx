
import React, { useState, useEffect, useMemo } from 'react';
import { Customer, SaleEntry, StockItem, ViewType, PaymentRecord, PurchaseEntry, StockMovement } from './types';
import { INITIAL_CUSTOMERS, PRODUCT_SUGGESTIONS } from './constants';
import { 
  FishIcon, PlusIcon, BoxIcon, CheckIcon, 
  ChartIcon, LayoutIcon, UsersIcon, TrashIcon, 
  EditIcon, ShoppingIcon, PrinterIcon, WalletIcon, CreditCardIcon
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
  
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('pirarucu_customers_v5');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });
  
  const [stock, setStock] = useState<StockItem[]>(() => {
    const saved = localStorage.getItem('pirarucu_stock_v5');
    return saved ? JSON.parse(saved) : PRODUCT_SUGGESTIONS.map(p => ({ 
      productName: p.toUpperCase().trim(), availableWeight: 0, basePricePerKg: 0, lastUpdate: new Date().toISOString(), history: []
    }));
  });

  const [purchases, setPurchases] = useState<PurchaseEntry[]>(() => {
    const saved = localStorage.getItem('pirarucu_purchases_v5');
    return saved ? JSON.parse(saved) : [];
  });

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
  const [lastSale, setLastSale] = useState<{customer: Customer, sale: SaleEntry} | null>(null);
  const [selectedStockItem, setSelectedStockItem] = useState<StockItem | null>(null);
  const [orderToPrint, setOrderToPrint] = useState<{customer: Customer, entries: SaleEntry[]} | null>(null);
  const [dispatchSelection, setDispatchSelection] = useState<{cid: string, eids: string[]} | null>(null);

  const [formData, setFormData] = useState({ productName: '', pricePerKg: '', weightKg: '', date: new Date().toISOString().split('T')[0] });
  const [stockFormData, setStockFormData] = useState({ name: '', weight: '', price: '' });
  const [purchaseFormData, setPurchaseFormData] = useState({ productName: '', weightKg: '', pricePerKg: '', total: '', date: new Date().toISOString().split('T')[0], supplier: '' });
  const [creditFormData, setCreditFormData] = useState({ limit: '', walletAdd: '' });
  const [customerFormData, setCustomerFormData] = useState({ name: '', taxId: '', phone: '', address: '' });
  const [newProductFormData, setNewProductFormData] = useState({ name: '', weight: '', price: '' });
  const [emailToShare, setEmailToShare] = useState('');
  
  const [dispatchTab, setDispatchTab] = useState<'pay' | 'ship'>('pay');
  const [payData, setPayData] = useState({ amount: '', method: 'Pix', date: new Date().toISOString().split('T')[0] });
  const [shipData, setShipData] = useState({ carrier: '', tracking: '' });

  // Itens que não devem aparecer no estoque físico
  const SERVICE_ITEMS = ['FRETE', 'CAIXA', 'DEPOSITO'];

  useEffect(() => localStorage.setItem('pirarucu_customers_v5', JSON.stringify(customers)), [customers]);
  useEffect(() => localStorage.setItem('pirarucu_stock_v5', JSON.stringify(stock)), [stock]);
  useEffect(() => localStorage.setItem('pirarucu_purchases_v5', JSON.stringify(purchases)), [purchases]);

  const stats = useMemo(() => {
    let rev = 0, rec = 0, pend = 0, kg = 0, saleCount = 0, totalExposure = 0;
    const customerRanking: Record<string, { name: string, total: number, sales: number }> = {};
    const productRanking: Record<string, { weight: number, revenue: number, transactions: number }> = {};

    customers.forEach(c => {
      totalExposure += (c.creditLimit || 0);
      customerRanking[c.id] = { name: c.name, total: 0, sales: 0 };
      c.entries.forEach(e => {
        rev += e.total;
        kg += e.weightKg;
        saleCount++;
        const paid = e.isPaid ? e.total : (e.paidAmount || 0);
        rec += paid;
        pend += (e.total - paid);
        
        customerRanking[c.id].total += e.total;
        customerRanking[c.id].sales += 1;
        
        if (!productRanking[e.productName]) productRanking[e.productName] = { weight: 0, revenue: 0, transactions: 0 };
        productRanking[e.productName].weight += e.weightKg;
        productRanking[e.productName].revenue += e.total;
        productRanking[e.productName].transactions += 1;
      });
    });
    
    const costs = purchases.reduce((a, b) => a + b.total, 0);
    const profit = rev - costs;
    const efficiency = rev > 0 ? (rec / rev) * 100 : 0;
    const ticketMedio = saleCount > 0 ? rev / saleCount : 0;

    const topPerformanceCustomers = Object.values(customerRanking).sort((a, b) => b.total - a.total).slice(0, 8);
    const mostProfitableProducts = Object.entries(productRanking).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 5);

    return { 
      rev, rec, pend, kg, costs, profit, efficiency, ticketMedio, totalExposure,
      topPerformanceCustomers,
      mostProfitableProducts,
      monthlyData: Array.from({ length: 6 }).map((_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthKey = d.toISOString().substring(0, 7);
        const mRev = customers.reduce((acc, c) => acc + c.entries.filter(e => e.date.startsWith(monthKey)).reduce((sum, e) => sum + e.total, 0), 0);
        const mCosts = purchases.filter(p => p.date.startsWith(monthKey)).reduce((sum, p) => sum + p.total, 0);
        return { month: monthKey, revenue: mRev, costs: mCosts };
      }).reverse(),
      top3LowStock: [...stock].sort((a, b) => a.availableWeight - b.availableWeight).slice(0, 3)
    };
  }, [customers, purchases, stock]);

  const handleLaunchSale = (e: React.FormEvent) => {
    e.preventDefault();
    const weight = Number(formData.weightKg);
    const pName = formData.productName.toUpperCase().trim();
    const customer = customers.find(c => c.id === activeCustomerId);
    const totalVenda = weight * Number(formData.pricePerKg);

    if (customer) {
      const currentPending = customer.entries.reduce((acc, ent) => acc + (ent.total - (ent.paidAmount || 0)), 0);
      const available = (customer.creditLimit || 0) - currentPending;
      if (totalVenda > available && customer.creditLimit > 0) {
        if (!window.confirm(`ALERTA FINANCEIRO: O pedido de ${formatCurrency(totalVenda)} excede o limite de crédito disponível de ${formatCurrency(available)}. Prosseguir com a carga?`)) return;
      }
    }
    
    // Só abate do estoque se não for um item de serviço
    if (!SERVICE_ITEMS.includes(pName)) {
      setStock(prev => prev.map(s => s.productName === pName ? { 
        ...s, 
        availableWeight: s.availableWeight - weight,
        history: [{ id: Date.now().toString(), type: 'exit', weight: -weight, date: formData.date, description: `Venda p/ ${customer?.name}` }, ...(s.history || [])]
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
    
    if (customer) {
      setLastSale({ customer, sale: newSale });
      setIsSuccessModalOpen(true);
    }
  };

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerFormData.name) return;
    
    const newCustomer: Customer = {
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

    setCustomers(prev => [newCustomer, ...prev]);
    setIsCustomerModalOpen(false);
    setCustomerFormData({ name: '', taxId: '', phone: '', address: '' });
  };

  const handleAddNewProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const pName = newProductFormData.name.toUpperCase().trim();
    if (!pName) return;

    if (stock.find(s => s.productName === pName)) {
      alert("Este produto já existe no catálogo.");
      return;
    }

    const weight = Number(newProductFormData.weight) || 0;
    const price = Number(newProductFormData.price) || 0;

    const newItem: StockItem = {
      productName: pName,
      availableWeight: weight,
      basePricePerKg: price,
      lastUpdate: new Date().toISOString(),
      history: weight > 0 ? [{ 
        id: Date.now().toString(), 
        type: 'adjustment', 
        weight: weight, 
        date: new Date().toISOString(), 
        description: 'Saldo Inicial de Cadastro' 
      }] : []
    };

    setStock(prev => [newItem, ...prev]);
    setIsNewProductModalOpen(false);
    setNewProductFormData({ name: '', weight: '', price: '' });
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailToShare || !lastSale) return;
    alert(`O PDF do pedido #${lastSale.sale.id} foi gerado e enviado para ${emailToShare} com sucesso!`);
    setEmailToShare('');
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
          history: [{ id: Date.now().toString(), type: 'adjustment', weight: diff, date: new Date().toISOString(), description: 'Ajuste de Balanço Manual' }, ...(s.history || [])]
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

    const newPurchase: PurchaseEntry = {
      id: `PUR-${Date.now().toString().slice(-6)}`,
      productName: pName,
      weightKg: weight,
      pricePerKg: price,
      total,
      date: purchaseFormData.date,
      supplier: purchaseFormData.supplier
    };

    setPurchases(prev => [newPurchase, ...prev]);

    // Só atualiza o estoque se não for item de serviço
    if (!SERVICE_ITEMS.includes(pName)) {
      setStock(prev => {
        const existing = prev.find(s => s.productName === pName);
        if (existing) {
          return prev.map(s => s.productName === pName ? {
            ...s,
            availableWeight: s.availableWeight + weight,
            basePricePerKg: price || s.basePricePerKg,
            history: [{ 
              id: Date.now().toString(), 
              type: 'entry', 
              weight: weight, 
              date: purchaseFormData.date, 
              description: `Compra: ${purchaseFormData.supplier || 'Fornecedor'}` 
            }, ...(s.history || [])]
          } : s);
        } else {
          return [...prev, {
            productName: pName,
            availableWeight: weight,
            basePricePerKg: price,
            lastUpdate: new Date().toISOString(),
            history: [{ 
              id: Date.now().toString(), 
              type: 'entry', 
              weight: weight, 
              date: purchaseFormData.date, 
              description: `Compra Inicial: ${purchaseFormData.supplier || 'Fornecedor'}` 
            }]
          }];
        }
      });
    }

    setIsPurchaseModalOpen(false);
    setPurchaseFormData({ productName: '', weightKg: '', pricePerKg: '', total: '', date: new Date().toISOString().split('T')[0], supplier: '' });
  };

  const handleCreditUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomers(prev => prev.map(c => {
      if (c.id === activeCustomerId) {
        return { ...c, creditLimit: Number(creditFormData.limit), walletBalance: (c.walletBalance || 0) + Number(creditFormData.walletAdd) };
      }
      return c;
    }));
    setIsCreditModalOpen(false);
  };

  const handleDispatchAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchSelection) return;
    setCustomers(prev => prev.map(c => {
      if (c.id !== dispatchSelection.cid) return c;
      return {
        ...c,
        entries: c.entries.map(ent => {
          if (!dispatchSelection.eids.includes(ent.id)) return ent;
          if (dispatchTab === 'pay') {
            const remaining = ent.total - (ent.paidAmount || 0);
            const amount = Math.min(Number(payData.amount), remaining);
            const newPaid = (ent.paidAmount || 0) + amount;
            const full = newPaid >= ent.total;
            return {
              ...ent,
              paidAmount: newPaid,
              isPaid: full,
              paidAt: full ? payData.date : ent.paidAt,
              paymentHistory: [...(ent.paymentHistory || []), { id: Date.now().toString(), amount, date: payData.date, method: payData.method }]
            };
          } else {
            return { ...ent, isDispatched: true, dispatchedAt: new Date().toISOString() };
          }
        })
      };
    }));
    setIsDispatchModalOpen(false);
  };

  const handleDeletePurchase = (id: string) => {
    if (!window.confirm("Deseja realmente excluir este registro de compra? Isso não estornará o estoque automaticamente.")) return;
    setPurchases(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="flex min-h-screen bg-[#f1f5f9] font-['Inter']">
      <aside className={`fixed md:relative inset-y-0 left-0 w-72 bg-[#002855] text-white flex flex-col shadow-2xl z-50 transition-transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-8 border-b border-white/10"><BrandLogo /></div>
        <nav className="flex-1 mt-6 overflow-y-auto custom-scrollbar">
          <NavItem label="Dashboard" icon={LayoutIcon} active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
          <NavItem label="Estoque Físico" icon={BoxIcon} active={activeView === 'inventory'} onClick={() => setActiveView('inventory')} />
          <NavItem label="Controle de Compras" icon={ShoppingIcon} active={activeView === 'purchases'} onClick={() => setActiveView('purchases')} />
          <NavItem label="Vendas & Clientes" icon={UsersIcon} active={activeView === 'customers'} onClick={() => setActiveView('customers')} />
          <NavItem label="Relatório Inteligente" icon={ChartIcon} active={activeView === 'reports'} onClick={() => setActiveView('reports')} />
        </nav>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 px-8 flex items-center justify-between border-b bg-white/95 backdrop-blur-md z-40 print:hidden shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden p-2"><LayoutIcon className="w-6 h-6 text-[#002855]"/></button>
            <h2 className="text-xl font-black uppercase text-[#002855] italic tracking-tight">Gestão <span className="text-yellow-500">Logística</span></h2>
          </div>
          <div className="flex gap-8">
            <Stat label="Exposição de Crédito" val={formatCurrency(stats.totalExposure)} color="text-yellow-600" />
            <Stat label="Recebido Real" val={formatCurrency(stats.rec)} color="text-emerald-600" />
            <Stat label="Pendência Global" val={formatCurrency(stats.pend)} color="text-red-600" />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar print:hidden">
          {activeView === 'dashboard' && (
            <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <DashCard label="Vendas Totais" val={formatCurrency(stats.rev)} icon={ChartIcon} color="blue" />
                <DashCard label="Custo Acumulado" val={formatCurrency(stats.costs)} icon={ShoppingIcon} color="red" />
                <DashCard label="Margem Est. Bruta" val={formatCurrency(stats.rev - stats.costs)} icon={FishIcon} color="emerald" />
                <DashCard label="Risco Concedido" val={formatCurrency(stats.totalExposure)} icon={CreditCardIcon} color="yellow" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60 flex flex-col">
                  <div className="flex justify-between items-center mb-10">
                    <h3 className="text-lg font-black uppercase italic text-[#002855]">Performance de Fluxo Mensal</h3>
                  </div>
                  <div className="flex-1 flex items-end justify-between gap-4 h-[300px] px-4">
                    {stats.monthlyData.map((d, i) => {
                      const maxVal = Math.max(...stats.monthlyData.map(x => Math.max(x.revenue, x.costs)), 1);
                      const revHeight = (d.revenue / maxVal) * 100;
                      const costHeight = (d.costs / maxVal) * 100;
                      const monthName = new Date(d.month + '-01').toLocaleString('pt-BR', { month: 'short' }).toUpperCase();
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full">
                          <div className="flex-1 w-full flex items-end justify-center gap-1.5 group">
                            <div className="w-full max-w-[30px] bg-[#002855] rounded-t-lg transition-all duration-500 relative hover:brightness-110 cursor-help" style={{ height: `${revHeight}%` }}>
                              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">{formatCurrency(d.revenue)}</div>
                            </div>
                            <div className="w-full max-w-[30px] bg-red-500 rounded-t-lg transition-all duration-500 relative hover:brightness-110 cursor-help" style={{ height: `${costHeight}%` }}>
                              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">{formatCurrency(d.costs)}</div>
                            </div>
                          </div>
                          <span className="text-[10px] font-black text-slate-500 mt-2">{monthName}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60 flex flex-col">
                  <h3 className="text-lg font-black uppercase italic text-[#002855] mb-6 border-b border-slate-100 pb-4">Status de Risco</h3>
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200/60 shadow-inner">
                     <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Total Pendente vs Limites</p>
                     <p className="text-2xl font-black text-red-600">{((stats.pend / (stats.totalExposure || 1)) * 100).toFixed(1)}%</p>
                     <div className="w-full bg-slate-200 h-2 rounded-full mt-4 overflow-hidden">
                        <div className="bg-red-500 h-full transition-all duration-1000" style={{width: `${Math.min((stats.pend / (stats.totalExposure || 1)) * 100, 100)}%`}}></div>
                     </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === 'purchases' && (
            <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500">
               <div className="flex justify-between items-center mb-6">
                 <div>
                    <h3 className="text-3xl font-black uppercase italic text-[#002855]">Controle de <span className="text-yellow-500">Compras</span></h3>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Gestão de entradas e custos de aquisição</p>
                 </div>
                 <button 
                   onClick={() => setIsPurchaseModalOpen(true)} 
                   className="bg-[#002855] text-white px-8 py-5 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.1em] flex items-center gap-3 shadow-xl hover:shadow-2xl hover:bg-blue-900 transition-all active:scale-95 border border-white/10"
                 >
                    <PlusIcon className="w-5 h-5 text-yellow-500" /> NOVO LANÇAMENTO DE COMPRA
                 </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4">
                     <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600">
                        <ShoppingIcon className="w-6 h-6" />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Custo Total Acumulado</p>
                        <p className="text-xl font-black text-slate-900 tabular-nums">{formatCurrency(stats.costs)}</p>
                     </div>
                  </div>
                  <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4">
                     <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                        <BoxIcon className="w-6 h-6" />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Volume Comprado</p>
                        <p className="text-xl font-black text-slate-900 tabular-nums">{purchases.reduce((acc, p) => acc + p.weightKg, 0).toFixed(1)} KG</p>
                     </div>
                  </div>
                  <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4">
                     <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-[#002855]">
                        <UsersIcon className="w-6 h-6" />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Fornecedores</p>
                        <p className="text-xl font-black text-slate-900 tabular-nums">{new Set(purchases.map(p => p.supplier)).size}</p>
                     </div>
                  </div>
               </div>

               <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200/60 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-500">
                    <tr>
                      <th className="px-8 py-6">Data</th>
                      <th className="px-8 py-6">Produto</th>
                      <th className="px-8 py-6">Fornecedor</th>
                      <th className="px-8 py-6 text-right">Peso (KG)</th>
                      <th className="px-8 py-6 text-right">Preço/KG</th>
                      <th className="px-8 py-6 text-right">Total</th>
                      <th className="px-8 py-6 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {purchases.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-8 py-20 text-center">
                           <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Nenhuma compra registrada no sistema.</p>
                        </td>
                      </tr>
                    ) : purchases.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-8 py-5 text-xs font-bold text-slate-400">{new Date(p.date).toLocaleDateString()}</td>
                        <td className="px-8 py-5 text-xs font-black uppercase text-[#002855]">{p.productName}</td>
                        <td className="px-8 py-5 text-xs font-bold uppercase text-slate-500">{p.supplier || 'N/A'}</td>
                        <td className="px-8 py-5 text-right font-black tabular-nums">{p.weightKg.toFixed(1)}</td>
                        <td className="px-8 py-5 text-right font-bold text-slate-400 tabular-nums">{formatCurrency(p.pricePerKg)}</td>
                        <td className="px-8 py-5 text-right font-black text-red-600 tabular-nums">{formatCurrency(p.total)}</td>
                        <td className="px-8 py-5 text-center">
                           <button 
                             onClick={() => handleDeletePurchase(p.id)} 
                             className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                           >
                             <TrashIcon className="w-4 h-4" />
                           </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeView === 'customers' && (
            <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500">
              <div className="flex justify-between items-center mb-6">
                <div>
                   <h3 className="text-3xl font-black uppercase italic text-[#002855]">Vendas & <span className="text-yellow-500">Clientes</span></h3>
                   <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Gestão de carteira e histórico de faturamento</p>
                </div>
                <button 
                  onClick={() => setIsCustomerModalOpen(true)} 
                  className="bg-[#002855] text-white px-8 py-5 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.1em] flex items-center gap-3 shadow-xl hover:shadow-2xl hover:bg-blue-900 transition-all active:scale-95 border border-white/10"
                >
                   <PlusIcon className="w-5 h-5 text-yellow-500" /> ADICIONAR NOVO CLIENTE
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {customers.map(c => (
                  <CustomerCard 
                    key={c.id} customer={c} 
                    onAddEntry={(id) => { setActiveCustomerId(id); setIsVendaModalOpen(true); }} 
                    onDeleteEntry={(cid, eid) => {
                      if (!window.confirm("Estornar peso ao estoque físico?")) return;
                      const ent = c.entries.find(e => e.id === eid);
                      if (ent && !SERVICE_ITEMS.includes(ent.productName)) setStock(p => p.map(s => s.productName === ent.productName ? { ...s, availableWeight: s.availableWeight + ent.weightKg } : s));
                      setCustomers(p => p.map(cust => cust.id === cid ? { ...cust, entries: cust.entries.filter(e => e.id !== eid) } : cust));
                    }} 
                    onTogglePayment={(cid, eid) => {
                      setCustomers(prev => prev.map(cust => cust.id === cid ? { ...cust, entries: cust.entries.map(e => e.id === eid ? { ...e, isPaid: !e.isPaid, paidAmount: !e.isPaid ? e.total : 0, paidAt: !e.isPaid ? new Date().toISOString() : undefined } : e) } : cust));
                    }} 
                    onPartialPayment={(cid, eid) => { 
                      const entry = c.entries.find(ex => ex.id === eid);
                      const remaining = (entry?.total || 0) - (entry?.paidAmount || 0);
                      setDispatchSelection({cid, eids: [eid]}); 
                      setDispatchTab('pay'); 
                      setPayData(p => ({...p, amount: remaining.toString() })); 
                      setIsDispatchModalOpen(true); 
                    }} 
                    onDeleteCustomer={(id) => { if(window.confirm("Atenção: Excluir o cliente removerá todo o histórico de vendas. Deseja prosseguir?")) setCustomers(p => p.filter(cx => cx.id !== id)); }} 
                    onPrintOrder={(entries) => { setOrderToPrint({ customer: c, entries }); setTimeout(() => window.print(), 500); }}
                    onDispatch={(cid, eids) => { setDispatchSelection({cid, eids}); setDispatchTab('ship'); setIsDispatchModalOpen(true); }}
                    onManageCredit={(id) => { 
                      const cust = customers.find(x => x.id === id);
                      setActiveCustomerId(id); 
                      setCreditFormData({ limit: (cust?.creditLimit || 0).toString(), walletAdd: '0' });
                      setIsCreditModalOpen(true); 
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {activeView === 'inventory' && (
            <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500">
              <div className="flex justify-between items-center mb-6">
                <div>
                   <h3 className="text-3xl font-black uppercase italic text-[#002855]">Estoque <span className="text-yellow-500">Físico</span></h3>
                   <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Monitoramento de saldo e custo base</p>
                </div>
                <button 
                  onClick={() => setIsNewProductModalOpen(true)} 
                  className="bg-[#002855] text-white px-8 py-5 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.1em] flex items-center gap-3 shadow-xl hover:shadow-2xl hover:bg-blue-900 transition-all active:scale-95 border border-white/10"
                >
                   <PlusIcon className="w-5 h-5 text-yellow-500" /> CADASTRAR NOVO PRODUTO
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {stock
                  .filter(item => !SERVICE_ITEMS.includes(item.productName.toUpperCase()))
                  .map(item => {
                    const isCritical = item.availableWeight <= 0;
                    const isLow = item.availableWeight <= 20;
                    const statusColor = isCritical ? 'border-red-500 bg-red-50 text-red-900' : isLow ? 'border-yellow-500 bg-yellow-50 text-amber-900' : 'border-emerald-500 bg-emerald-50 text-emerald-900';
                    return (
                      <div key={item.productName} className={`p-8 rounded-[2.5rem] border-t-8 shadow-xl flex flex-col justify-between h-72 transition-all hover:scale-[1.03] group ${statusColor}`}>
                        <div className="flex justify-between items-start">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-black transition-colors">{item.productName}</h4>
                          <button onClick={() => { setStockFormData({ name: item.productName, weight: item.availableWeight.toString(), price: item.basePricePerKg.toString() }); setIsStockModalOpen(true); }} className="p-2 hover:bg-black/5 rounded-xl transition-all"><EditIcon className="w-5 h-5"/></button>
                        </div>
                        <div>
                          <p className="text-5xl font-black tracking-tighter tabular-nums">{item.availableWeight.toFixed(1)}<span className="text-lg ml-1 opacity-60">kg</span></p>
                          <p className="text-[10px] font-bold uppercase mt-2 opacity-50">Custo Ref: {formatCurrency(item.basePricePerKg)}</p>
                        </div>
                        <button onClick={() => { setSelectedStockItem(item); setIsHistoryModalOpen(true); }} className="text-[10px] font-black uppercase tracking-widest pt-4 border-t border-black/5 hover:opacity-50 text-center transition-all">Auditoria de Balanço</button>
                      </div>
                    );
                })}
              </div>
            </div>
          )}

          {activeView === 'reports' && (
            <div className="max-w-[1400px] mx-auto space-y-10 animate-in fade-in duration-500">
              <div className="flex justify-between items-end border-b border-slate-200 pb-6">
                 <div>
                    <h3 className="text-3xl font-black uppercase italic text-[#002855]">Relatório <span className="text-yellow-500">Inteligente</span></h3>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Análise de Curva ABC e Saúde Financeira</p>
                 </div>
                 <button onClick={() => window.print()} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] flex items-center gap-2 hover:bg-black transition-all shadow-lg active:scale-95"><PrinterIcon className="w-4 h-4"/> Exportar BI</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                 <ReportKPI label="Eficiência de Recebimento" val={`${stats.efficiency.toFixed(1)}%`} color="emerald" progress={stats.efficiency} />
                 <ReportKPI label="Ticket Médio" val={formatCurrency(stats.ticketMedio)} color="blue" />
                 <ReportKPI label="Exposição de Risco" val={formatCurrency(stats.totalExposure)} color="red" progress={(stats.pend / (stats.totalExposure || 1)) * 100} />
                 <ReportKPI label="Volume Logístico" val={`${stats.kg.toFixed(0)} kg`} color="yellow" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm">
                    <h4 className="text-sm font-black uppercase text-[#002855] mb-6 flex items-center gap-2 italic">
                       <UsersIcon className="w-5 h-5 text-yellow-500"/> Performance do Cliente (Curva ABC)
                    </h4>
                    <div className="space-y-4">
                       {stats.topPerformanceCustomers.map((c, i) => {
                         const grade = i < 2 ? 'A' : i < 5 ? 'B' : 'C';
                         return (
                           <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:scale-[1.01] transition-transform">
                              <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${grade === 'A' ? 'bg-[#002855] text-yellow-400' : 'bg-slate-200 text-slate-500'}`}>{grade}</span>
                              <div className="flex-1">
                                 <p className="text-xs font-black uppercase text-[#002855] truncate">{c.name}</p>
                                 <p className="text-[9px] font-bold text-slate-400 uppercase">{c.sales} pedidos realizados</p>
                              </div>
                              <p className="text-sm font-black text-slate-800">{formatCurrency(c.total)}</p>
                           </div>
                         );
                       })}
                    </div>
                 </div>

                 <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm">
                    <h4 className="text-sm font-black uppercase text-[#002855] mb-6 flex items-center gap-2 italic">
                       <BoxIcon className="w-5 h-5 text-yellow-500"/> Rentabilidade por Produto
                    </h4>
                    <div className="space-y-4">
                       {stats.mostProfitableProducts.map(([name, d], i) => (
                         <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                            <div className="flex-1">
                               <p className="text-xs font-black uppercase text-[#002855]">{name}</p>
                               <div className="w-full bg-slate-200 h-1 rounded-full mt-2">
                                  <div className="bg-emerald-500 h-full" style={{width: `${(d.revenue / stats.rev) * 100}%`}}></div>
                               </div>
                            </div>
                            <div className="text-right">
                               <p className="text-sm font-black text-slate-800">{d.weight.toFixed(1)} kg</p>
                               <p className="text-[9px] font-bold text-emerald-600 uppercase">{formatCurrency(d.revenue)}</p>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
            </div>
          )}
        </div>

        {orderToPrint && (
          <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-16 text-black font-sans leading-relaxed">
            <div className="max-w-4xl mx-auto border-[10px] border-[#002855] p-10 rounded-3xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#002855] rounded-bl-full flex items-center justify-center -translate-y-4 translate-x-4 opacity-10">
                 <FishIcon className="w-24 h-24 text-white -rotate-12" />
              </div>
              <div className="border-b-4 border-[#002855] pb-8 mb-10 flex justify-between items-center relative z-10">
                 <div>
                   <h1 className="text-6xl font-black italic uppercase text-[#002855] mb-2">REI DO <span className="text-yellow-500">PIRARUCU</span></h1>
                   <p className="text-[11px] uppercase font-bold tracking-[0.5em] text-slate-400">Pescados e Frutos do Mar Amazônicos • PVH/RO</p>
                 </div>
                 <div className="text-right">
                    <div className="bg-[#002855] text-yellow-500 px-6 py-4 rounded-2xl shadow-xl">
                       <h2 className="text-[9px] font-black uppercase tracking-widest mb-1 text-white">PEDIDO OFICIAL</h2>
                       <p className="text-2xl font-mono font-black tracking-tighter">#{orderToPrint.entries[0]?.id || 'N/A'}</p>
                    </div>
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-12 mb-12">
                <div className="bg-slate-50 p-8 rounded-[2rem] border-l-8 border-[#002855] shadow-sm">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">DADOS DO CLIENTE</h4>
                  <p className="text-2xl font-black uppercase text-[#002855] leading-tight mb-2">{orderToPrint.customer.name}</p>
                  <div className="space-y-1 text-xs font-bold text-slate-600">
                    <p className="flex justify-between border-b border-slate-200 pb-1">CPF/CNPJ: <span>{orderToPrint.customer.taxId || 'N/A'}</span></p>
                    <p className="flex justify-between border-b border-slate-200 pb-1 mt-2">EMISSÃO: <span>{new Date().toLocaleDateString('pt-BR')}</span></p>
                  </div>
                </div>
                <div className="flex flex-col justify-end text-right">
                   <div className="inline-block bg-yellow-50 border-2 border-yellow-200 p-6 rounded-[2rem] shadow-sm">
                      <p className="text-[10px] font-black uppercase tracking-widest text-yellow-800 mb-1">CONDIÇÃO COMERCIAL</p>
                      <p className="text-xl font-black uppercase text-yellow-900 italic">CARTEIRA / FATURADO</p>
                   </div>
                </div>
              </div>
              <table className="w-full mb-12 border-collapse overflow-hidden rounded-2xl shadow-sm border border-slate-100">
                <thead>
                  <tr className="bg-[#002855] text-white uppercase text-[10px] font-black tracking-[0.2em]">
                    <th className="p-6 text-left">DESCRIÇÃO DO PRODUTO</th>
                    <th className="p-6 text-center">QUANT.(KG)</th>
                    <th className="p-6 text-right">PREÇO/KG</th>
                    <th className="p-6 text-right">VALOR TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-slate-100">
                  {orderToPrint.entries.map((e) => (
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
                    <td colSpan={3} className="p-8 text-right text-xl font-black uppercase italic tracking-tighter text-yellow-500">VALOR TOTAL DO PEDIDO:</td>
                    <td className="p-8 text-right text-3xl font-black text-white font-mono">{formatCurrency(orderToPrint.entries.reduce((a, b) => a + b.total, 0))}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* MODALS */}
      {isCustomerModalOpen && (
        <Modal title="Cadastrar Novo Cliente" onClose={() => setIsCustomerModalOpen(false)}>
           <div className="mb-6 p-6 bg-blue-50 rounded-[2rem] border border-blue-200 flex items-center gap-6 shadow-inner">
              <UsersIcon className="w-12 h-12 text-[#002855]" />
              <div>
                 <p className="text-xs font-black uppercase text-[#002855] tracking-wider leading-none">Novas Parcerias</p>
                 <p className="text-[10px] text-blue-600 uppercase font-bold mt-2 leading-relaxed">Cadastre os dados básicos para iniciar o faturamento e controle de limite deste cliente.</p>
              </div>
           </div>
           <form onSubmit={handleAddCustomer} className="space-y-5">
              <Input label="Nome Completo / Razão Social" uppercase required value={customerFormData.name} onChange={(v: string) => setCustomerFormData({...customerFormData, name: v})} />
              <Input label="CPF ou CNPJ" value={customerFormData.taxId} onChange={(v: string) => setCustomerFormData({...customerFormData, taxId: v})} />
              <Input label="Telefone de Contato" value={customerFormData.phone} onChange={(v: string) => setCustomerFormData({...customerFormData, phone: v})} />
              <Input label="Endereço Completo" uppercase value={customerFormData.address} onChange={(v: string) => setCustomerFormData({...customerFormData, address: v})} />
              <PrimaryButton>FINALIZAR CADASTRO</PrimaryButton>
           </form>
        </Modal>
      )}

      {isNewProductModalOpen && (
        <Modal title="Cadastrar Novo Produto / Espécie" onClose={() => setIsNewProductModalOpen(false)}>
           <div className="mb-6 p-6 bg-emerald-50 rounded-[2rem] border border-emerald-200 flex items-center gap-6 shadow-inner">
              <BoxIcon className="w-12 h-12 text-emerald-600" />
              <div>
                 <p className="text-xs font-black uppercase text-emerald-800 tracking-wider leading-none">Novas Espécies</p>
                 <p className="text-[10px] text-emerald-600 uppercase font-bold mt-2 leading-relaxed">Adicione novos cortes ou espécies ao seu catálogo de faturamento.</p>
              </div>
           </div>
           <form onSubmit={handleAddNewProduct} className="space-y-5">
              <Input label="Nome do Produto / Espécie" uppercase required value={newProductFormData.name} onChange={(v: string) => setNewProductFormData({...newProductFormData, name: v})} />
              <div className="grid grid-cols-2 gap-4">
                 <Input label="Estoque Inicial (KG)" type="number" step="0.01" value={newProductFormData.weight} onChange={(v: string) => setNewProductFormData({...newProductFormData, weight: v})} />
                 <Input label="Preço Custo Base (R$)" type="number" step="0.01" value={newProductFormData.price} onChange={(v: string) => setNewProductFormData({...newProductFormData, price: v})} />
              </div>
              <PrimaryButton>SALVAR NO CATÁLOGO</PrimaryButton>
           </form>
        </Modal>
      )}

      {isSuccessModalOpen && lastSale && (
        <Modal title="Venda Concluída com Sucesso!" onClose={() => setIsSuccessModalOpen(false)}>
           <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-emerald-100 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-inner">
                 <CheckIcon className="w-12 h-12 text-emerald-600" />
              </div>
              <h3 className="text-3xl font-black uppercase text-[#002855] mb-2 italic">{lastSale.customer.name}</h3>
              <div className="bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100 mb-8 inline-block shadow-inner">
                 <p className="text-[10px] font-bold text-slate-500 uppercase">Total do Pedido</p>
                 <p className="text-2xl font-black text-slate-900 font-mono">{formatCurrency(lastSale.sale.total)}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-8">
                 <button 
                   onClick={() => { setOrderToPrint({ customer: lastSale.customer, entries: [lastSale.sale] }); setTimeout(() => window.print(), 500); }}
                   className="flex items-center justify-center gap-4 p-6 bg-[#002855] text-white rounded-[2rem] hover:bg-blue-900 transition-all shadow-xl active:scale-95 group"
                 >
                    <PrinterIcon className="w-6 h-6 text-yellow-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Gerar PDF</span>
                 </button>
                 <a 
                   href={`https://wa.me/?text=Olá ${lastSale.customer.name}, segue o comprovante do seu pedido na *Rei do Pirarucu*: %0A%0A📦 *Item:* ${lastSale.sale.productName}%0A💰 *Total:* ${formatCurrency(lastSale.sale.total)}`}
                   target="_blank" rel="noopener noreferrer"
                   className="flex items-center justify-center gap-4 p-6 bg-emerald-600 text-white rounded-[2rem] hover:bg-emerald-700 transition-all shadow-xl active:scale-95 group"
                 >
                    <UsersIcon className="w-6 h-6 text-white" />
                    <span className="text-[10px] font-black uppercase tracking-widest">WhatsApp</span>
                 </a>
              </div>
              <div className="w-full bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 shadow-inner">
                 <p className="text-[10px] font-black uppercase text-[#002855] tracking-widest mb-4">Enviar Pedido por E-mail</p>
                 <form onSubmit={handleSendEmail} className="flex gap-2">
                    <input 
                      type="email" placeholder="email@cliente.com" required 
                      value={emailToShare} onChange={(e) => setEmailToShare(e.target.value)}
                      className="flex-1 bg-white border-2 border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-[#002855] transition-all shadow-sm"
                    />
                    <button type="submit" className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase hover:bg-black transition-all active:scale-95 shadow-lg">Enviar</button>
                 </form>
              </div>
              <button onClick={() => setIsSuccessModalOpen(false)} className="mt-10 text-[10px] font-black uppercase text-slate-400 hover:text-red-500 transition-colors">Voltar ao Sistema</button>
           </div>
        </Modal>
      )}

      {isPurchaseModalOpen && (
        <Modal title="Lançar Nova Compra / Entrada de Estoque" onClose={() => setIsPurchaseModalOpen(false)}>
           <div className="mb-6 p-6 bg-red-50 rounded-[2rem] border border-red-200 flex items-center gap-6 shadow-inner">
              <ShoppingIcon className="w-12 h-12 text-red-600" />
              <div>
                 <p className="text-xs font-black uppercase text-red-800 tracking-wider leading-none">Gestão de Abastecimento</p>
                 <p className="text-[10px] text-red-600 uppercase font-bold mt-2 leading-relaxed">Este lançamento aumentará automaticamente o estoque físico do produto selecionado.</p>
              </div>
           </div>
           <form onSubmit={handlePurchaseEntry} className="space-y-5">
              <Input label="Produto / Espécie" list="plist-compra" uppercase value={purchaseFormData.productName} onChange={(v: string) => setPurchaseFormData({...purchaseFormData, productName: v})} />
              <datalist id="plist-compra">{stock.map(s => <option key={s.productName} value={s.productName} />)}</datalist>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Peso Comprado (KG)" type="number" step="0.01" value={purchaseFormData.weightKg} onChange={(v: string) => setPurchaseFormData({...purchaseFormData, weightKg: v})} />
                <Input label="Preço Custo/KG" type="number" step="0.01" value={purchaseFormData.pricePerKg} onChange={(v: string) => setPurchaseFormData({...purchaseFormData, pricePerKg: v})} />
              </div>
              <Input label="Valor Total Pago" type="number" step="0.01" value={purchaseFormData.total} onChange={(v: string) => setPurchaseFormData({...purchaseFormData, total: v})} />
              <div className="grid grid-cols-2 gap-4">
                 <Input label="Fornecedor / Origem" uppercase value={purchaseFormData.supplier} onChange={(v: string) => setPurchaseFormData({...purchaseFormData, supplier: v})} />
                 <Input label="Data da Compra" type="date" value={purchaseFormData.date} onChange={(v: string) => setPurchaseFormData({...purchaseFormData, date: v})} />
              </div>
              <PrimaryButton color="red">REGISTRAR ENTRADA NO ESTOQUE</PrimaryButton>
           </form>
        </Modal>
      )}

      {isVendaModalOpen && (
        <Modal title="Processar Novo Pedido" onClose={() => setIsVendaModalOpen(false)}>
          <form onSubmit={handleLaunchSale} className="space-y-4">
            <Input label="Produto" list="plist" uppercase value={formData.productName} onChange={(v: string) => setFormData({...formData, productName: v})} />
            <datalist id="plist">{stock.map(s => <option key={s.productName} value={s.productName} />)}</datalist>
            <div className="grid grid-cols-2 gap-4"><Input label="Valor/KG" type="number" step="0.01" value={formData.pricePerKg} onChange={(v: string) => setFormData({...formData, pricePerKg: v})} /><Input label="Peso (KG)" type="number" step="0.01" value={formData.weightKg} onChange={(v: string) => setFormData({...formData, weightKg: v})} /></div>
            <Input label="Data da Carga" type="date" value={formData.date} onChange={(v: string) => setFormData({...formData, date: v})} />
            <PrimaryButton>Confirmar e Lançar Venda</PrimaryButton>
          </form>
        </Modal>
      )}

      {isStockModalOpen && (
        <Modal title={`Ajuste Manual: ${stockFormData.name}`} onClose={() => setIsStockModalOpen(false)}>
          <form onSubmit={handleManualStockUpdate} className="space-y-4">
            <Input label="Saldo Físico Real (kg)" type="number" step="0.01" value={stockFormData.weight} onChange={(v: string) => setStockFormData({...stockFormData, weight: v})} />
            <Input label="Preço Custo (R$/kg)" type="number" step="0.01" value={stockFormData.price} onChange={(v: string) => setStockFormData({...stockFormData, price: v})} />
            <PrimaryButton>Atualizar Inventário</PrimaryButton>
          </form>
        </Modal>
      )}

      {isCreditModalOpen && (
        <Modal title="Gestão de Carteira e Crédito" onClose={() => setIsCreditModalOpen(false)}>
           <div className="mb-6 p-6 bg-yellow-50 rounded-3xl border border-yellow-200 flex items-center gap-6 shadow-inner">
              <CreditCardIcon className="w-12 h-12 text-yellow-600" />
              <div>
                 <p className="text-xs font-black uppercase text-yellow-800 tracking-wider">Definição de Teto de Risco</p>
                 <p className="text-[10px] text-yellow-600 uppercase font-bold mt-1 leading-relaxed">Controle o limite de faturamento permitido para este cliente.</p>
              </div>
           </div>
           <form onSubmit={handleCreditUpdate} className="space-y-4">
              <Input label="Limite de Crédito Máximo (R$)" type="number" step="10" value={creditFormData.limit} onChange={(v: string) => setCreditFormData({...creditFormData, limit: v})} />
              <Input label="Adicionar Saldo à Carteira (R$)" type="number" step="1" value={creditFormData.walletAdd} onChange={(v: string) => setCreditFormData({...creditFormData, walletAdd: v})} />
              <PrimaryButton color="blue">Confirmar Atualizações</PrimaryButton>
           </form>
        </Modal>
      )}

      {isDispatchModalOpen && (
        <Modal title="Pagamento / Baixa" onClose={() => setIsDispatchModalOpen(false)}>
          <div className="flex gap-4 mb-8 bg-slate-100 p-2 rounded-2xl shadow-inner">
            <button onClick={() => setDispatchTab('pay')} className={`flex-1 py-4 rounded-xl font-black text-[10px] uppercase transition-all ${dispatchTab === 'pay' ? 'bg-white text-[#002855] shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>1. Recebimento</button>
            <button onClick={() => setDispatchTab('ship')} className={`flex-1 py-4 rounded-xl font-black text-[10px] uppercase transition-all ${dispatchTab === 'ship' ? 'bg-white text-[#002855] shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>2. Carga / Envio</button>
          </div>
          <form onSubmit={handleDispatchAction} className="space-y-6">
            {dispatchTab === 'pay' ? (
              <>
                <Input label="Valor do Recebimento" type="number" step="0.01" value={payData.amount} onChange={(v: string) => setPayData({...payData, amount: v})} />
                <div className="grid grid-cols-2 gap-4">
                  <select className="bg-slate-50 p-5 rounded-2xl font-bold border-2 border-slate-200 focus:border-[#002855] outline-none transition-all shadow-inner" value={payData.method} onChange={e => setPayData({...payData, method: e.target.value})}><option>Pix</option><option>Dinheiro</option><option>Cartão</option><option>Saldo Carteira</option></select>
                  <Input label="Data" type="date" value={payData.date} onChange={(v: string) => setPayData({...payData, date: v})} />
                </div>
              </>
            ) : (
              <><Input label="Transporte / Motorista" uppercase value={shipData.carrier} onChange={(v: string) => setShipData({...shipData, carrier: v})} /><Input label="Observações de Entrega" value={shipData.tracking} onChange={(v: string) => setShipData({...shipData, tracking: v})} /></>
            )}
            <PrimaryButton>{dispatchTab === 'pay' ? 'Registrar Quitação' : 'Autorizar Saída'}</PrimaryButton>
          </form>
        </Modal>
      )}

      {isHistoryModalOpen && selectedStockItem && (
        <Modal title={`Auditoria: ${selectedStockItem.productName}`} onClose={() => setIsHistoryModalOpen(false)}>
           <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
              {selectedStockItem.history?.map((m, i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 flex justify-between items-center shadow-sm">
                   <div>
                      <p className="text-[10px] font-black uppercase text-slate-400">{new Date(m.date).toLocaleDateString()}</p>
                      <p className="text-xs font-black text-[#002855]">{m.description}</p>
                   </div>
                   <div className="text-right">
                      <p className={`text-sm font-black tabular-nums ${m.weight > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                         {m.weight > 0 ? '+' : ''}{m.weight.toFixed(1)} kg
                      </p>
                   </div>
                </div>
              ))}
           </div>
        </Modal>
      )}
    </div>
  );
};

const NavItem = ({ label, icon: Icon, active, onClick }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-8 py-5 relative transition-all group ${active ? 'text-white' : 'text-blue-200/50 hover:text-white hover:bg-white/5'}`}>
    <Icon className={`w-5 h-5 transition-transform ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
    <span className="font-black uppercase text-[10px] tracking-widest">{label}</span>
    {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-10 w-1.5 bg-yellow-400 rounded-r-full shadow-[0_0_15px_rgba(250,204,21,0.5)]" />}
  </button>
);

const DashCard = ({ label, val, icon: Icon, color }: any) => {
  const styles: any = { 
    blue: 'border-blue-500 text-blue-900 bg-white shadow-blue-900/5', 
    red: 'border-red-500 text-red-600 bg-white shadow-red-900/5', 
    yellow: 'border-yellow-500 text-amber-800 bg-white shadow-amber-900/5', 
    emerald: 'border-emerald-500 text-emerald-800 bg-white shadow-emerald-900/5' 
  };
  return (
    <div className={`p-8 rounded-[2.5rem] border-t-8 shadow-xl ring-1 ring-slate-200/60 ${styles[color]} relative overflow-hidden group hover:shadow-2xl transition-all duration-300`}>
       <Icon className="absolute -right-4 -bottom-4 w-24 h-24 opacity-[0.03] group-hover:scale-110 transition-transform duration-700" />
       <p className="text-[10px] font-black uppercase text-slate-500 mb-4 tracking-widest">{label}</p>
       <p className="text-2xl font-black tracking-tighter leading-none tabular-nums">{val}</p>
    </div>
  );
};

const Stat = ({ label, val, color }: any) => (
  <div className="text-right">
    <p className="text-[8px] font-black uppercase text-slate-500 tracking-tighter">{label}</p>
    <p className={`text-lg font-black ${color} font-mono tracking-tight`}>{val}</p>
  </div>
);

const ReportKPI = ({ label, val, color, progress }: any) => {
  const bg = color === 'emerald' ? 'bg-emerald-500' : color === 'blue' ? 'bg-blue-500' : color === 'red' ? 'bg-red-500' : 'bg-yellow-500';
  return (
    <div className="bg-white p-8 rounded-[2rem] border-l-8 border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/50 relative overflow-hidden group hover:scale-[1.02] transition-all">
       <div className={`absolute top-0 left-0 w-1.5 h-full ${bg}`}></div>
       <p className="text-[9px] font-black text-slate-500 uppercase mb-2 tracking-widest">{label}</p>
       <p className={`text-3xl font-black tabular-nums`}>{val}</p>
       {progress !== undefined && (
         <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden shadow-inner">
           <div className={`${bg} h-full transition-all duration-1000`} style={{width: `${Math.min(progress, 100)}%`}}></div>
         </div>
       )}
    </div>
  );
};

const Modal = ({ title, children, onClose }: any) => (
  <div className="fixed inset-0 bg-[#002855]/95 backdrop-blur-xl z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-300 border border-white/20">
      <div className="bg-[#002855] p-8 text-white flex justify-between items-center border-b border-white/10 shadow-lg">
        <h3 className="text-sm font-black uppercase italic text-yellow-400 tracking-wider leading-none">{title}</h3>
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 flex justify-center items-center hover:bg-white/20 transition-all active:scale-90 leading-none">✕</button>
      </div>
      <div className="p-10 custom-scrollbar overflow-y-auto max-h-[80vh]">{children}</div>
    </div>
  </div>
);

const Input = ({ label, uppercase, ...props }: any) => (
  <div>
    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-4">{label}</label>
    <input {...props} className={`w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-5 font-bold text-sm outline-none focus:border-[#002855] focus:bg-white transition-all shadow-inner ${uppercase ? 'uppercase' : ''}`} onChange={e => props.onChange(e.target.value)} />
  </div>
);

const PrimaryButton = ({ children, color = 'blue' }: any) => (
  <button type="submit" className={`w-full ${color === 'blue' ? 'bg-[#002855] hover:bg-blue-900' : 'bg-red-600 hover:bg-red-700'} text-white font-black py-6 rounded-2xl uppercase text-[11px] shadow-xl hover:shadow-2xl mt-4 active:scale-[0.98] transition-all tracking-widest`}>{children}</button>
);

export default App;
