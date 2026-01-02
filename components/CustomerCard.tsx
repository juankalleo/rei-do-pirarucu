
import React, { useState } from 'react';
import { Customer, SaleEntry } from '../types';
import { TrashIcon, PlusIcon, CheckIcon, PrinterIcon, WalletIcon, CreditCardIcon, EditIcon } from './Icons';

interface CustomerCardProps {
  customer: Customer;
  onAddEntry: (customerId: string) => void;
  onDeleteEntry: (customerId: string, entryId: string) => void;
  onTogglePayment: (customerId: string, entryId: string) => void;
  onPartialPayment: (customerId: string, entryId?: string) => void;
  onDeleteCustomer: (customerId: string) => void;
  onPrintOrder: (entries: SaleEntry[]) => void;
  onDispatch: (customerId: string, entryIds: string[]) => void;
  onManageCredit: (customerId: string) => void;
  onSettleAll: (customerId: string) => void;
}

const CustomerCard: React.FC<CustomerCardProps> = ({ 
  customer, onAddEntry, onDeleteEntry, onTogglePayment, 
  onPartialPayment, onDeleteCustomer, onPrintOrder, onDispatch,
  onManageCredit
}) => {
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  
  const totalPaid = customer.entries.reduce((acc, e) => acc + (e.isPaid ? e.total : (e.paidAmount || 0)), 0);
  const totalDue = customer.entries.reduce((acc, e) => acc + e.total, 0);
  const totalPending = totalDue - totalPaid;
  
  const availableCredit = (customer.creditLimit || 0) - totalPending;
  const creditUsagePercent = customer.creditLimit > 0 ? (totalPending / customer.creditLimit) * 100 : 0;

  const handleToggleSelect = (id: string) => {
    setSelectedEntries(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    if (selectedEntries.length === customer.entries.length) setSelectedEntries([]);
    else setSelectedEntries(customer.entries.map(e => e.id));
  };

  // Filter entries from today for the "Quick Receipt" button
  const todayStr = new Date().toISOString().split('T')[0];
  const todayEntries = customer.entries.filter(e => e.date === todayStr && !e.isPaid);

  return (
    <div className="bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60 overflow-hidden flex flex-col h-full hover:shadow-[0_15px_45px_rgb(0,0,0,0.08)] transition-all duration-500 group relative">
      {/* WALLET / CREDIT HEADER */}
      <div className="bg-[#002855] p-6 text-white relative overflow-hidden">
        <CreditCardIcon className="absolute -right-4 -top-4 w-20 h-20 opacity-10 rotate-12" />
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-black uppercase truncate text-lg leading-none tracking-tight text-yellow-400">{customer.name}</h3>
            <p className="text-[10px] font-bold text-white/50 mt-1 uppercase tracking-widest">{customer.taxId || 'Sem Doc'}</p>
          </div>
          <button onClick={() => onDeleteCustomer(customer.id)} className="p-2 text-white/20 hover:text-red-400 transition-all active:scale-90"><TrashIcon className="w-4 h-4"/></button>
        </div>

        <div className="grid grid-cols-2 gap-4 relative z-10">
          <div className="bg-white/10 p-3 rounded-2xl border border-white/10 backdrop-blur-sm">
             <p className="text-[8px] font-black uppercase text-white/60 mb-1">Carteira Digital</p>
             <p className="text-sm font-black text-emerald-400 tabular-nums">{(customer.walletBalance || 0).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</p>
          </div>
          <button onClick={() => onManageCredit(customer.id)} className="bg-white/10 p-3 rounded-2xl border border-white/10 backdrop-blur-sm text-left hover:bg-white/20 transition-all group/btn">
             <p className="text-[8px] font-black uppercase text-white/60 mb-1 flex justify-between">Limite Crédito <EditIcon className="w-2 h-2 opacity-0 group-hover/btn:opacity-100 transition-opacity"/></p>
             <p className={`text-sm font-black tabular-nums ${availableCredit < 0 ? 'text-red-400' : 'text-yellow-400'}`}>
                {availableCredit.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
             </p>
          </button>
        </div>
        
        {customer.creditLimit > 0 && (
          <div className="w-full bg-white/10 h-1 rounded-full mt-4 overflow-hidden">
             <div className={`h-full transition-all duration-700 ${creditUsagePercent > 90 ? 'bg-red-500' : creditUsagePercent > 70 ? 'bg-yellow-500' : 'bg-emerald-500'}`} style={{width: `${Math.min(creditUsagePercent, 100)}%`}}></div>
          </div>
        )}
      </div>

      <div className="p-6 pb-2">
        {customer.entries.length > 0 && (
           <div className="flex items-center justify-between mb-4">
              <button onClick={handleSelectAll} className="text-[8px] font-black uppercase tracking-widest text-slate-500 hover:text-[#002855] transition-colors bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/50 shadow-inner">
                {selectedEntries.length === customer.entries.length ? 'Desmarcar Todos' : 'Selecionar Tudo'}
              </button>
              <div className="flex gap-2">
                {todayEntries.length > 0 && (
                  <button 
                    onClick={() => onPrintOrder(todayEntries)} 
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-yellow-100 transition-all shadow-sm"
                    title="Imprimir vendas de hoje"
                  >
                    <PrinterIcon className="w-3 h-3"/> Hoje
                  </button>
                )}
                {selectedEntries.length > 0 && (
                  <div className="flex gap-2 animate-in slide-in-from-right duration-200">
                     <button onClick={() => onPrintOrder(customer.entries.filter(e => selectedEntries.includes(e.id)))} title={`Imprimir selecionados (${selectedEntries.length})`} className="p-2 bg-slate-900 text-white rounded-lg shadow-md hover:bg-black transition-all active:scale-90"><PrinterIcon className="w-3.5 h-3.5"/></button>
                     <button onClick={() => onDispatch(customer.id, selectedEntries)} title="Baixa / Pagto Coletivo" className="p-2 bg-emerald-600 text-white rounded-lg shadow-md hover:bg-emerald-700 transition-all active:scale-90"><CheckIcon className="w-3.5 h-3.5"/></button>
                  </div>
                )}
              </div>
           </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto max-h-[200px] border-y border-slate-100 bg-slate-50/40 custom-scrollbar">
      <table className="w-full text-left">
        <tbody className="divide-y divide-slate-100">
          {customer.entries.filter(e => !e.isPaid).map((e) => {
                 const isSelected = selectedEntries.includes(e.id);
                 return (
                   <tr key={e.id} className={`transition-all ${isSelected ? 'bg-blue-50/80 shadow-inner' : 'hover:bg-white'} ${e.isDispatched ? 'opacity-40' : ''}`}>
                      <td className="py-4 px-6 w-10">
                         <input type="checkbox" checked={isSelected} onChange={() => handleToggleSelect(e.id)} className="w-4 h-4 rounded border-slate-300 text-[#002855] focus:ring-[#002855] cursor-pointer transition-all" />
                      </td>
                      <td className="py-4">
                         <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-[#002855] leading-none mb-1">{e.productName}</span>
                            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter tabular-nums">{e.weightKg.toFixed(1)} kg</span>
                         </div>
                      </td>
                      <td className="py-4 text-right">
                         <span className={`font-mono text-[11px] font-black tabular-nums ${e.isPaid ? 'text-emerald-600' : 'text-slate-900'}`}>{e.total.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</span>
                      </td>
                      <td className="py-4 px-6 text-right w-24">
                         <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!e.isPaid && <button onClick={() => onPartialPayment(customer.id, e.id)} title="Pagamento Parcial" className="w-7 h-7 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center font-black text-[10px] border border-amber-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 shadow-sm transition-all active:scale-90">$</button>}
                            <button onClick={() => onTogglePayment(customer.id, e.id)} title={e.isPaid ? "Desmarcar Quitação" : "Quitação da Dívida"} className={`w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90 ${e.isPaid ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-200 text-slate-500 hover:bg-emerald-500 hover:text-white border border-slate-300 shadow-sm'}`}><CheckIcon className="w-4 h-4" /></button>
                            <button onClick={() => onDeleteEntry(customer.id, e.id)} title="Excluir item" className="w-7 h-7 text-slate-300 hover:text-red-500 rounded-lg flex items-center justify-center transition-all active:scale-90"><TrashIcon className="w-3.5 h-3.5" /></button>
                         </div>
                      </td>
                   </tr>
                 );
               })}
            </tbody>
         </table>
      </div>

      <div className="p-6 bg-white border-t border-slate-50">
         <div className="flex gap-4 mb-4">
            <div className="flex-1 bg-slate-50 p-3 rounded-2xl border border-slate-200/60 shadow-inner flex items-center justify-between gap-4">
               <div>
                 <p className="text-[8px] font-black text-slate-500 uppercase mb-1 tracking-widest">Total Pendente</p>
                 <p className={`text-xs font-black font-mono tabular-nums ${totalPending > 0 ? 'text-red-600' : 'text-slate-500'}`}>{totalPending.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</p>
               </div>
               <div className="flex-shrink-0">
                 {totalPending > 0 && (
                   <button onClick={() => onPartialPayment(customer.id)} title="Pagamento Parcial" className="px-3 py-2 bg-amber-50 text-amber-600 rounded-lg font-black text-[11px] uppercase tracking-wider border border-amber-200 hover:bg-amber-100 hover:text-amber-700 transition-all">ABATER</button>
                 )}
               </div>
            </div>
         </div>
        <div className="flex gap-2 items-center">
          <button onClick={() => onAddEntry(customer.id)} className="flex-1 min-w-0 bg-[#002855] text-white font-black py-3 rounded-xl text-[9px] uppercase tracking-[0.12em] shadow-xl hover:shadow-2xl hover:bg-blue-900 active:scale-95 transition-all flex items-center justify-center gap-2 border border-white/5">
           <PlusIcon className="w-4 h-4 text-yellow-500" /> LANÇAR VENDA
          </button>
          <button onClick={() => onSettleAll(customer.id)} title="Quitar dívidas" className="flex-shrink-0 px-3 py-2 bg-emerald-600 text-white font-black rounded-xl text-[9px] uppercase tracking-[0.12em] hover:bg-emerald-700 transition-all flex items-center justify-center">
            <CheckIcon className="w-4 h-4" />
            <span className="sr-only">QUITAR</span>
          </button>
          <button onClick={() => onDeleteCustomer(customer.id)} title="Excluir cliente" className="flex-shrink-0 px-3 py-2 bg-red-600 text-white font-black rounded-xl text-[9px] uppercase tracking-[0.12em] hover:bg-red-700 transition-all flex items-center justify-center">
            <TrashIcon className="w-4 h-4" />
            <span className="sr-only">Excluir</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerCard;
