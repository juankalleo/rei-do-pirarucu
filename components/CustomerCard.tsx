
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
    <div className="bg-white rounded-[2rem] shadow-md ring-1 ring-slate-200 border-t-2 border-[#002855]/20 overflow-hidden flex flex-col h-full hover:shadow-2xl hover:ring-blue-500/30 transition-all duration-300 group print:break-inside-avoid">
      {/* Header do Card */}
      <div className="p-4 md:p-6 pb-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-slate-900 uppercase tracking-tighter truncate text-sm md:text-base lg:text-lg group-hover:text-[#002855] transition-colors">
              {customer.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[80px] md:max-w-[120px]">
                {customer.taxId ? customer.taxId : 'S/ DOC'}
              </span>
              {lastSaleDate && (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0"></span>
                  <span className="text-[8px] md:text-[9px] font-bold text-slate-500 uppercase">
                    Última: {new Date(lastSaleDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex gap-1 shrink-0 ml-2 print:hidden">
            <button onClick={() => onEditCustomer(customer)} className="p-1.5 md:p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><UsersIcon className="w-4 h-4" /></button>
            <button onClick={() => { if (window.confirm(`Excluir permanentemente o cliente ${customer.name}?`)) onDeleteCustomer(customer.id); }} className="p-1.5 md:p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><TrashIcon className="w-4 h-4" /></button>
          </div>
        </div>

        {customer.contactPerson && (
          <div className="bg-slate-50 rounded-xl p-2 md:p-3 mb-3 ring-1 ring-slate-100">
            <p className="text-[8px] md:text-[9px] font-bold text-slate-600 flex items-center gap-2 uppercase truncate">
              <UsersIcon className="w-3 h-3 text-blue-500 shrink-0" /> {customer.contactPerson}
            </p>
          </div>
        )}
      </div>

      {/* Tabela de Vendas Rápida */}
      <div className="flex-1 overflow-y-auto max-h-[350px] scrollbar-hide border-y border-slate-100 bg-slate-50/30">
        <table className="w-full text-left table-fixed">
          <tbody className="divide-y divide-slate-100">
            {customer.entries.map((entry) => {
              const currentPaid = entry.isPaid ? entry.total : (entry.paidAmount || 0);
              const isPartial = currentPaid > 0 && currentPaid < entry.total;
              const isFull = entry.isPaid;
              const isExpanded = expandedEntry === entry.id;

              return (
                <React.Fragment key={entry.id}>
                  <tr className={`hover:bg-white transition-colors ${isExpanded ? 'bg-blue-50/50' : ''}`}>
                    <td className="py-2.5 px-3 md:px-4 w-[55%]">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <button 
                          onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}
                          className={`shrink-0 w-5 h-5 rounded-md flex items-center justify-center transition-all ${isExpanded ? 'bg-[#002855] text-white' : 'bg-white ring-1 ring-slate-200 text-slate-400 hover:text-blue-500'}`}
                        >
                          <ChartIcon className="w-3 h-3" />
                        </button>
                        <div className="truncate">
                          <p className="text-[9px] md:text-[10px] font-black text-slate-700 uppercase leading-none truncate">{entry.productName}</p>
                          <p className="text-[7px] md:text-[8px] font-bold text-slate-400 mt-1 uppercase">
                            {entry.weightKg}Kg • {new Date(entry.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-1 text-right w-[20%]">
                      <span className={`font-mono text-[9px] md:text-[10px] font-black block leading-none ${isFull ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {formatBRL(entry.total)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 md:px-4 text-right w-[25%] print:hidden">
                      <div className="flex items-center justify-end gap-1 md:gap-1.5">
                        {!isFull && (
                          <button 
                            onClick={() => onPartialPayment(customer.id, entry.id)}
                            className={`w-6 h-6 md:w-7 md:h-7 rounded-lg flex items-center justify-center transition-all ${isPartial ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-500'} hover:bg-amber-200`}
                          >
                            <span className="text-[10px] font-black">$</span>
                          </button>
                        )}
                        <button 
                          onClick={() => onTogglePayment(customer.id, entry.id)}
                          className={`w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center transition-all ${
                            isFull ? 'bg-emerald-500 text-white shadow-sm ring-1 ring-emerald-400' : 'bg-slate-200 text-slate-400'
                          }`}
                        >
                          {isFull ? <CheckIcon className="w-3 md:w-3.5 h-3 md:h-3.5" /> : <ClockIcon className="w-3 md:w-3.5 h-3 md:h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {isExpanded && (
                    <tr className="bg-white">
                      <td colSpan={3} className="px-3 py-4">
                        <div className="bg-slate-50 rounded-2xl p-4 ring-1 ring-slate-200 shadow-inner space-y-4">
                          <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                            <div>
                               <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Status Fluxo</p>
                               <p className={`text-[10px] font-black uppercase ${isFull ? 'text-emerald-600' : 'text-amber-600'}`}>
                                 {isFull ? 'Liquidado' : isPartial ? 'Parcial' : 'Em Aberto'}
                               </p>
                            </div>
                            <div className="text-right">
                               <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Saldo Devedor</p>
                               <p className="text-[11px] font-black text-slate-900 font-mono">{formatBRL(entry.total - currentPaid)}</p>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <p className="text-[8px] font-black text-[#002855] uppercase tracking-widest">Timeline de Recebimentos</p>
                            <div className="relative pl-4 space-y-3 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[1.5px] before:bg-slate-200">
                              <div className="relative">
                                <div className="absolute -left-[13px] top-1 w-2.5 h-2.5 rounded-full bg-slate-300 ring-2 ring-white"></div>
                                <div className="flex justify-between items-center">
                                  <span className="text-[9px] font-bold text-slate-500 uppercase">Lançamento</span>
                                  <span className="text-[9px] font-mono text-slate-400">{new Date(entry.date).toLocaleDateString('pt-BR')}</span>
                                </div>
                              </div>

                              {entry.paymentHistory?.map((pay, pidx) => (
                                <div key={pidx} className="relative">
                                  <div className="absolute -left-[13px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-black text-emerald-600 uppercase">Recebido</span>
                                    <div className="text-right">
                                      <p className="text-[9px] font-black text-emerald-600 font-mono">+{formatBRL(pay.amount)}</p>
                                      <p className="text-[7px] font-bold text-slate-400 uppercase">{new Date(pay.date).toLocaleDateString('pt-BR')}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}

                              {isFull && (
                                <div className="relative">
                                  <div className="absolute -left-[13px] top-1 w-2.5 h-2.5 rounded-full bg-[#002855] ring-2 ring-white"></div>
                                  <div className="flex justify-between items-center bg-blue-100/50 p-2 rounded-lg border border-blue-200">
                                    <span className="text-[9px] font-black text-[#002855] uppercase italic">Finalizado em</span>
                                    <span className="text-[10px] font-black text-[#002855] font-mono">
                                      {entry.paidAt ? new Date(entry.paidAt).toLocaleDateString('pt-BR') : 'BAIXA'}
                                    </span>
                                  </div>
                                </div>
                              )}
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

      {/* Footer com Totais (Elevado) */}
      <div className="p-4 md:p-6 bg-white border-t border-slate-100 mt-auto">
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-slate-50 p-3 rounded-xl ring-1 ring-slate-100 shadow-sm">
            <p className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase mb-1">Pago</p>
            <p className="text-[11px] md:text-sm font-black text-emerald-600 truncate font-mono">{formatBRL(totalPaid)}</p>
          </div>
          <div className={`p-3 rounded-xl ring-1 transition-all ${totalPending > 0 ? 'bg-amber-50 ring-amber-200' : 'bg-slate-50 ring-slate-100 shadow-sm'}`}>
            <p className="text-[7px] md:text-[8px] font-black text-amber-600 uppercase mb-1">Pendente</p>
            <p className="text-[11px] md:text-sm font-black text-amber-700 truncate font-mono">{formatBRL(totalPending)}</p>
          </div>
        </div>
        
        <button 
          onClick={() => onAddEntry(customer.id)} 
          className="w-full bg-[#002855] text-white font-black py-4 rounded-xl shadow-lg hover:shadow-blue-900/20 active:scale-95 transition-all flex items-center justify-center gap-2 border border-yellow-500/20 print:hidden"
        >
          <PlusIcon className="w-4 h-4 text-yellow-400" /> LANÇAR VENDA
        </button>
      </div>
    </div>
  );
};

export default CustomerCard;
