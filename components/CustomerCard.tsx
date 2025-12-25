
import React from 'react';
import { Customer } from '../types';
import { TrashIcon, PlusIcon, CheckIcon, ClockIcon, UsersIcon } from './Icons';

interface CustomerCardProps {
  customer: Customer;
  onAddEntry: (customerId: string) => void;
  onDeleteEntry: (customerId: string, entryId: string) => void;
  onTogglePayment: (customerId: string, entryId: string) => void;
  onDeleteCustomer: (customerId: string) => void;
  onEditCustomer: (customer: Customer) => void;
}

const CustomerCard: React.FC<CustomerCardProps> = ({ 
  customer, 
  onAddEntry, 
  onDeleteEntry,
  onTogglePayment,
  onDeleteCustomer,
  onEditCustomer
}) => {
  const totalPaid = customer.entries.filter(e => e.isPaid).reduce((acc, e) => acc + Number(e.total), 0);
  const totalPending = customer.entries.filter(e => !e.isPaid).reduce((acc, e) => acc + Number(e.total), 0);
  const lastSaleDate = customer.entries.length > 0 ? customer.entries[0].date : null;

  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-500 group">
      {/* Header do Card */}
      <div className="p-6 pb-4">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-slate-900 uppercase tracking-tighter truncate text-lg group-hover:text-blue-700 transition-colors">
              {customer.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {customer.taxId ? `DOC: ${customer.taxId}` : 'SEM DOCUMENTO'}
              </span>
              {lastSaleDate && (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Última: {new Date(lastSaleDate).toLocaleDateString('pt-BR')}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            <button 
              onClick={() => onEditCustomer(customer)}
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
              title="Editar Cadastro"
            >
              <UsersIcon className="w-4 h-4" />
            </button>
            <button 
              onClick={() => {
                if (window.confirm(`Excluir permanentemente o cliente ${customer.name}?`)) onDeleteCustomer(customer.id);
              }}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              title="Excluir Cliente"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Info Box */}
        {(customer.contactPerson || customer.address) && (
          <div className="bg-slate-50 rounded-2xl p-4 mb-4 space-y-2 border border-slate-100">
            {customer.contactPerson && (
              <p className="text-[10px] font-bold text-slate-600 flex items-center gap-2 uppercase">
                <UsersIcon className="w-3 h-3 text-blue-500" /> {customer.contactPerson}
              </p>
            )}
            {customer.address && (
              <p className="text-[9px] font-medium text-slate-400 uppercase line-clamp-1 italic">
                {customer.address}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Tabela de Vendas Rápida */}
      <div className="flex-1 overflow-y-auto max-h-[180px] scrollbar-hide border-y border-slate-50">
        <table className="w-full text-left">
          <tbody className="divide-y divide-slate-50">
            {customer.entries.map((entry) => (
              <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors group/row">
                <td className="py-3 px-6">
                  <p className="text-[10px] font-black text-slate-700 uppercase leading-none">{entry.productName}</p>
                  <p className="text-[8px] font-bold text-slate-400 mt-1">{entry.weightKg}Kg • {new Date(entry.date).toLocaleDateString('pt-BR')}</p>
                </td>
                <td className="py-3 px-2 text-right">
                  <span className={`font-mono text-[11px] font-black ${entry.isPaid ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                    {entry.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </td>
                <td className="py-3 px-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => onDeleteEntry(customer.id, entry.id)}
                      className="w-6 h-6 rounded-lg flex items-center justify-center opacity-0 group-hover/row:opacity-100 text-slate-300 hover:text-red-500 transition-all"
                      title="Excluir Lançamento"
                    >
                      <TrashIcon className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={() => onTogglePayment(customer.id, entry.id)}
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        entry.isPaid ? 'bg-emerald-500 text-white' : 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                      }`}
                    >
                      {entry.isPaid ? <CheckIcon className="w-3 h-3" /> : <ClockIcon className="w-3 h-3" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {customer.entries.length === 0 && (
              <tr>
                <td colSpan={3} className="py-10 text-center">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Sem lançamentos</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer com Totais */}
      <div className="p-6 bg-slate-50/50">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-3 rounded-2xl border border-slate-100">
            <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Total Pago</p>
            <p className="text-sm font-black text-emerald-600">{totalPaid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          </div>
          <div className={`p-3 rounded-2xl border transition-all ${totalPending > 0 ? 'bg-amber-50 border-amber-200 shadow-sm shadow-amber-200/50' : 'bg-white border-slate-100'}`}>
            <p className="text-[8px] font-black text-amber-600 uppercase mb-1">Pendente</p>
            <p className="text-sm font-black text-amber-700">{totalPending.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          </div>
        </div>
        
        <button 
          onClick={() => onAddEntry(customer.id)}
          className="w-full bg-blue-900 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-900/20 uppercase text-[10px] tracking-widest hover:bg-blue-800 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <PlusIcon className="w-4 h-4 text-yellow-400" /> LANÇAR NOVA VENDA
        </button>
      </div>
    </div>
  );
};

export default CustomerCard;
