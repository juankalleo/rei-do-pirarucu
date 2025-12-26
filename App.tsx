
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
  ShoppingIcon,
  PrinterIcon
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
    </div>
  );
};

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Persistência
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('pescados_v25_final');
    if (saved) return JSON.parse(saved);
    return INITIAL_CUSTOMERS;
  });
  
  const [stock, setStock] = useState<StockItem[]>(() => {
    const saved = localStorage.getItem('pescados_estoque_v25');
    if (saved) return JSON.parse(saved);
    return PRODUCT_SUGGESTIONS.map(p => ({ 
      productName: p.toUpperCase().trim(), 
      availableWeight: 0, 
      basePricePerKg: 0, 
      lastUpdate: new Date().toISOString(),
      history: []
    }));
  });

  const [purchases, setPurchases] = useState<PurchaseEntry[]>(() => {
    const saved = localStorage.getItem('pescados_compras_v25');
    if (saved) return JSON.parse(saved);
    return [];
  });

  // Modais
  const [isVendaModalOpen, setIsVendaModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isPartialPaymentModalOpen, setIsPartialPaymentModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  
  // Seleção e Impressão
  const [activeCustomerId, setActiveCustomerId] = useState<string | null>(null);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [selectedStockItem, setSelectedStockItem] = useState<StockItem | null>(null);
  const [orderToPrint, setOrderToPrint] = useState<{customer: Customer, entries: SaleEntry[]} | null>(null);
  const [purchaseToPrint, setPurchaseToPrint] = useState<PurchaseEntry | null>(null);

  // Forms
  const [formData, setFormData] = useState({ productName: '', pricePerKg: '', weightKg: '', date: new Date().toISOString().split('T')[0] });
  const [purchaseFormData, setPurchaseFormData] = useState({ productName: '', weightKg: '', pricePerKg: '', total: '', date: new Date().toISOString().split('T')[0], supplier: '' });
  const [partialPaymentData, setPartialPaymentData] = useState({ amount: '', date: new Date().toISOString().split('T')[0] });
  const [customerForm, setCustomerForm] = useState<Partial<Customer>>({ id: '', name: '', taxId: '', address: '', phone: '' });

  // Persistência em cada mudança
  useEffect(() => localStorage.setItem('pescados_v25_final', JSON.stringify(customers)), [customers]);
  useEffect(() => localStorage.setItem('pescados_estoque_v25', JSON.stringify(stock)), [stock]);
  useEffect(() => localStorage.setItem('pescados_compras_v25', JSON.stringify(purchases)), [purchases]);

  const stats = useMemo(() => {
    let rev = 0, pRec = 0, pPend = 0, kgSold = 0;
    customers.forEach(c => c.entries.forEach(e => {
      rev += e.total;
      kgSold += e.weightKg;
      const paid = e.isPaid ? e.total : (e.paidAmount || 0);
      pRec += paid;
      pPend += (e.total - paid);
    }));
    const cost = purchases.reduce((acc, p) => acc + p.total, 0);
    const stockVal = stock.reduce((acc, s) => acc + (s.availableWeight * (s.basePricePerKg || 0)), 0);
    return { rev, pRec, pPend, kgSold, cost, stockVal };
  }, [customers, purchases, stock]);

  // HANDLERS FUNCIONAIS
  
  const handlePrintOrder = (customer: Customer, entries: SaleEntry[]) => {
    setOrderToPrint({ customer, entries });
    setTimeout(() => { window.print(); setOrderToPrint(null); }, 500);
  };

  const handlePrintPurchase = (purchase: PurchaseEntry) => {
    setPurchaseToPrint(purchase);
    setTimeout(() => { window.print(); setPurchaseToPrint(null); }, 500);
  };

  const handleTogglePayment = (cid: string, eid: string) => {
    setCustomers(prev => prev.map(c => {
      if (c.id !== cid) return c;
      return {
        ...c,
        entries: c.entries.map(e => {
          if (e.id !== eid) return e;
          const isMarkingPaid = !e.isPaid;
          return {
            ...e,
            isPaid: isMarkingPaid,
            paidAmount: isMarkingPaid ? e.total : 0,
            paidAt: isMarkingPaid ? new Date().toISOString() : undefined
          };
        })
      };
    }));
  };

  const handleDispatch = (cid: string, eids: string[]) => {
    const customer = customers.find(c => c.id === cid);
    const entriesToDispatch = customer?.entries.filter(e => eids.includes(e.id));
    const hasUnpaid = entriesToDispatch?.some(e => !e.isPaid && (e.paidAmount || 0) < e.total);

    if (hasUnpaid) {
      if (!window.confirm("Atenção: Existem itens selecionados que NÃO foram pagos integralmente. Deseja despachar mesmo assim?")) return;
    } else {
      if (!window.confirm(`Confirmar Saída/Baixa de ${eids.length} itens para expedição?`)) return;
    }

    setCustomers(prev => prev.map(c => {
      if (c.id !== cid) return c;
      return {
        ...c,
        entries: c.entries.map(e => eids.includes(e.id) ? { ...e, isDispatched: true, dispatchedAt: new Date().toISOString() } : e)
      };
    }));
  };

  const handlePartialPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(partialPaymentData.amount);
    if (!amount || amount <= 0) return;

    setCustomers(prev => prev.map(c => {
      if (c.id !== activeCustomerId) return c;
      return {
        ...c,
        entries: c.entries.map(ent => {
          if (ent.id !== activeEntryId) return ent;
          const newPaid = (ent.paidAmount || 0) + amount;
          const isFull = newPaid >= ent.total;
          return {
            ...ent,
            paidAmount: newPaid,
            isPaid: isFull,
            paidAt: isFull ? partialPaymentData.date : ent.paidAt,
            paymentHistory: [...(ent.paymentHistory || []), { amount, date: partialPaymentData.date }]
          };
        })
      };
    }));
    setIsPartialPaymentModalOpen(false);
    setPartialPaymentData({ amount: '', date: new Date().toISOString().split('T')[0] });
  };

  const handleLaunchSale = (e: React.FormEvent) => {
    e.preventDefault();
    const weight = Number(formData.weightKg);
    const price = Number(formData.pricePerKg);
    const pName = formData.productName.toUpperCase().trim();
    
    // Validar Estoque
    const stockItem = stock.find(s => s.productName === pName);
    if (!stockItem || stockItem.availableWeight < weight) {
      if (!window.confirm(`Estoque insuficiente de ${pName} (${stockItem?.availableWeight || 0}kg disponíveis). Lançar mesmo assim?`)) return;
    }

    const newEntry: SaleEntry = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      productName: pName,
      pricePerKg: price,
      weightKg: weight,
      total: weight * price,
      date: formData.date,
      isPaid: false,
      isDispatched: false
    };

    setCustomers(prev => prev.map(c => c.id === activeCustomerId ? { ...c, entries: [newEntry, ...c.entries] } : c));
    setStock(prev => prev.map(s => s.productName === pName ? { 
      ...s, 
      availableWeight: s.availableWeight - weight,
      history: [{ id: Math.random().toString(36).substr(2,9), type: 'exit', weight: -weight, date: formData.date, description: `Venda p/ ${customers.find(cx => cx.id === activeCustomerId)?.name}` }, ...(s.history || [])]
    } : s));

    setIsVendaModalOpen(false);
    setFormData({ productName: '', pricePerKg: '', weightKg: '', date: new Date().toISOString().split('T')[0] });
    
    // Sugerir impressão imediata
    const targetCustomer = customers.find(c => c.id === activeCustomerId);
    if (targetCustomer) handlePrintOrder(targetCustomer, [newEntry]);
  };

  const handleLaunchPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    const weight = Number(purchaseFormData.weightKg);
    const price = Number(purchaseFormData.pricePerKg);
    const total = Number(purchaseFormData.total) || (weight * price);
    const pName = purchaseFormData.productName.toUpperCase().trim();

    const newPurchase: PurchaseEntry = {
      id: `PUR-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      productName: pName,
      weightKg: weight,
      pricePerKg: price || (total / weight),
      total,
      date: purchaseFormData.date,
      supplier: purchaseFormData.supplier
    };

    setPurchases(prev => [newPurchase, ...prev]);
    setStock(prev => {
      const exists = prev.some(s => s.productName === pName);
      const move = { id: Math.random().toString(36).substr(2,9), type: 'entry' as const, weight, date: purchaseFormData.date, description: `Entrada via Fornecedor: ${purchaseFormData.supplier}` };
      if (exists) return prev.map(s => s.productName === pName ? { ...s, availableWeight: s.availableWeight + weight, basePricePerKg: price, history: [move, ...(s.history || [])] } : s);
      return [...prev, { productName: pName, availableWeight: weight, basePricePerKg: price, lastUpdate: purchaseFormData.date, history: [move] }];
    });

    setIsPurchaseModalOpen(false);
    setPurchaseFormData({ productName: '', weightKg: '', pricePerKg: '', total: '', date: new Date().toISOString().split('T')[0], supplier: '' });
  };

  return (
    <div className="flex min-h-screen text-slate-900 bg-[#f0f4f8] font-['Inter'] relative overflow-hidden">
      {/* SIDEBAR */}
      <aside className={`fixed md:relative inset-y-0 left-0 w-72 bg-[#002855] text-white flex flex-col shadow-2xl z-[70] transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-8 border-b border-white/10"><BrandLogo /></div>
        <nav className="flex-1 mt-6 overflow-y-auto custom-scrollbar">
          <NavItem label="Dashboard" icon={LayoutIcon} active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
          <NavItem label="Estoque Físico" icon={BoxIcon} active={activeView === 'inventory'} onClick={() => setActiveView('inventory')} />
          <NavItem label="Compras / Entradas" icon={ShoppingIcon} active={activeView === 'purchases'} onClick={() => setActiveView('purchases')} />
          <NavItem label="Clientes / Vendas" icon={UsersIcon} active={activeView === 'customers'} onClick={() => setActiveView('customers')} />
          <NavItem label="Auditoria" icon={ChartIcon} active={activeView === 'reports'} onClick={() => setActiveView('reports')} />
        </nav>
        <div className="p-6 bg-black/10">
          <button onClick={() => { setCustomerForm({ name: '' }); setIsCustomerModalOpen(true); }} className="w-full bg-yellow-500 text-[#002855] font-black py-4 rounded-xl uppercase text-[10px] tracking-widest hover:bg-yellow-400 transition-all flex items-center justify-center gap-2 shadow-lg"><PlusIcon className="w-4 h-4" /> Novo Cliente</button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 px-8 flex items-center justify-between border-b border-slate-200 bg-white/90 backdrop-blur-md z-40 print:hidden shrink-0">
          <div className="flex items-center gap-4">
             <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden p-2 text-slate-500"><LayoutIcon className="w-6 h-6" /></button>
             <h2 className="text-xl font-black uppercase text-[#002855] italic tracking-tighter">Sistema Central <span className="text-yellow-500">Logístico</span></h2>
          </div>
          <div className="flex gap-8">
            <StatHeader label="Caixa Realizado" value={formatCurrency(stats.pRec)} color="text-emerald-600" />
            <StatHeader label="Pendência Global" value={formatCurrency(stats.pPend)} color="text-red-600" />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar print:hidden">
          {activeView === 'dashboard' && (
             <div className="max-w-[1400px] mx-auto space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                   <DashCard label="Vendas Totais" value={formatCurrency(stats.rev)} icon={ChartIcon} color="blue" />
                   <DashCard label="Investido em Carga" value={formatCurrency(stats.cost)} icon={ShoppingIcon} color="red" />
                   <DashCard label="Patrimônio em Peixe" value={formatCurrency(stats.stockVal)} icon={BoxIcon} color="yellow" />
                   <DashCard label="Volume Negociado" value={`${stats.kgSold.toFixed(0)} kg`} icon={FishIcon} color="emerald" />
                </div>
                
                <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-200">
                   <h3 className="text-xl font-black uppercase italic mb-8 border-b-2 border-yellow-500 inline-block pb-1">Desempenho por Espécie</h3>
                   <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                      {stock.map(s => (
                        <div key={s.productName} className="p-4 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col items-center">
                           <span className="text-[9px] font-black uppercase text-slate-400 mb-2 text-center">{s.productName}</span>
                           <span className="text-lg font-black text-[#002855]">{s.availableWeight.toFixed(1)}kg</span>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
          )}

          {activeView === 'customers' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {customers.map(c => (
                <CustomerCard 
                  key={c.id} 
                  customer={c} 
                  onAddEntry={(id) => { setActiveCustomerId(id); setIsVendaModalOpen(true); }} 
                  onDeleteEntry={(cid, eid) => {
                    if (!window.confirm("Isso devolverá o peso ao estoque. Confirmar?")) return;
                    const ent = c.entries.find(e => e.id === eid);
                    if (ent) setStock(p => p.map(s => s.productName === ent.productName ? { ...s, availableWeight: s.availableWeight + ent.weightKg } : s));
                    setCustomers(p => p.map(cust => cust.id === cid ? { ...cust, entries: cust.entries.filter(e => e.id !== eid) } : cust));
                  }} 
                  onTogglePayment={handleTogglePayment}
                  onPartialPayment={(cid, eid) => { setActiveCustomerId(cid); setActiveEntryId(eid); setIsPartialPaymentModalOpen(true); }} 
                  onDeleteCustomer={(id) => { if(window.confirm("Excluir cliente?")) setCustomers(p => p.filter(cx => cx.id !== id)); }} 
                  onEditCustomer={(cust) => { setCustomerForm(cust); setIsCustomerModalOpen(true); }}
                  onPrintOrder={(entries) => handlePrintOrder(c, entries)}
                  onDispatch={handleDispatch}
                />
              ))}
            </div>
          )}

          {activeView === 'purchases' && (
            <div className="max-w-[1400px] mx-auto space-y-6">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-2xl font-black italic uppercase">Gestão de Compras <span className="text-slate-400 text-sm font-bold">/ Fornecedores</span></h3>
                 <button onClick={() => setIsPurchaseModalOpen(true)} className="bg-red-600 text-white px-8 py-4 rounded-xl font-black uppercase text-xs shadow-xl hover:bg-red-700 transition-all flex items-center gap-2"><PlusIcon className="w-4 h-4"/> Nova Entrada</button>
              </div>
              <div className="bg-white rounded-[2rem] shadow-sm overflow-hidden border border-slate-200">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b">
                    <tr className="text-[10px] font-black uppercase text-slate-400">
                      <th className="px-8 py-6">ID / Doc</th>
                      <th className="px-8 py-6">Produto</th>
                      <th className="px-8 py-6">Volume</th>
                      <th className="px-8 py-6">Total Pago</th>
                      <th className="px-8 py-6 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {purchases.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50 group transition-colors">
                        <td className="px-8 py-5 text-[11px] font-bold text-slate-400">{p.id}</td>
                        <td className="px-8 py-5">
                           <p className="text-xs font-black uppercase text-[#002855]">{p.productName}</p>
                           <p className="text-[9px] font-bold text-slate-400 uppercase">{p.supplier || 'N/I'}</p>
                        </td>
                        <td className="px-8 py-5 text-xs font-black">{p.weightKg.toFixed(1)} kg</td>
                        <td className="px-8 py-5 text-xs font-black text-red-600">{formatCurrency(p.total)}</td>
                        <td className="px-8 py-5 text-right">
                           <button onClick={() => handlePrintPurchase(p)} className="p-3 bg-slate-100 rounded-xl text-slate-500 hover:bg-[#002855] hover:text-white transition-all"><PrinterIcon className="w-4 h-4"/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeView === 'inventory' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {stock.map(item => (
                  <div key={item.productName} onClick={() => { setSelectedStockItem(item); setIsAuditModalOpen(true); }} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 hover:border-blue-500 cursor-pointer transition-all flex flex-col justify-between h-64 group relative">
                    <div className="absolute top-4 right-4 text-[8px] font-black uppercase text-slate-300">Confira Balanço</div>
                    <div>
                      <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">{item.productName}</h4>
                      <p className="text-4xl font-black text-[#002855] tracking-tighter">{item.availableWeight.toFixed(1)}<span className="text-sm ml-1">kg</span></p>
                    </div>
                    <div className="pt-4 border-t border-slate-50">
                       <p className="text-[10px] font-bold text-emerald-600 uppercase">Vlr. em Mãos: {formatCurrency(item.availableWeight * (item.basePricePerKg || 0))}</p>
                    </div>
                  </div>
                ))}
             </div>
          )}
        </div>

        {/* PRINT LAYER: PEDIDO DE VENDA */}
        {orderToPrint && (
           <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-12 text-black font-mono text-[12px]">
              <div className="flex justify-between items-start border-b-4 border-black pb-6 mb-8">
                 <div>
                    <h1 className="text-4xl font-black uppercase italic leading-none">REI DO PIRARUCU</h1>
                    <p className="text-[10px] uppercase font-black tracking-widest mt-2">Logística e Distribuição de Pescados Selvagens</p>
                 </div>
                 <div className="text-right">
                    <h2 className="text-xl font-black uppercase">Pedido de Venda / Carga</h2>
                    <p className="font-bold">Emissão: {new Date().toLocaleDateString('pt-BR')}</p>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-10 mb-10 border border-black p-6 rounded-3xl">
                 <div>
                    <p className="font-black uppercase text-[10px] border-b border-black mb-2">Cliente / Destino</p>
                    <p className="text-xl font-black uppercase">{orderToPrint.customer.name}</p>
                    <p className="mt-2">{orderToPrint.customer.phone || 'S/ Telefone'}</p>
                    <p>{orderToPrint.customer.address || 'Endereço não informado'}</p>
                 </div>
                 <div className="text-right">
                    <p className="font-black uppercase text-[10px] border-b border-black mb-2">Resumo de Carga</p>
                    <p className="text-lg">Itens Totais: {orderToPrint.entries.length}</p>
                    <p className="text-2xl font-black mt-2">PESO: {orderToPrint.entries.reduce((a, b) => a + b.weightKg, 0).toFixed(1)} KG</p>
                 </div>
              </div>

              <table className="w-full border-collapse mb-10">
                 <thead>
                    <tr className="bg-black text-white uppercase text-[10px]">
                       <th className="p-4 text-left">Ref</th>
                       <th className="p-4 text-left">Produto</th>
                       <th className="p-4 text-right">Peso (kg)</th>
                       <th className="p-4 text-right">Preço</th>
                       <th className="p-4 text-right">Total</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-black/20">
                    {orderToPrint.entries.map((e, i) => (
                      <tr key={e.id}>
                        <td className="p-4">{i+1}</td>
                        <td className="p-4 font-black uppercase">{e.productName}</td>
                        <td className="p-4 text-right font-black">{e.weightKg.toFixed(1)}</td>
                        <td className="p-4 text-right">{formatCurrency(e.pricePerKg)}</td>
                        <td className="p-4 text-right font-black">{formatCurrency(e.total)}</td>
                      </tr>
                    ))}
                 </tbody>
                 <tfoot>
                    <tr className="border-t-4 border-black bg-slate-100">
                       <td colSpan={2} className="p-6 font-black text-lg">TOTAL DO PEDIDO:</td>
                       <td className="p-6 text-right font-black text-lg">{orderToPrint.entries.reduce((a,b) => a+b.weightKg, 0).toFixed(1)} kg</td>
                       <td></td>
                       <td className="p-6 text-right font-black text-lg">{formatCurrency(orderToPrint.entries.reduce((a,b) => a+b.total, 0))}</td>
                    </tr>
                 </tfoot>
              </table>

              <div className="mt-32 grid grid-cols-2 gap-32">
                 <div className="border-t-2 border-black text-center pt-4">
                    <p className="text-[10px] font-black uppercase">Recebido em conformidade</p>
                    <p className="mt-1">Pelo Cliente</p>
                 </div>
                 <div className="border-t-2 border-black text-center pt-4">
                    <p className="text-[10px] font-black uppercase">Expedição Autorizada</p>
                    <p className="mt-1">Gerente de Carga</p>
                 </div>
              </div>
           </div>
        )}

        {/* PRINT LAYER: ORDEM DE COMPRA (FORNECEDOR) */}
        {purchaseToPrint && (
           <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-12 text-black font-mono text-[12px]">
              <div className="border-b-4 border-red-600 pb-6 mb-8 flex justify-between">
                 <h1 className="text-3xl font-black text-red-600 uppercase italic">ORDEM DE COMPRA</h1>
                 <p className="text-xl font-bold">{purchaseToPrint.id}</p>
              </div>
              <div className="mb-10 space-y-2">
                 <p><strong>Fornecedor:</strong> {purchaseToPrint.supplier || 'NÃO INFORMADO'}</p>
                 <p><strong>Data de Entrada:</strong> {new Date(purchaseToPrint.date).toLocaleDateString('pt-BR')}</p>
                 <p><strong>Destino:</strong> REI DO PIRARUCU - DEPÓSITO CENTRAL</p>
              </div>
              <div className="border-2 border-black p-8 rounded-3xl mb-8">
                 <p className="text-lg font-black uppercase mb-4">Discriminação de Mercadoria</p>
                 <div className="flex justify-between text-xl border-b pb-2 mb-2">
                    <span>{purchaseToPrint.productName}</span>
                    <span className="font-black">{purchaseToPrint.weightKg.toFixed(1)} KG</span>
                 </div>
                 <div className="flex justify-between text-lg">
                    <span>Preço de Custo Acordado:</span>
                    <span>{formatCurrency(purchaseToPrint.pricePerKg)} /kg</span>
                 </div>
                 <div className="flex justify-between text-3xl font-black mt-10 text-red-600 pt-4 border-t-4 border-red-600">
                    <span>VALOR TOTAL DA COMPRA:</span>
                    <span>{formatCurrency(purchaseToPrint.total)}</span>
                 </div>
              </div>
           </div>
        )}
      </main>

      {/* MODAIS */}
      {isVendaModalOpen && (
        <Modal title="Lançar Nova Venda" onClose={() => setIsVendaModalOpen(false)}>
          <form onSubmit={handleLaunchSale} className="space-y-6">
            <Input label="Espécie de Peixe" list="plist" uppercase value={formData.productName} onChange={v => setFormData({...formData, productName: v})} />
            <datalist id="plist">{stock.map(s => <option key={s.productName} value={s.productName} />)}</datalist>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Preço (R$/kg)" type="number" step="0.01" value={formData.pricePerKg} onChange={v => setFormData({...formData, pricePerKg: v})} />
              <Input label="Peso (kg)" type="number" step="0.01" value={formData.weightKg} onChange={v => setFormData({...formData, weightKg: v})} />
            </div>
            <Input label="Data" type="date" value={formData.date} onChange={v => setFormData({...formData, date: v})} />
            <PrimaryButton>Registrar Venda e Pedido</PrimaryButton>
          </form>
        </Modal>
      )}

      {isPurchaseModalOpen && (
        <Modal title="Nova Entrada (Compra)" onClose={() => setIsPurchaseModalOpen(false)}>
          <form onSubmit={handleLaunchPurchase} className="space-y-6">
            <Input label="Produto / Espécie" list="plist" uppercase value={purchaseFormData.productName} onChange={v => setPurchaseFormData({...purchaseFormData, productName: v})} />
            <Input label="Fornecedor / Origem" uppercase value={purchaseFormData.supplier} onChange={v => setPurchaseFormData({...purchaseFormData, supplier: v})} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Peso (kg)" type="number" step="0.01" value={purchaseFormData.weightKg} onChange={v => setPurchaseFormData({...purchaseFormData, weightKg: v})} />
              <Input label="Custo /kg" type="number" step="0.01" value={purchaseFormData.pricePerKg} onChange={v => setPurchaseFormData({...purchaseFormData, pricePerKg: v})} />
            </div>
            <Input label="Total (Opcional)" type="number" step="0.01" value={purchaseFormData.total} onChange={v => setPurchaseFormData({...purchaseFormData, total: v})} />
            <PrimaryButton color="red">Confirmar Compra e Entrada</PrimaryButton>
          </form>
        </Modal>
      )}

      {isPartialPaymentModalOpen && (activeCustomerId && activeEntryId) && (
        <Modal title="Baixa Parcial / Recebimento" onClose={() => setIsPartialPaymentModalOpen(false)}>
          <form onSubmit={handlePartialPayment} className="space-y-6">
            <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 text-center mb-4">
               <p className="text-[10px] font-black uppercase text-emerald-600 mb-1">Valor do Recebimento</p>
               <p className="text-3xl font-black text-emerald-700 font-mono">{partialPaymentData.amount ? formatCurrency(Number(partialPaymentData.amount)) : 'R$ 0,00'}</p>
            </div>
            <Input label="Valor Pago (R$)" type="number" step="0.01" value={partialPaymentData.amount} onChange={v => setPartialPaymentData({...partialPaymentData, amount: v})} />
            <Input label="Data" type="date" value={partialPaymentData.date} onChange={v => setPartialPaymentData({...partialPaymentData, date: v})} />
            <PrimaryButton>Registrar Baixa</PrimaryButton>
          </form>
        </Modal>
      )}
    </div>
  );
};

// COMPONENTES AUXILIARES
const NavItem = ({ label, icon: Icon, active, onClick }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-8 py-5 transition-all relative ${active ? 'text-white' : 'text-blue-200/50 hover:text-white'}`}>
    <Icon className={`w-5 h-5 ${active ? 'scale-110' : ''}`} />
    <span className="font-black uppercase text-[10px] tracking-widest">{label}</span>
    {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-10 w-1.5 bg-yellow-400 rounded-r-full shadow-[0_0_15px_rgba(250,204,21,0.5)]" />}
  </button>
);

const StatHeader = ({ label, value, color }: any) => (
  <div className="text-right">
     <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">{label}</p>
     <p className={`text-xl font-black ${color} font-mono`}>{value}</p>
  </div>
);

const DashCard = ({ label, value, icon: Icon, color }: any) => {
  const styles: any = { 
    blue: 'border-blue-500 text-blue-900 bg-blue-50/20', 
    red: 'border-red-500 text-red-600 bg-red-50/20', 
    yellow: 'border-yellow-500 text-amber-700 bg-amber-50/20', 
    emerald: 'border-emerald-500 text-emerald-700 bg-emerald-50/20' 
  };
  return (
    <div className={`p-8 rounded-[2.5rem] border-t-8 shadow-sm ring-1 ring-slate-200 ${styles[color]} relative overflow-hidden group hover:shadow-xl transition-all`}>
       <Icon className="absolute -right-4 -bottom-4 w-24 h-24 opacity-[0.05] group-hover:scale-110 transition-transform" />
       <p className="text-[10px] font-black uppercase opacity-60 mb-4">{label}</p>
       <p className="text-2xl font-black tracking-tighter leading-none">{value}</p>
    </div>
  );
};

const Modal = ({ title, children, onClose }: any) => (
  <div className="fixed inset-0 bg-[#002855]/90 backdrop-blur-xl z-[150] flex items-center justify-center p-4">
    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-300">
      <div className="bg-[#002855] p-8 text-white flex justify-between items-center">
         <h3 className="text-base font-black uppercase italic text-yellow-400">{title}</h3>
         <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-red-500 transition-colors">✕</button>
      </div>
      <div className="p-10">{children}</div>
    </div>
  </div>
);

const Input = ({ label, uppercase, ...props }: any) => (
  <div>
    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-4">{label}</label>
    <input {...props} className={`w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-5 font-bold text-sm outline-none focus:border-[#002855] focus:bg-white transition-all ${uppercase ? 'uppercase' : ''}`} onChange={e => props.onChange(e.target.value)} />
  </div>
);

const PrimaryButton = ({ children, color = 'blue' }: any) => {
  const colors: any = { blue: 'bg-[#002855] hover:bg-blue-900', red: 'bg-red-600 hover:bg-red-700' };
  return <button type="submit" className={`w-full ${colors[color]} text-white font-black py-6 rounded-2xl uppercase text-[11px] shadow-lg active:scale-95 transition-all mt-4`}>{children}</button>;
};

export default App;
