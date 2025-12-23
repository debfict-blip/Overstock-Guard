
import React, { useState } from 'react';
import { db } from '../db';
import { CATEGORIES } from '../types';
import { CalendarIcon, NoSymbolIcon } from '@heroicons/react/24/outline';

interface Props {
  onAdded: () => void;
}

const AddItemView: React.FC<Props> = ({ onAdded }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [qty, setQty] = useState(1);
  const [par, setPar] = useState(1);
  const [hasExpiry, setHasExpiry] = useState(true);
  
  const defaultExpiry = new Date();
  defaultExpiry.setDate(defaultExpiry.getDate() + 7);
  const [expiry, setExpiry] = useState(defaultExpiry.toISOString().split('T')[0]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    await db.addItem({
      id: crypto.randomUUID(),
      name,
      category,
      quantity: qty,
      parLevel: par,
      expiryDate: hasExpiry ? expiry : undefined,
      createdAt: Date.now()
    });
    onAdded();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-12">
      <div className="space-y-6">
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Item Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full text-3xl font-bold bg-transparent border-b-2 border-slate-100 focus:border-slate-900 outline-none pb-2 transition-colors placeholder:text-slate-200"
            placeholder="e.g. Whole Milk"
            required
            autoFocus
          />
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Category</label>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`flex-none px-4 py-2.5 rounded-2xl text-sm font-bold border-2 transition-all flex items-center gap-2 ${
                  category === cat.id 
                    ? 'bg-slate-900 border-slate-900 text-white shadow-md' 
                    : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
                }`}
              >
                <span>{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Quantity</label>
            <div className="flex items-center gap-4">
              <button 
                type="button" 
                onClick={() => setQty(Math.max(0, qty - 1))}
                className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center font-bold text-slate-900"
              >-</button>
              <input
                type="number"
                value={qty}
                onChange={e => setQty(parseInt(e.target.value) || 0)}
                className="w-full text-center text-xl font-black bg-transparent border-none outline-none"
              />
              <button 
                type="button" 
                onClick={() => setQty(qty + 1)}
                className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center font-bold text-slate-900"
              >+</button>
            </div>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 text-center">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Par Level</label>
            <input
              type="number"
              value={par}
              min="0"
              onChange={e => setPar(parseInt(e.target.value) || 0)}
              className="w-full text-center text-xl font-black bg-transparent border-none outline-none"
            />
            <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Restock Trigger</p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Expiry Settings</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setHasExpiry(true)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all border-2 ${
                hasExpiry 
                  ? 'bg-white border-slate-900 text-slate-900 shadow-sm' 
                  : 'bg-slate-50 border-transparent text-slate-400'
              }`}
            >
              <CalendarIcon className="w-5 h-5" />
              Track Expiry
            </button>
            <button
              type="button"
              onClick={() => setHasExpiry(false)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all border-2 ${
                !hasExpiry 
                  ? 'bg-white border-slate-900 text-slate-900 shadow-sm' 
                  : 'bg-slate-50 border-transparent text-slate-400'
              }`}
            >
              <NoSymbolIcon className="w-5 h-5" />
              No Expiry
            </button>
          </div>

          {hasExpiry && (
            <input
              type="date"
              value={expiry}
              onChange={e => setExpiry(e.target.value)}
              className="w-full text-lg font-bold bg-slate-50 p-4 rounded-3xl border border-slate-100 outline-none focus:ring-2 focus:ring-slate-900/5 transition-all animate-in fade-in zoom-in-95 duration-200"
            />
          )}
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-slate-900 text-white py-6 rounded-3xl text-xl font-black shadow-2xl active:scale-[0.98] transition-all mt-4"
      >
        Add to Stock
      </button>
    </form>
  );
};

export default AddItemView;
