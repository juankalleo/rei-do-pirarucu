
import React, { useState } from 'react';
import { Customer, SaleEntry } from '../types';
import { TrashIcon, PlusIcon, CheckIcon, ClockIcon, UsersIcon, ChartIcon } from './Icons';

interface CustomerCardProps {
  customer: Customer;
  onAddEntry: (customerId: string) => void;
  onDeleteEntry: (customerId: string, entryId: string) => void;
  onTogglePayment: (customerId: string, entryId: string) => void;
  onPartialPayment: (customerId: string, entryId: string) => void;
  onDeleteCustomer: (customerId: string) => void;
  onEditCustomer: (customer: Customer) => void;
}

const CustomerCard: React.FC<CustomerCardProps> = ({ 
  customer, 
  onAddEntry, 
  onDeleteEntry,
  onTogglePayment,
  onPartialPayment,
  onDeleteCustomer,
  onEditCustomer
}) => {
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  
  const totalPaid = customer.entries.reduce((acc, e) => acc + (e.isPaid ? e.total : (e.paidAmount || 0)), 0);
  const totalDue = customer.entries.reduce((acc, e) => acc + e.total, 0);
  const totalPending = totalDue - totalPaid;
  const lastSaleDate = customer.entries.length > 0 ? customer.entries[0].date : null;

  const formatBRL = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full hover:shadow-xl transition-all duration-300 group">
      {/* Header do Card */}
      <div className="p-4 md:p-6 pb-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-slate-900 uppercase tracking-tighter truncate text-sm md:text-base lg:text-lg group-hover:text-blue-700 transition-colors">
              {customer.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[80px] md:max-w-[120px]">
                {customer.taxId ? customer.taxId : 'S/ DOC'}
              </span>
              {lastSaleDate && (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-200 shrink-0"></span>
                  <span className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase">
                    {new Date(lastSaleDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex gap-1 shrink-0 ml-2">
            <button onClick={() => onEditCustomer(customer)} className="p-1.5 md:p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><UsersIcon className="w-4 h-4" /></button>
            <button onClick={() => { if (window.confirm(`Excluir permanentemente o cliente ${customer.name}?`)) onDeleteCustomer(customer.id); }} className="p-1.5 md:p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><TrashIcon className="w-4 h-4" /></button>
          </div>
        </div>

        {customer.contactPerson && (
          <div className="bg-slate-50 rounded-xl p-2 md:p-3 mb-3 border border-slate-100">
            <p className="text-[8px] md:text-[9px] font-bold text-slate-600 flex items-center gap-2 uppercase truncate">
              <UsersIcon className="w-3 h-3 text-blue-500 shrink-0" /> {customer.contactPerson}
            </p>
          </div>
        )}
      </div>

      {/* Tabela de Vendas Rápida */}
      <div className="flex-1 overflow-y-auto max-h-[250px] scrollbar-hide border-y border-slate-50">
        <table className="w-full text-left table-fixed">
          <tbody className="divide-y divide-slate-50">
            {customer.entries.map((entry) => {
              const currentPaid = entry.isPaid ? entry.total : (entry.paidAmount || 0);
              const isPartial = currentPaid > 0 && currentPaid < entry.total;
              const isFull = entry.isPaid;
              const hasHistory = (entry.paymentHistory?.length || 0) > 0;
              const isExpanded = expandedEntry === entry.id;

              return (
                <React.Fragment key={entry.id}>
                  <tr className={`hover:bg-slate-50/50 transition-colors ${isExpanded ? 'bg-blue-50/30' : ''}`}>
                    <td className="py-2.5 px-3 md:px-4 w-[55%]">
                      <div className="flex items-center gap-2 overflow-hidden">
                        {hasHistory && (
                          <button 
                            onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}
                            className={`shrink-0 w-5 h-5 rounded-md flex items-center justify-center transition-colors ${isExpanded ? 'bg-[#002855] text-white' : 'text-slate-300 hover:text-blue-500'}`}
                          >
                            <ChartIcon className="w-3 h-3" />
                          </button>
                        )}
                        <div className="truncate">
                          <p className="text-[9px] md:text-[10px] font-black text-slate-700 uppercase leading-none truncate">{entry.productName}</p>
                          <p className="text-[7px] md:text-[8px] font-bold text-slate-400 mt-1">
                            {entry.weightKg}Kg • {new Date(entry.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                            {isFull && entry.paidAt && (
                              <span className="text-emerald-600 ml-1">
                                (PG em {new Date(entry.paidAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })})
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-1 text-right w-[20%]">
                      <span className={`font-mono text-[9px] md:text-[10px] font-black block leading-none ${isFull ? 'text-slate-400' : 'text-slate-900'}`}>
                        {formatBRL(entry.total)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 md:px-4 text-right w-[25%]">
                      <div className="flex items-center justify-end gap-1 md:gap-1.5">
                        {!isFull && (
                          <button 
                            onClick={() => onPartialPayment(customer.id, entry.id)}
                            className={`w-6 h-6 md:w-7 md:h-7 rounded-lg flex items-center justify-center transition-all ${isPartial ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'} hover:bg-amber-200`}
                          >
                            <span className="text-[10px] font-black">$</span>
                          </button>
                        )}
                        <button 
                          onClick={() => onTogglePayment(customer.id, entry.id)}
                          className={`w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center transition-all ${
                            isFull ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-300'
                          }`}
                        >
                          {isFull ? <CheckIcon className="w-3 md:w-3.5 h-3 md:h-3.5" /> : <ClockIcon className="w-3 md:w-3.5 h-3 md:h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {isExpanded && (
                    <tr className="bg-blue-50/50">
                      <td colSpan={3} className="px-4 py-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center pb-2 border-b border-blue-100">
                            <span className="text-[9px] font-black text-blue-900 uppercase">Recebimentos</span>
                            <span className="text-[9px] font-black text-blue-900">{((currentPaid / entry.total) * 100).toFixed(0)}%</span>
                          </div>
                          <div className="space-y-1.5">
                            {entry.paymentHistory?.map((pay, pidx) => (
                              <div key={pidx} className="flex justify-between items-center text-[9px] font-bold">
                                <span className="text-slate-400">{new Date(pay.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                                <span className="text-emerald-600 font-black">+ {formatBRL(pay.amount)}</span>
                              </div>
                            ))}
                            <div className="pt-2 flex justify-between items-center text-[10px] font-black border-t border-blue-100/50 mt-1">
                              <span className="text-blue-900 uppercase">Restante</span>
                              <span className="text-amber-700">{formatBRL(entry.total - currentPaid)}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer com Totais */}
      <div className="p-4 md:p-6 bg-slate-50/50 mt-auto">
        <div className="grid grid-cols-2 gap-2 md:gap-3 mb-4 md:mb-5">
          <div className="bg-white p-2.5 md:p-3 rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <p className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase mb-1">Pago</p>
            <p className="text-[10px] md:text-sm font-black text-emerald-600 truncate">{formatBRL(totalPaid)}</p>
          </div>
          <div className={`p-2.5 md:p-3 rounded-xl border transition-all overflow-hidden ${totalPending > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-100 shadow-sm'}`}>
            <p className="text-[7px] md:text-[8px] font-black text-amber-600 uppercase mb-1">Dívida</p>
            <p className="text-[10px] md:text-sm font-black text-amber-700 truncate">{formatBRL(totalPending)}</p>
          </div>
        </div>
        
        <button 
          onClick={() => onAddEntry(customer.id)} 
          className="w-full bg-[#002855] text-white font-black py-3.5 md:py-4 rounded-xl shadow-lg shadow-[#002855]/10 uppercase text-[9px] md:text-[10px] tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 border border-yellow-500/10"
        >
          <PlusIcon className="w-3.5 md:w-4 h-3.5 md:h-4 text-yellow-400" /> NOVA VENDA
        </button>
      </div>
    </div>
  );
};

export default CustomerCard;
