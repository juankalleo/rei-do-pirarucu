
import React, { useState, useEffect, useMemo } from 'react';
import { Customer, SaleEntry, StockItem, ViewType, PurchaseEntry } from './types';
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
  
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('pirarucu_customers_v6');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });
  
  const [stock, setStock] = useState<StockItem[]>(() => {
    const saved = localStorage.getItem('pirarucu_stock_v6');
    return saved ? JSON.parse(saved) : PRODUCT_SUGGESTIONS.map(p => ({ 
      productName: p.toUpperCase().trim(), availableWeight: 0, basePricePerKg: 0, lastUpdate: new Date().toISOString(), history: []
    }));
  });

  const [purchases, setPurchases] = useState<PurchaseEntry[]>(() => {
    const saved = localStorage.getItem('pirarucu_purchases_v6');
    return saved ? JSON.parse(saved) : [];
  });

  // Itens de Serviço (Não aparecem no estoque físico)
  const SERVICE_ITEMS = ['FRETE', 'CAIXA', 'DEPOSITO'];

  // Modais
  const [isVendaModalOpen, setIsVendaModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);

  // Estados de formulários e seleções
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

  // Persistência
  useEffect(() => localStorage.setItem('pirarucu_customers_v6', JSON.stringify(customers)), [customers]);
  useEffect(() => localStorage.setItem('pirarucu_stock_v6', JSON.stringify(stock)), [stock]);
  useEffect(() => localStorage.setItem('pirarucu_purchases_v6', JSON.stringify(purchases)), [purchases]);

  const stats = useMemo(() => {
    let rev = 0, rec = 0, pend = 0, kg = 0, saleCount = 0, totalExposure = 0;
    const customerRanking: Record<string, { name: string, total: number, sales: number }> = {};
    const productRanking: Record<string, { weight: number, revenue: number, transactions: number }> = {};

    customers.forEach(c => {
      totalExposure += (c.creditLimit || 0);
      customerRanking[c.id] = { name: c.name, total: 0, sales: 0 };
      c.entries.forEach(e => {
        rev += e.total;
        if (!SERVICE_ITEMS.includes(e.productName)) kg += e.weightKg;
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
    const efficiency = rev > 0 ? (rec / rev) * 100 : 0;
    const ticketMedio = saleCount > 0 ? rev / saleCount : 0;

    return { 
      rev, rec, pend, kg, costs, efficiency, ticketMedio, totalExposure,
      topPerformanceCustomers: Object.values(customerRanking).sort((a, b) => b.total - a.total).slice(0, 8),
      mostProfitableProducts: Object.entries(productRanking).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 5),
      monthlyData: Array.from({ length: 6 }).map((_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthKey = d.toISOString().substring(0, 7);
        const mRev = customers.reduce((acc, c) => acc + c.entries.filter(e => e.date.startsWith(monthKey)).reduce((sum, e) => sum + e.total, 0), 0);
        const mCosts = purchases.filter(p => p.date.startsWith(monthKey)).reduce((sum, p) => sum + p.total, 0);
        return { month: monthKey, revenue: mRev, costs: mCosts };
      }).reverse()
    };
  }, [customers, purchases, stock]);

  // Handlers
  const handleLaunchSale = (e: React.FormEvent) => {
    e.preventDefault();
    const weight = Number(formData.weightKg);
    const pName = formData.productName.toUpperCase().trim();
    const customer = customers.find(c => c.id === activeCustomerId);
    const totalVenda = weight * Number(formData.pricePerKg);

    if (!customer || !pName || weight <= 0) return;

    if (!SERVICE_ITEMS.includes(pName)) {
      setStock(prev => prev.map(s => s.productName === pName ? { 
        ...s, 
        availableWeight: s.availableWeight - weight,
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

    if (!SERVICE_ITEMS.includes(pName)) {
      setStock(prev => {
        const existing = prev.find(s => s.productName === pName);
        if (existing) {
          return prev.map(s => s.productName === pName ? {
            ...s,
            availableWeight: s.availableWeight + weight,
            basePricePerKg: price || s.basePricePerKg,
            history: [{ id: Date.now().toString(), type: 'entry', weight, date: purchaseFormData.date, description: `Compra: ${purchaseFormData.supplier || 'Fornecedor'}` }, ...(s.history || [])]
          } : s);
        } else {
          return [...prev, {
            productName: pName,
            availableWeight: weight,
            basePricePerKg: price,
            lastUpdate: new Date().toISOString(),
            history: [{ id: Date.now().toString(), type: 'entry', weight, date: purchaseFormData.date, description: `Compra Inicial` }]
          }];
        }
      });
    }
    setIsPurchaseModalOpen(false);
    setPurchaseFormData({ productName: '', weightKg: '', pricePerKg: '', total: '', date: new Date().toISOString().split('T')[0], supplier: '' });
  };

  const handleCreditUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomers(prev => prev.map(c => c.id === activeCustomerId ? { ...c, creditLimit: Number(creditFormData.limit), walletBalance: (c.walletBalance || 0) + Number(creditFormData.walletAdd) } : c));
    setIsCreditModalOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-[#f1f5f9] font-['Inter']">
      {/* SIDEBAR */}
      <aside className={`fixed md:relative inset-y-0 left-0 w-72 bg-[#002855] text-white flex flex-col shadow-2xl z-50 transition-transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-8 border-b border-white/10"><BrandLogo /></div>
        <nav className="flex-1 mt-6 overflow-y-auto custom-scrollbar">
          <NavItem label="Dashboard" icon={LayoutIcon} active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
          <NavItem label="Estoque Físico" icon={BoxIcon} active={activeView === 'inventory'} onClick={() => setActiveView('inventory')} />
          <NavItem label="Compras" icon={ShoppingIcon} active={activeView === 'purchases'} onClick={() => setActiveView('purchases')} />
          <NavItem label="Clientes" icon={UsersIcon} active={activeView === 'customers'} onClick={() => setActiveView('customers')} />
          <NavItem label="BI & Relatórios" icon={ChartIcon} active={activeView === 'reports'} onClick={() => setActiveView('reports')} />
        </nav>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* HEADER */}
        <header className="h-20 px-8 flex items-center justify-between border-b bg-white/95 backdrop-blur-md z-40 print:hidden">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden p-2"><LayoutIcon className="w-6 h-6 text-[#002855]"/></button>
          <div className="flex gap-8">
            <Stat label="Recebido" val={formatCurrency(stats.rec)} color="text-emerald-600" />
            <Stat label="Pendente" val={formatCurrency(stats.pend)} color="text-red-600" />
          </div>
        </header>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar print:hidden">
          {activeView === 'dashboard' && (
             <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in duration-500">
                <DashCard label="Vendas Totais" val={formatCurrency(stats.rev)} icon={ChartIcon} color="blue" />
                <DashCard label="Custos" val={formatCurrency(stats.costs)} icon={ShoppingIcon} color="red" />
                <DashCard label="Margem" val={formatCurrency(stats.rev - stats.costs)} icon={FishIcon} color="emerald" />
                <DashCard label="Risco" val={formatCurrency(stats.totalExposure)} icon={CreditCardIcon} color="yellow" />
             </div>
          )}

          {activeView === 'inventory' && (
            <div className="max-w-6xl mx-auto space-y-6">
               <div className="flex justify-between items-center">
                 <h3 className="text-2xl font-black text-[#002855] italic">Estoque Físico</h3>
                 <button onClick={() => setIsNewProductModalOpen(true)} className="bg-[#002855] text-white px-6 py-3 rounded-2xl font-black text-xs flex items-center gap-2 shadow-lg"><PlusIcon className="w-4 h-4" /> NOVO PRODUTO</button>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {stock.filter(i => !SERVICE_ITEMS.includes(i.productName)).map(item => (
                   <div key={item.productName} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col justify-between h-48 group hover:shadow-xl transition-all">
                      <div className="flex justify-between">
                         <h4 className="text-xs font-black uppercase text-slate-400">{item.productName}</h4>
                         <button onClick={() => { setStockFormData({ name: item.productName, weight: item.availableWeight.toString(), price: item.basePricePerKg.toString() }); setIsStockModalOpen(true); }} className="opacity-0 group-hover:opacity-100 transition-opacity"><EditIcon className="w-4 h-4"/></button>
                      </div>
                      <p className="text-4xl font-black">{item.availableWeight.toFixed(1)}kg</p>
                      <button onClick={() => { setSelectedStockItem(item); setIsHistoryModalOpen(true); }} className="text-[10px] font-bold text-slate-400 uppercase text-center border-t pt-4">Histórico</button>
                   </div>
                 ))}
               </div>
            </div>
          )}

          {activeView === 'customers' && (
            <div className="max-w-[1400px] mx-auto space-y-6">
               <div className="flex justify-between items-center">
                 <h3 className="text-2xl font-black text-[#002855] italic">Gestão de Carteira</h3>
                 <button onClick={() => setIsCustomerModalOpen(true)} className="bg-[#002855] text-white px-6 py-3 rounded-2xl font-black text-xs flex items-center gap-2 shadow-lg"><PlusIcon className="w-4 h-4" /> ADICIONAR CLIENTE</button>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                 {customers.map(c => (
                   <CustomerCard 
                     key={c.id} customer={c} 
                     onAddEntry={(id) => { setActiveCustomerId(id); setIsVendaModalOpen(true); }}
                     onDeleteCustomer={(id) => setCustomers(prev => prev.filter(x => x.id !== id))}
                     onDeleteEntry={(cid, eid) => setCustomers(prev => prev.map(cust => cust.id === cid ? { ...cust, entries: cust.entries.filter(e => e.id !== eid) } : cust))}
                     onTogglePayment={(cid, eid) => setCustomers(prev => prev.map(cust => cust.id === cid ? { ...cust, entries: cust.entries.map(e => e.id === eid ? { ...e, isPaid: !e.isPaid } : e) } : cust))}
                     onPartialPayment={() => setIsDispatchModalOpen(true)}
                     onPrintOrder={(ents) => { setOrderToPrint({ customer: c, entries: ents }); setTimeout(() => window.print(), 500); }}
                     onDispatch={() => setIsDispatchModalOpen(true)}
                     onManageCredit={(id) => { setActiveCustomerId(id); setIsCreditModalOpen(true); }}
                   />
                 ))}
               </div>
            </div>
          )}

          {activeView === 'purchases' && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex justify-between items-center">
                 <h3 className="text-2xl font-black text-[#002855] italic">Histórico de Compras</h3>
                 <button onClick={() => setIsPurchaseModalOpen(true)} className="bg-red-600 text-white px-6 py-3 rounded-2xl font-black text-xs flex items-center gap-2 shadow-lg"><PlusIcon className="w-4 h-4" /> REGISTRAR COMPRA</button>
              </div>
              <div className="bg-white rounded-[2rem] border overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-[10px] uppercase font-black">
                    <tr><th className="p-4">Data</th><th className="p-4">Produto</th><th className="p-4">Peso</th><th className="p-4">Total</th></tr>
                  </thead>
                  <tbody>
                    {purchases.map(p => (
                      <tr key={p.id} className="border-t">
                        <td className="p-4">{new Date(p.date).toLocaleDateString()}</td>
                        <td className="p-4 font-black">{p.productName}</td>
                        <td className="p-4">{p.weightKg}kg</td>
                        <td className="p-4 text-red-600 font-bold">{formatCurrency(p.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* MODALS */}
        {isCustomerModalOpen && (
          <Modal title="Cadastrar Cliente" onClose={() => setIsCustomerModalOpen(false)}>
            <form onSubmit={handleAddCustomer} className="space-y-4">
              <Input label="Nome" uppercase required value={customerFormData.name} onChange={(v: string) => setCustomerFormData({...customerFormData, name: v})} />
              <Input label="CPF/CNPJ" value={customerFormData.taxId} onChange={(v: string) => setCustomerFormData({...customerFormData, taxId: v})} />
              <PrimaryButton>Cadastrar</PrimaryButton>
            </form>
          </Modal>
        )}

        {isNewProductModalOpen && (
          <Modal title="Novo Produto" onClose={() => setIsNewProductModalOpen(false)}>
            <form onSubmit={handleAddNewProduct} className="space-y-4">
              <Input label="Espécie" uppercase required value={newProductFormData.name} onChange={(v: string) => setNewProductFormData({...newProductFormData, name: v})} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Peso Inicial" type="number" value={newProductFormData.weight} onChange={(v: string) => setNewProductFormData({...newProductFormData, weight: v})} />
                <Input label="Preço Custo" type="number" value={newProductFormData.price} onChange={(v: string) => setNewProductFormData({...newProductFormData, price: v})} />
              </div>
              <PrimaryButton>Salvar</PrimaryButton>
            </form>
          </Modal>
        )}

        {isVendaModalOpen && (
          <Modal title="Lançar Venda" onClose={() => setIsVendaModalOpen(false)}>
            <form onSubmit={handleLaunchSale} className="space-y-4">
              <Input label="Produto" list="plist" uppercase value={formData.productName} onChange={(v: string) => setFormData({...formData, productName: v})} />
              <datalist id="plist">{stock.map(s => <option key={s.productName} value={s.productName} />)}</datalist>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Peso (KG)" type="number" step="0.01" value={formData.weightKg} onChange={(v: string) => setFormData({...formData, weightKg: v})} />
                <Input label="Preço/KG" type="number" step="0.01" value={formData.pricePerKg} onChange={(v: string) => setFormData({...formData, pricePerKg: v})} />
              </div>
              <PrimaryButton>Confirmar Venda</PrimaryButton>
            </form>
          </Modal>
        )}

        {/* VIEW IMPRESSÃO */}
        {orderToPrint && (
          <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-10 text-black">
             <div className="border-4 border-[#002855] p-8 rounded-3xl">
                <h1 className="text-4xl font-black italic uppercase text-[#002855] border-b-4 pb-4">REI DO <span className="text-yellow-500">PIRARUCU</span></h1>
                <div className="mt-8 flex justify-between">
                   <div>
                      <p className="text-[10px] font-black uppercase text-slate-400">Cliente</p>
                      <p className="text-2xl font-black">{orderToPrint.customer.name}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-black uppercase text-slate-400">Data</p>
                      <p className="text-lg font-bold">{new Date().toLocaleDateString()}</p>
                   </div>
                </div>
                <table className="w-full mt-10 text-left border-collapse">
                   <thead>
                      <tr className="bg-[#002855] text-white uppercase text-[10px]"><th className="p-4">Produto</th><th className="p-4">Qtd (kg)</th><th className="p-4">Preço/kg</th><th className="p-4 text-right">Total</th></tr>
                   </thead>
                   <tbody className="divide-y">
                      {orderToPrint.entries.map(e => (
                         <tr key={e.id} className="font-bold">
                            <td className="p-4 uppercase">{e.productName}</td>
                            <td className="p-4">{e.weightKg}</td>
                            <td className="p-4">{formatCurrency(e.pricePerKg)}</td>
                            <td className="p-4 text-right">{formatCurrency(e.total)}</td>
                         </tr>
                      ))}
                   </tbody>
                   <tfoot>
                      <tr className="bg-slate-100"><td colSpan={3} className="p-4 text-right font-black">TOTAL DO PEDIDO</td><td className="p-4 text-right text-2xl font-black">{formatCurrency(orderToPrint.entries.reduce((a, b) => a + b.total, 0))}</td></tr>
                   </tfoot>
                </table>
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

// UI Components Internos
const NavItem = ({ label, icon: Icon, active, onClick }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-8 py-5 relative transition-all ${active ? 'text-white' : 'text-blue-200/50 hover:text-white'}`}>
    <Icon className="w-5 h-5" />
    <span className="font-black uppercase text-[10px] tracking-widest">{label}</span>
    {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-10 w-1.5 bg-yellow-400 rounded-r-full" />}
  </button>
);

const Stat = ({ label, val, color }: any) => (
  <div className="text-right">
    <p className="text-[8px] font-black uppercase text-slate-500">{label}</p>
    <p className={`text-lg font-black ${color}`}>{val}</p>
  </div>
);

const DashCard = ({ label, val, color }: any) => (
  <div className={`p-8 rounded-[2rem] border-t-8 bg-white shadow-sm border-${color}-500`}>
    <p className="text-[10px] font-black uppercase text-slate-400 mb-2">{label}</p>
    <p className="text-2xl font-black">{val}</p>
  </div>
);

const Modal = ({ title, children, onClose }: any) => (
  <div className="fixed inset-0 bg-[#002855]/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-300">
      <div className="bg-[#002855] p-6 text-white flex justify-between items-center">
        <h3 className="text-xs font-black uppercase text-yellow-400">{title}</h3>
        <button onClick={onClose}>✕</button>
      </div>
      <div className="p-8">{children}</div>
    </div>
  </div>
);

const Input = ({ label, uppercase, ...props }: any) => (
  <div>
    <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 ml-2">{label}</label>
    <input {...props} className={`w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 font-bold outline-none focus:border-[#002855] ${uppercase ? 'uppercase' : ''}`} onChange={e => props.onChange(e.target.value)} />
  </div>
);

const PrimaryButton = ({ children }: any) => (
  <button type="submit" className="w-full bg-[#002855] text-white font-black py-4 rounded-2xl uppercase text-xs shadow-xl mt-4 active:scale-95 transition-all">
    {children}
  </button>
);

export default App;
