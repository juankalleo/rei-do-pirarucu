
import React, { useState, useEffect, useMemo } from 'react';
import { Customer, SaleEntry, StockItem, ViewType } from './types';
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
  EditIcon
} from './components/Icons';
import CustomerCard from './components/CustomerCard';

// Helper functions for export
const exportToCSV = (filename: string, rows: string[][]) => {
  const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(";")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const formatCurrency = (val: number) => 
  val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Gráfico de Colunas (Barras) Moderno por Mês
const MonthlyBarChart = ({ data }: { data: { month: string, paid: number, pending: number }[] }) => {
  if (data.length === 0) return (
    <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-2">
      <ChartIcon className="w-8 h-8 opacity-20" />
      <span className="text-[10px] font-black uppercase tracking-widest">Aguardando dados históricos</span>
    </div>
  );

  const width = 1000;
  const height = 400;
  const padding = 60;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const maxVal = Math.max(...data.map(d => Math.max(d.paid, d.pending))) * 1.2 || 1000;
  
  const barGap = 15;
  const groupWidth = chartWidth / data.length;
  const barWidth = Math.min((groupWidth - barGap * 3) / 2, 40);

  return (
    <div className="w-full h-full relative overflow-x-auto custom-scrollbar">
      <div className="min-w-[800px] h-full">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          {/* Grades horizontais com valores */}
          {[0, 0.25, 0.5, 0.75, 1].map(v => {
            const y = padding + (1 - v) * chartHeight;
            const value = v * maxVal;
            return (
              <g key={v}>
                <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#f1f5f9" strokeWidth="1" />
                <text x={padding - 10} y={y + 4} textAnchor="end" className="text-[10px] fill-slate-400 font-bold">
                  {v === 0 ? "R$ 0" : `R$ ${(value/1000).toFixed(1)}k`}
                </text>
              </g>
            );
          })}

          {/* Barras */}
          {data.map((d, i) => {
            const xGroupCenter = padding + i * groupWidth + groupWidth / 2;
            const hPaid = (d.paid / maxVal) * chartHeight;
            const hPending = (d.pending / maxVal) * chartHeight;

            return (
              <g key={d.month} className="group/bar">
                {/* Barra Pago */}
                <rect 
                  x={xGroupCenter - barWidth - 5} 
                  y={height - padding - hPaid} 
                  width={barWidth} 
                  height={hPaid} 
                  fill="#10b981" 
                  rx="6"
                  className="transition-all duration-500 hover:brightness-110"
                />
                {/* Barra Pendente */}
                <rect 
                  x={xGroupCenter + 5} 
                  y={height - padding - hPending} 
                  width={barWidth} 
                  height={hPending} 
                  fill="#f59e0b" 
                  rx="6"
                  className="transition-all duration-500 hover:brightness-110"
                />
                
                {/* Labels de data */}
                <text 
                  x={xGroupCenter} 
                  y={height - padding + 25} 
                  textAnchor="middle" 
                  className="text-[11px] font-black fill-slate-500 uppercase"
                >
                  {d.month}
                </text>
                <title>{`${d.month}\nPago: ${formatCurrency(d.paid)}\nPendente: ${formatCurrency(d.pending)}`}</title>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('pescados_vendas_data_v11');
    if (saved) return JSON.parse(saved);
    return INITIAL_CUSTOMERS.map(c => ({ ...c, priceList: c.priceList || {} }));
  });

  const [stock, setStock] = useState<StockItem[]>(() => {
    const saved = localStorage.getItem('pescados_estoque_data_v11');
    if (saved) return JSON.parse(saved);
    return PRODUCT_SUGGESTIONS.map(p => ({
      productName: p.toUpperCase().trim(),
      availableWeight: 0,
      lastUpdate: new Date().toISOString()
    }));
  });

  const [isVendaModalOpen, setIsVendaModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isEditStockModalOpen, setIsEditStockModalOpen] = useState(false);
  const [activeCustomerId, setActiveCustomerId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    productName: '', pricePerKg: '', weightKg: '', date: new Date().toISOString().split('T')[0], isPaid: false
  });

  const [stockFormData, setStockFormData] = useState({ productName: '', weightToAdd: '' });
  const [editStockFormData, setEditStockFormData] = useState({ oldName: '', newName: '', weight: '' });
  const [customerForm, setCustomerForm] = useState<Partial<Customer>>({ name: '', taxId: '', address: '', contactPerson: '', phone: '', priceList: {} });
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);

  useEffect(() => localStorage.setItem('pescados_vendas_data_v11', JSON.stringify(customers)), [customers]);
  useEffect(() => localStorage.setItem('pescados_estoque_data_v11', JSON.stringify(stock)), [stock]);

  useEffect(() => {
    if (isVendaModalOpen && activeCustomerId && formData.productName) {
      const customer = customers.find(c => c.id === activeCustomerId);
      const prodName = formData.productName.toUpperCase().trim();
      if (customer?.priceList?.[prodName]) {
        setFormData(prev => ({ ...prev, pricePerKg: customer.priceList[prodName].toString() }));
      }
    }
  }, [formData.productName, activeCustomerId, isVendaModalOpen, customers]);

  const stats = useMemo(() => {
    let total = 0, weight = 0, paid = 0, pending = 0;
    customers.forEach(c => c.entries.forEach(e => {
      total += Number(e.total);
      weight += Number(e.weightKg);
      if (e.isPaid) paid += Number(e.total); else pending += Number(e.total);
    }));
    const inStock = stock.reduce((acc, item) => acc + Number(item.availableWeight), 0);
    return { totalRevenue: total, totalWeight: weight, totalPaid: paid, totalPending: pending, totalInStock: inStock, customerCount: customers.length };
  }, [customers, stock]);

  const timelineMonthlyData = useMemo(() => {
    const monthly: Record<string, { paid: number, pending: number }> = {};
    customers.forEach(c => c.entries.forEach(e => {
      const date = new Date(e.date);
      const monthKey = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).toUpperCase();
      const sortKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const key = `${sortKey}|${monthKey}`;
      if (!monthly[key]) monthly[key] = { paid: 0, pending: 0 };
      if (e.isPaid) monthly[key].paid += Number(e.total); else monthly[key].pending += Number(e.total);
    }));
    return Object.entries(monthly)
      .map(([key, vals]) => ({ 
        sortKey: key.split('|')[0],
        month: key.split('|')[1], 
        ...vals 
      }))
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
    return Object.entries(prodStats)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [customers]);

  const rankingClientes = useMemo(() => {
    return customers.map(c => ({
      name: c.name,
      total: c.entries.reduce((acc, e) => acc + e.total, 0),
      pending: c.entries.filter(e => !e.isPaid).reduce((acc, e) => acc + e.total, 0)
    })).sort((a, b) => b.total - a.total).slice(0, 10);
  }, [customers]);

  const handleExportConsolidatedCSV = () => {
    const headers = ["Data", "Faturamento Total", "Total Recebido", "Total Pendente", "Estoque Total (Kg)"];
    const row = [new Date().toLocaleDateString('pt-BR'), stats.totalRevenue.toFixed(2), stats.totalPaid.toFixed(2), stats.totalPending.toFixed(2), stats.totalInStock.toFixed(1)];
    exportToCSV("consolidado_rei_do_pirarucu", [headers, row]);
  };

  const handleExportProductsCSV = () => {
    const headers = ["Produto", "Volume Vendido (Kg)", "Receita Bruta (R$)"];
    const rows = reportData.map(p => [p.name, p.weight.toFixed(1), p.revenue.toFixed(2)]);
    exportToCSV("performance_produtos", [headers, ...rows]);
  };

  const handleExportClientsCSV = () => {
    const headers = ["Cliente", "Volume Financeiro Total (R$)", "Dívida Pendente (R$)"];
    const rows = rankingClientes.map(c => [c.name, c.total.toFixed(2), c.pending.toFixed(2)]);
    exportToCSV("ranking_clientes", [headers, ...rows]);
  };

  const handleTogglePayment = (customerId: string, entryId: string) => {
    setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, entries: c.entries.map(e => e.id === entryId ? { ...e, isPaid: !e.isPaid } : e) } : c));
  };

  const handleDeleteEntry = (customerId: string, entryId: string) => {
    if (window.confirm('Excluir este lançamento permanentemente? O estoque será devolvido automaticamente.')) {
      setCustomers(prev => prev.map(c => {
        if (c.id === customerId) {
          const entry = c.entries.find(e => e.id === entryId);
          if (entry) {
            setStock(sPrev => sPrev.map(s => s.productName === entry.productName ? { ...s, availableWeight: s.availableWeight + entry.weightKg, lastUpdate: new Date().toISOString() } : s));
          }
          return { ...c, entries: c.entries.filter(e => e.id !== entryId) };
        }
        return c;
      }));
    }
  };

  const handleSubmitVenda = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCustomerId || !formData.productName) return;
    const price = Number(formData.pricePerKg);
    const weight = Number(formData.weightKg);
    const prodName = formData.productName.toUpperCase().trim();
    
    // Check if stock exists
    const currentStock = stock.find(s => s.productName === prodName);
    if (currentStock && currentStock.availableWeight < weight) {
      if (!window.confirm(`Estoque insuficiente de ${prodName} (${currentStock.availableWeight.toFixed(1)}kg disponível). Deseja continuar mesmo assim (estoque ficará negativo)?`)) return;
    }

    const newEntry: SaleEntry = { id: Date.now().toString(), productName: prodName, pricePerKg: price, weightKg: weight, total: price * weight, date: formData.date, isPaid: formData.isPaid };
    
    setCustomers(prev => prev.map(c => c.id === activeCustomerId ? { ...c, entries: [newEntry, ...c.entries] } : c));
    setStock(prev => {
      const exists = prev.some(s => s.productName === prodName);
      if (exists) return prev.map(s => s.productName === prodName ? { ...s, availableWeight: s.availableWeight - weight, lastUpdate: new Date().toISOString() } : s);
      return [...prev, { productName: prodName, availableWeight: -weight, lastUpdate: new Date().toISOString() }];
    });
    
    setIsVendaModalOpen(false);
    setFormData({ productName: '', pricePerKg: '', weightKg: '', date: new Date().toISOString().split('T')[0], isPaid: false });
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerForm.name) return;
    if (isEditingCustomer && customerForm.id) {
      setCustomers(prev => prev.map(c => c.id === customerForm.id ? { ...c, ...customerForm as Customer } : c));
    } else {
      setCustomers(prev => [...prev, { ...customerForm as Customer, id: Date.now().toString(), entries: [], priceList: customerForm.priceList || {} }]);
    }
    setIsCustomerModalOpen(false);
    setCustomerForm({ name: '', taxId: '', address: '', contactPerson: '', phone: '', priceList: {} });
  };

  const handleAbastecer = (e: React.FormEvent) => {
    e.preventDefault();
    const weight = Number(stockFormData.weightToAdd);
    const prodName = stockFormData.productName.toUpperCase().trim();
    if (!prodName) return;
    setStock(prev => {
      const exists = prev.some(s => s.productName === prodName);
      if (exists) return prev.map(s => s.productName === prodName ? { ...s, availableWeight: s.availableWeight + weight, lastUpdate: new Date().toISOString() } : s);
      return [...prev, { productName: prodName, availableWeight: weight, lastUpdate: new Date().toISOString() }];
    });
    setIsStockModalOpen(false);
    setStockFormData({ productName: '', weightToAdd: '' });
  };

  const handleUpdateStockItem = (e: React.FormEvent) => {
    e.preventDefault();
    const newWeight = Number(editStockFormData.weight);
    const newName = editStockFormData.newName.toUpperCase().trim();
    const oldName = editStockFormData.oldName;

    setStock(prev => prev.map(s => s.productName === oldName ? { ...s, productName: newName, availableWeight: newWeight, lastUpdate: new Date().toISOString() } : s));
    
    if (newName !== oldName) {
      setCustomers(prev => prev.map(c => ({
        ...c,
        entries: c.entries.map(e => e.productName === oldName ? { ...e, productName: newName } : e),
        priceList: Object.fromEntries(
          Object.entries(c.priceList || {}).map(([key, val]) => [key === oldName ? newName : key, val])
        )
      })));
    }
    setIsEditStockModalOpen(false);
  };

  const handleDeleteStockItem = (productName: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o item "${productName}" do estoque? Isso não removerá as vendas já registradas.`)) {
      setStock(prev => prev.filter(s => s.productName !== productName));
    }
  };

  const NavItem = ({ id, label, icon: Icon }: { id: ViewType, label: string, icon: any }) => (
    <button onClick={() => setActiveView(id)} className={`w-full flex items-center gap-4 px-8 py-5 transition-all duration-300 relative group ${activeView === id ? 'text-white' : 'text-blue-200/60 hover:text-white'}`}>
      <Icon className={`w-5 h-5 transition-transform duration-500 ${activeView === id ? 'scale-110' : 'group-hover:scale-110'}`} />
      <span className="font-black uppercase text-[10px] tracking-widest">{label}</span>
      {activeView === id && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1.5 bg-yellow-400 rounded-r-full shadow-[0_0_15px_rgba(250,204,21,0.5)]"></div>}
    </button>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 overflow-hidden font-['Inter']">
      <aside className="w-72 bg-blue-950 text-white flex flex-col shadow-2xl z-50 print:hidden">
        <div className="p-10">
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-xl shadow-blue-900/40"><FishIcon className="w-8 h-8 text-blue-900" /></div>
            <div><h1 className="font-black text-2xl leading-none uppercase tracking-tighter italic">Rei do<br/><span className="text-yellow-400">Pirarucu</span></h1></div>
          </div>
          <div className="h-1 w-12 bg-yellow-400/30 rounded-full mt-4"></div>
        </div>
        <nav className="flex-1 mt-6">
          <NavItem id="dashboard" label="Visão Geral" icon={LayoutIcon} />
          <NavItem id="inventory" label="Controle de Estoque" icon={BoxIcon} />
          <NavItem id="customers" label="Gestão de Clientes" icon={UsersIcon} />
          <NavItem id="reports" label="Auditoria Financeira" icon={ChartIcon} />
        </nav>
        <div className="p-8 border-t border-white/5 space-y-4">
          <button onClick={() => { setIsEditingCustomer(false); setCustomerForm({ name: '', priceList: {} }); setIsCustomerModalOpen(true); }} className="w-full bg-yellow-400 text-blue-950 font-black py-4 rounded-2xl shadow-xl shadow-yellow-400/10 uppercase text-[10px] tracking-widest hover:bg-yellow-300 transition-all active:scale-[0.97] flex items-center justify-center gap-3"><PlusIcon className="w-4 h-4" /> Novo Cliente</button>
          <button onClick={() => { setStockFormData({ productName: '', weightToAdd: '' }); setIsStockModalOpen(true); }} className="w-full bg-white/5 text-white font-black py-4 rounded-2xl uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-3 border border-white/10"><BoxIcon className="w-4 h-4 text-blue-400" /> Abastecer</button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#f8fafc]">
        <header className="h-24 px-12 flex items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-xl z-40 print:hidden">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-800">
              {activeView === 'dashboard' && 'Monitor de Performance'}
              {activeView === 'inventory' && 'Controle de Inventário'}
              {activeView === 'customers' && 'Base de Compradores'}
              {activeView === 'reports' && 'Relatórios e Auditoria'}
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Status do Sistema: <span className="text-emerald-500">Operacional</span></p>
          </div>
          <div className="flex items-center gap-10">
            <div className="text-right">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Total em Caixa</p>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <p className="text-2xl font-black text-slate-900 leading-none">{formatCurrency(stats.totalPaid)}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar print:overflow-visible print:p-0">
          {activeView === 'dashboard' && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-700">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  { label: 'Faturamento Total', value: stats.totalRevenue, color: 'blue', isCurrency: true },
                  { label: 'Pendências Hoje', value: stats.totalPending, color: 'amber', isCurrency: true },
                  { label: 'Volume em Estoque', value: stats.totalInStock, color: 'indigo', unit: ' Kg' },
                  { label: 'Compradores Ativos', value: stats.customerCount, color: 'slate' }
                ].map((s, i) => (
                  <div key={i} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:border-blue-200 hover:shadow-2xl transition-all duration-500">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-6 tracking-widest">{s.label}</p>
                    <h3 className={`text-3xl font-black tracking-tighter ${s.color === 'blue' ? 'text-blue-600' : s.color === 'amber' ? 'text-amber-500' : 'text-slate-900'}`}>{s.isCurrency ? formatCurrency(s.value) : `${s.value.toFixed(1)}${s.unit || ''}`}</h3>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-[3rem] border border-slate-100 p-10 shadow-sm relative overflow-hidden group">
                <div className="flex justify-between items-center mb-12">
                  <div><h3 className="text-xl font-black uppercase tracking-tighter text-slate-800">Histórico de Fluxo de Caixa (Mensal)</h3><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Valores expressos em Reais (BRL)</p></div>
                  <div className="flex gap-6">
                    <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-lg bg-emerald-500 shadow-lg shadow-emerald-500/30"></div><span className="text-[10px] font-black text-slate-500 uppercase">Recebidos</span></div>
                    <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-lg bg-amber-500 shadow-lg shadow-amber-500/30"></div><span className="text-[10px] font-black text-slate-500 uppercase">A Receber</span></div>
                  </div>
                </div>
                <div className="h-[450px] w-full"><MonthlyBarChart data={timelineMonthlyData} /></div>
              </div>
            </div>
          )}

          {activeView === 'inventory' && (
            <div className="space-y-10 animate-in slide-in-from-bottom-10 duration-700">
               <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border shadow-sm">
                  <div className="flex gap-4">
                    <div className="px-6 py-2 bg-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500">Total Itens: {stock.length}</div>
                    <div className="px-6 py-2 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest">Peso Total: {stats.totalInStock.toFixed(1)} Kg</div>
                  </div>
                  <button onClick={() => { setStockFormData({ productName: '', weightToAdd: '' }); setIsStockModalOpen(true); }} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">Registrar Entrada</button>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {stock.sort((a,b) => b.availableWeight - a.availableWeight).map(item => {
                    const isZero = item.availableWeight <= 0;
                    return (
                      <div key={item.productName} className={`p-8 rounded-[2.5rem] border-2 transition-all duration-500 flex flex-col justify-between group h-64 ${isZero ? 'bg-red-50 border-red-200' : 'bg-white border-slate-100 hover:border-blue-300'}`}>
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <span className={`text-[10px] font-black uppercase tracking-widest truncate max-w-[140px] ${isZero ? 'text-red-700' : 'text-slate-400'}`}>{item.productName}</span>
                            <div className="flex gap-1">
                              <button onClick={() => { setEditStockFormData({ oldName: item.productName, newName: item.productName, weight: item.availableWeight.toString() }); setIsEditStockModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors" title="Editar"><EditIcon className="w-3.5 h-3.5"/></button>
                              <button onClick={() => handleDeleteStockItem(item.productName)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors" title="Excluir"><TrashIcon className="w-3.5 h-3.5"/></button>
                            </div>
                          </div>
                          <h4 className="text-3xl font-black text-slate-900 tracking-tighter">{item.availableWeight.toFixed(1)} <span className="text-sm text-slate-400 font-bold uppercase">Kg</span></h4>
                        </div>
                        <button onClick={() => { setStockFormData({ ...stockFormData, productName: item.productName }); setIsStockModalOpen(true); }} className={`w-full py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${isZero ? 'bg-red-600 text-white shadow-lg shadow-red-200' : 'bg-slate-100 text-slate-500 hover:bg-blue-600 hover:text-white hover:shadow-lg hover:shadow-blue-200'}`}>Abastecer</button>
                      </div>
                    );
                  })}
                  {stock.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                      <p className="text-slate-400 font-black uppercase tracking-widest text-sm">Nenhum item em estoque</p>
                    </div>
                  )}
               </div>
            </div>
          )}

          {activeView === 'customers' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-8 animate-in fade-in duration-700">
              {customers.map(customer => (
                <CustomerCard key={customer.id} customer={customer} onAddEntry={(id) => { setActiveCustomerId(id); setIsVendaModalOpen(true); }} onDeleteEntry={handleDeleteEntry} onTogglePayment={handleTogglePayment} onDeleteCustomer={(id) => setCustomers(prev => prev.filter(c => c.id !== id))} onEditCustomer={(c) => { setCustomerForm(c); setIsEditingCustomer(true); setIsCustomerModalOpen(true); }} />
              ))}
              <button onClick={() => { setIsEditingCustomer(false); setCustomerForm({ name: '', priceList: {} }); setIsCustomerModalOpen(true); }} className="border-4 border-dashed border-slate-200 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-slate-300 hover:border-blue-500 hover:text-blue-500 hover:bg-white transition-all duration-500 min-h-[450px]"><PlusIcon className="w-16 h-16 mb-4" /><span className="font-black uppercase tracking-[0.2em] text-sm text-center">Registrar Novo<br/>Parceiro Comercial</span></button>
            </div>
          )}

          {activeView === 'reports' && (
            <div className="space-y-10 animate-in slide-in-from-right-10 duration-700">
               <div className="bg-white rounded-[3rem] p-10 border shadow-sm flex flex-col md:flex-row justify-between items-center gap-8 print:border-none print:shadow-none print:p-0">
                  <div className="text-center md:text-left">
                    <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Resumo Financeiro Consolidado</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Auditoria de vendas e volume de mercadoria</p>
                  </div>
                  <div className="flex gap-4 print:hidden">
                    <button onClick={handleExportConsolidatedCSV} className="p-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl flex items-center gap-2 transition-all" title="Exportar CSV"><LayoutIcon className="w-4 h-4" /><span className="text-[10px] font-black uppercase">CSV</span></button>
                    <button onClick={() => window.print()} className="p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20" title="Imprimir Relatório"><ChartIcon className="w-4 h-4" /><span className="text-[10px] font-black uppercase tracking-widest">Imprimir PDF</span></button>
                  </div>
               </div>
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="bg-white rounded-[3rem] p-10 border shadow-sm print:border-none print:shadow-none print:p-0">
                    <div className="flex justify-between items-center mb-10"><h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Performance por Produto</h3><button onClick={handleExportProductsCSV} className="text-blue-500 hover:text-blue-700 transition-all p-2 print:hidden" title="Baixar CSV"><BoxIcon className="w-4 h-4" /></button></div>
                    <div className="space-y-6">
                      {reportData.length > 0 ? reportData.map(p => (
                      <div key={p.name} className="flex items-center gap-6">
                        <div className="flex-1"><div className="flex justify-between mb-2"><span className="text-[10px] font-black uppercase text-slate-700">{p.name}</span><span className="text-[10px] font-bold text-slate-400">{formatCurrency(p.revenue)}</span></div><div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-blue-600 rounded-full transition-all duration-1000" style={{ width: `${(p.revenue / reportData[0].revenue) * 100}%` }}></div></div></div>
                        <div className="text-right min-w-[80px]"><p className="text-xs font-black text-slate-900">{p.weight.toFixed(1)} <span className="text-[10px] font-bold">Kg</span></p></div>
                      </div>
                      )) : <p className="text-center py-10 text-slate-300 font-black uppercase tracking-widest text-[10px]">Sem dados para exibir</p>}
                    </div>
                  </div>
                  <div className="bg-white rounded-[3rem] p-10 border shadow-sm print:border-none print:shadow-none print:p-0">
                    <div className="flex justify-between items-center mb-10"><h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Ranking Financeiro (Clientes)</h3><button onClick={handleExportClientsCSV} className="text-yellow-600 hover:text-yellow-700 transition-all p-2 print:hidden" title="Baixar CSV"><UsersIcon className="w-4 h-4" /></button></div>
                    <div className="space-y-4">{rankingClientes.map((c, i) => (
                      <div key={c.name} className="flex items-center justify-between p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 rounded-xl transition-colors"><div className="flex items-center gap-4"><span className="text-[10px] font-black text-blue-600 bg-blue-50 w-6 h-6 rounded-lg flex items-center justify-center">{i+1}</span><span className="text-xs font-black uppercase text-slate-700">{c.name}</span></div><span className="text-xs font-black text-slate-900">{formatCurrency(c.total)}</span></div>
                    ))}</div>
                  </div>
               </div>
            </div>
          )}
        </div>
      </main>

      {/* MODALS */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 bg-blue-950/80 backdrop-blur-md z-[110] flex items-center justify-center p-6 overflow-y-auto">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden my-auto animate-in zoom-in duration-300">
            <div className="bg-blue-900 p-10 text-white flex justify-between items-center">
              <div><h3 className="text-3xl font-black uppercase tracking-tighter italic">{isEditingCustomer ? 'Editar Perfil' : 'Novo Comprador'}</h3><p className="text-blue-300 text-[10px] font-black uppercase tracking-widest mt-1">Configuração de Ficha e Tabela de Preços</p></div>
              <button onClick={() => setIsCustomerModalOpen(false)} className="text-3xl hover:text-yellow-400">✕</button>
            </div>
            <form onSubmit={handleSaveCustomer} className="p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-full"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Razão Social / Nome</label><input required className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 uppercase font-black text-lg focus:border-blue-500 focus:bg-white outline-none transition-all" value={customerForm.name} onChange={e => setCustomerForm({ ...customerForm, name: e.target.value })} /></div>
                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">CNPJ / CPF</label><input className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-mono text-sm focus:border-blue-500 focus:bg-white outline-none transition-all" value={customerForm.taxId} onChange={e => setCustomerForm({ ...customerForm, taxId: e.target.value })} /></div>
                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Pessoa de Contato</label><input className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 uppercase font-bold text-sm focus:border-blue-500 focus:bg-white outline-none transition-all" value={customerForm.contactPerson} onChange={e => setCustomerForm({ ...customerForm, contactPerson: e.target.value })} /></div>
              </div>
              <div className="pt-8 border-t border-slate-100">
                <h4 className="text-[10px] font-black text-blue-900 uppercase tracking-widest mb-6 flex items-center gap-2"><BoxIcon className="w-4 h-4 text-yellow-500" /> Tabela de Preços Especial (R$/Kg)</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                  {PRODUCT_SUGGESTIONS.map(prod => (
                    <div key={prod} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 focus-within:border-blue-200 transition-all">
                      <label className="block text-[8px] font-black text-slate-400 uppercase mb-1 truncate">{prod}</label>
                      <input type="number" step="0.01" className="w-full bg-transparent font-mono text-xs font-black outline-none" placeholder="Padrao" value={customerForm.priceList?.[prod] || ''} onChange={e => { const newList = { ...(customerForm.priceList || {}) }; if (e.target.value) newList[prod] = Number(e.target.value); else delete newList[prod]; setCustomerForm({ ...customerForm, priceList: newList }); }} />
                    </div>
                  ))}
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-900 text-white font-black py-5 rounded-[2rem] shadow-2xl shadow-blue-900/20 uppercase tracking-widest text-sm active:scale-[0.98] transition-all">{isEditingCustomer ? 'ATUALIZAR CADASTRO' : 'CONFIRMAR REGISTRO'}</button>
            </form>
          </div>
        </div>
      )}

      {isVendaModalOpen && (
        <div className="fixed inset-0 bg-blue-950/80 backdrop-blur-md z-[110] flex items-center justify-center p-6">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-top-10 duration-500">
            <div className="bg-blue-900 p-10 text-white flex justify-between items-center">
              <h3 className="text-2xl font-black uppercase tracking-tighter italic">Lançamento de Venda</h3>
              <button onClick={() => setIsVendaModalOpen(false)} className="text-2xl hover:text-blue-200">✕</button>
            </div>
            <form onSubmit={handleSubmitVenda} className="p-10 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Selecione o Produto</label>
                <input autoFocus list="stockList" required className="w-full border-2 border-slate-100 bg-slate-50 rounded-2xl p-5 uppercase font-black text-xl outline-none focus:border-blue-500 focus:bg-white transition-all" placeholder="DIGITE O PEIXE..." value={formData.productName} onChange={e => setFormData({ ...formData, productName: e.target.value })} />
                <datalist id="stockList">{stock.map(s => <option key={s.productName} value={s.productName} />)}</datalist>
                <div className="mt-2 flex items-center gap-2"><p className="text-[10px] text-blue-600 font-black uppercase">Estoque: {stock.find(s => s.productName === formData.productName.toUpperCase().trim())?.availableWeight.toFixed(1) || 0} Kg</p></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Preço (Kg)</label><input type="number" step="0.01" required className="w-full border-2 border-slate-100 bg-slate-50 rounded-2xl p-5 font-mono text-2xl font-black text-center focus:border-blue-500 focus:bg-white outline-none" value={formData.pricePerKg} onChange={e => setFormData({ ...formData, pricePerKg: e.target.value })} /></div>
                <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Peso (Kg)</label><input type="number" step="0.001" required className="w-full border-2 border-slate-100 bg-slate-50 rounded-2xl p-5 font-mono text-2xl font-black text-center focus:border-blue-500 focus:bg-white outline-none" value={formData.weightKg} onChange={e => setFormData({ ...formData, weightKg: e.target.value })} /></div>
              </div>
              <div className="flex items-center gap-4 p-5 bg-slate-50 border border-slate-100 rounded-2xl"><input type="checkbox" id="vPaid" className="w-8 h-8 accent-emerald-600 cursor-pointer" checked={formData.isPaid} onChange={e => setFormData({ ...formData, isPaid: e.target.checked })} /><label htmlFor="vPaid" className="text-xs font-black text-slate-700 uppercase cursor-pointer select-none">Pagamento Já Efetuado</label></div>
              <button type="submit" className="w-full bg-blue-900 text-white font-black py-5 rounded-[2rem] shadow-xl uppercase tracking-widest text-sm active:scale-[0.98] transition-all">FINALIZAR E DAR BAIXA</button>
            </form>
          </div>
        </div>
      )}

      {isStockModalOpen && (
        <div className="fixed inset-0 bg-blue-950/80 backdrop-blur-md z-[110] flex items-center justify-center p-6">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-300">
            <div className="bg-blue-600 p-10 text-white flex justify-between items-center">
              <h3 className="text-2xl font-black uppercase tracking-tighter italic">Entrada de Mercadoria</h3>
              <button onClick={() => setIsStockModalOpen(false)} className="text-3xl hover:text-blue-100 transition-colors">✕</button>
            </div>
            <form onSubmit={handleAbastecer} className="p-10 space-y-6">
              <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Produto</label><input list="stockList" required className="w-full border-2 border-slate-100 bg-slate-50 rounded-2xl p-5 uppercase font-black text-xl outline-none focus:border-blue-600 focus:bg-white" placeholder="NOME DO PEIXE..." value={stockFormData.productName} onChange={e => setStockFormData({ ...stockFormData, productName: e.target.value })} /></div>
              <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Peso de Entrada (Kg)</label><input type="number" step="0.001" required className="w-full border-2 border-slate-100 bg-slate-50 rounded-2xl p-6 font-mono text-5xl font-black text-blue-600 text-center focus:border-blue-600 outline-none" value={stockFormData.weightToAdd} onChange={e => setStockFormData({ ...stockFormData, weightToAdd: e.target.value })} /></div>
              <button type="submit" className="w-full bg-blue-600 text-white font-black py-5 rounded-[2rem] shadow-xl uppercase tracking-widest text-sm active:scale-[0.98] transition-all">ATUALIZAR ESTOQUE</button>
              <button type="button" onClick={() => setIsStockModalOpen(false)} className="w-full text-slate-400 text-[10px] font-black uppercase tracking-widest pt-2 hover:text-slate-600 transition-colors">Cancelar e Sair</button>
            </form>
          </div>
        </div>
      )}

      {isEditStockModalOpen && (
        <div className="fixed inset-0 bg-blue-950/80 backdrop-blur-md z-[110] flex items-center justify-center p-6">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-300">
            <div className="bg-blue-900 p-10 text-white flex justify-between items-center">
              <h3 className="text-2xl font-black uppercase tracking-tighter italic">Editar Item de Estoque</h3>
              <button onClick={() => setIsEditStockModalOpen(false)} className="text-3xl hover:text-blue-100 transition-colors">✕</button>
            </div>
            <form onSubmit={handleUpdateStockItem} className="p-10 space-y-6">
              <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Nome do Produto</label><input required className="w-full border-2 border-slate-100 bg-slate-50 rounded-2xl p-5 uppercase font-black text-xl outline-none focus:border-blue-900 focus:bg-white" value={editStockFormData.newName} onChange={e => setEditStockFormData({ ...editStockFormData, newName: e.target.value })} /></div>
              <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Ajustar Peso Total (Kg)</label><input type="number" step="0.001" required className="w-full border-2 border-slate-100 bg-slate-50 rounded-2xl p-6 font-mono text-5xl font-black text-blue-900 text-center focus:border-blue-900 outline-none" value={editStockFormData.weight} onChange={e => setEditStockFormData({ ...editStockFormData, weight: e.target.value })} /></div>
              <button type="submit" className="w-full bg-blue-900 text-white font-black py-5 rounded-[2rem] shadow-xl uppercase tracking-widest text-sm active:scale-[0.98] transition-all">SALVAR ALTERAÇÕES</button>
              <button type="button" onClick={() => setIsEditStockModalOpen(false)} className="w-full text-slate-400 text-[10px] font-black uppercase tracking-widest pt-2 hover:text-slate-600 transition-colors">Cancelar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
