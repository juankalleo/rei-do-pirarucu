
import React, { useState } from 'react';
import { Customer, SaleEntry } from '../types';
import { TrashIcon, PlusIcon, CheckIcon, ClockIcon, UsersIcon, ChartIcon, PrinterIcon } from './Icons';

interface CustomerCardProps {
  customer: Customer;
  onAddEntry: (customerId: string) => void;
  onDeleteEntry: (customerId: string, entryId: string) => void;
  onTogglePayment: (customerId: string, entryId: string) => void;
  onPartialPayment: (customerId: string, entryId: string) => void;
  onDeleteCustomer: (customerId: string) => void;
  onEditCustomer: (customer: Customer) => void;
  onPrintOrder: (entries: SaleEntry[]) => void;
  onDispatch: (customerId: string, entryIds: string[]) => void;
}

const CustomerCard: React.FC<CustomerCardProps> = ({ 
  customer, 
  onAddEntry, 
  onDeleteEntry,
  onTogglePayment,
  onPartialPayment,
  onDeleteCustomer,
  onEditCustomer,
  onPrintOrder,
  onDispatch
}) => {
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  
  const totalPaid = customer.entries.reduce((acc, e) => acc + (e.isPaid ? e.total : (e.paidAmount || 0)), 0);
  const totalDue = customer.entries.reduce((acc, e) => acc + e.total, 0);
  const totalPending = totalDue - totalPaid;

  const formatBRL = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handleToggleSelect = (id: string) => {
    setSelectedEntries(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    if (selectedEntries.length === customer.entries.length) {
      setSelectedEntries([]);
    } else {
      setSelectedEntries(customer.entries.map(e => e.id));
    }
  };

  const handlePrintSelected = () => {
    const entries = customer.entries.filter(e => selectedEntries.includes(e.id));
    if (entries.length > 0) onPrintOrder(entries);
  };

  const handleDispatchSelected = () => {
    if (selectedEntries.length > 0) {
      onDispatch(customer.id, selectedEntries);
      setSelectedEntries([]);
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full hover:shadow-2xl transition-all duration-300 group">
      <div className="p-6 pb-4">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-[#002855] uppercase tracking-tighter truncate text-lg group-hover:text-blue-600 transition-colors leading-none">
              {customer.name}
            </h3>
            <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest truncate">{customer.taxId || 'Sem CNPJ/CPF'}</p>
          </div>
          <div className="flex gap-2">
             <button onClick={() => onEditCustomer(customer)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><UsersIcon className="w-4 h-4"/></button>
             <button onClick={() => onDeleteCustomer(customer.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><TrashIcon className="w-4 h-4"/></button>
          </div>
        </div>

        {customer.entries.length > 0 && (
           <div className="flex items-center justify-between mb-4">
              <button onClick={handleSelectAll} className="text-[8px] font-black uppercase tracking-widest text-slate-400 hover:text-[#002855] transition-colors bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                {selectedEntries.length === customer.entries.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
              </button>
              {selectedEntries.length > 0 && (
                <div className="flex gap-2 animate-in zoom-in duration-200">
                   <button onClick={handlePrintSelected} title="Imprimir Selecionados" className="p-2 bg-slate-900 text-white rounded-lg hover:bg-black transition-all shadow-md"><PrinterIcon className="w-3.5 h-3.5"/></button>
                   <button onClick={handleDispatchSelected} title="Baixa / Envio" className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all shadow-md"><CheckIcon className="w-3.5 h-3.5"/></button>
                </div>
              )}
           </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto max-h-[300px] border-y border-slate-50 bg-slate-50/20 custom-scrollbar">
         <table className="w-full text-left">
            <tbody className="divide-y divide-slate-100">
               {customer.entries.map((e) => {
                 const isSelected = selectedEntries.includes(e.id);
                 const isDispatched = e.isDispatched;
                 return (
                   <tr key={e.id} className={`group/row transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-white'} ${isDispatched ? 'opacity-60' : ''}`}>
                      <td className="py-4 px-6 w-12">
                         <input 
                           type="checkbox" 
                           checked={isSelected} 
                           onChange={() => handleToggleSelect(e.id)}
                           className="w-4 h-4 rounded border-slate-300 text-[#002855] focus:ring-[#002855] cursor-pointer"
                         />
                      </td>
                      <td className="py-4">
                         <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-[#002855] leading-none mb-1">{e.productName}</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase">{e.weightKg.toFixed(1)} kg • {new Date(e.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                         </div>
                      </td>
                      <td className="py-4 text-right">
                         <span className={`font-mono text-[11px] font-black ${e.isPaid ? 'text-emerald-600' : 'text-slate-900'}`}>{formatBRL(e.total)}</span>
                      </td>
                      <td className="py-4 px-6 text-right w-24">
                         <div className="flex items-center justify-end gap-1.5">
                            {!e.isPaid && (
                              <button onClick={() => onPartialPayment(customer.id, e.id)} className="w-7 h-7 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center hover:bg-amber-100 transition-all border border-amber-100"><span className="text-[10px] font-black">$</span></button>
                            )}
                            <button onClick={() => onTogglePayment(customer.id, e.id)} className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${e.isPaid ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-200 text-slate-400'}`}>
                               <CheckIcon className="w-4 h-4" />
                            </button>
                         </div>
                      </td>
                   </tr>
                 );
               })}
               {customer.entries.length === 0 && (
                 <tr><td colSpan={4} className="py-12 text-center text-[10px] font-black uppercase text-slate-300 italic">Sem vendas lançadas</td></tr>
               )}
            </tbody>
         </table>
      </div>

      <div className="p-6 bg-white border-t border-slate-100 mt-auto">
         <div className="flex gap-4 mb-5">
            <div className="flex-1 bg-slate-50 p-3 rounded-2xl border border-slate-100">
               <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Pago</p>
               <p className="text-xs font-black text-emerald-600 font-mono">{formatBRL(totalPaid)}</p>
            </div>
            <div className={`flex-1 p-3 rounded-2xl border transition-all ${totalPending > 0 ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
               <p className={`text-[8px] font-black uppercase mb-1 ${totalPending > 0 ? 'text-red-600' : 'text-slate-400'}`}>Pendente</p>
               <p className={`text-xs font-black font-mono ${totalPending > 0 ? 'text-red-700' : 'text-slate-500'}`}>{formatBRL(totalPending)}</p>
            </div>
         </div>
         <button onClick={() => onAddEntry(customer.id)} className="w-full bg-[#002855] text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest shadow-xl hover:shadow-blue-900/20 active:scale-95 transition-all flex items-center justify-center gap-2 border border-white/10">
            <PlusIcon className="w-4 h-4 text-yellow-500" /> LANÇAR VENDA
         </button>
      </div>
    </div>
  );
};

export default CustomerCard;
