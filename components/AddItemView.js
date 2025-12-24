
import React, { useState } from 'react';
import { db } from '../db.js';
import { CATEGORIES } from '../types.js';
import { CalendarIcon, NoSymbolIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

const AddItemView = ({ onAdded }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [qty, setQty] = useState(1);
  const [par, setPar] = useState(1);
  const [hasExpiry, setHasExpiry] = useState(true);
  const [expiry, setExpiry] = useState(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);

  const handleSubmit = async (e) => {
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
    <form onSubmit={handleSubmit} className="space-y-8 pt-4 pb-12">
      <div className="space-y-6">
        <div>
          <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Item Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full text-3xl font-bold bg-transparent border-b-2 border-slate-100 outline-none pb-2 placeholder:text-slate-200" placeholder="e.g. Whole Milk" required autoFocus />
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase text-slate-400 mb-3">Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-slate-50 border p-4 rounded-3xl text-lg font-bold">
            {CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-3xl text-center">
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Quantity</label>
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => setQty(Math.max(0, qty-1))} className="w-8 h-8 rounded-full bg-white">-</button>
              <span className="font-black text-xl">{qty}</span>
              <button type="button" onClick={() => setQty(qty+1)} className="w-8 h-8 rounded-full bg-white">+</button>
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-3xl text-center">
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Par Level</label>
            <input type="number" value={par} onChange={e => setPar(parseInt(e.target.value)||0)} className="w-full text-center text-xl font-black bg-transparent border-none outline-none" />
          </div>
        </div>
        <div className="space-y-3">
          <label className="block text-[10px] font-black uppercase text-slate-400">Expiry</label>
          <div className="flex gap-2">
            <button type="button" onClick={() => setHasExpiry(true)} className={`flex-1 py-3 rounded-2xl font-bold ${hasExpiry ? 'bg-slate-900 text-white' : 'bg-slate-50'}`}>Track</button>
            <button type="button" onClick={() => setHasExpiry(false)} className={`flex-1 py-3 rounded-2xl font-bold ${!hasExpiry ? 'bg-slate-900 text-white' : 'bg-slate-50'}`}>None</button>
          </div>
          {hasExpiry && <input type="date" value={expiry} onChange={e => setExpiry(e.target.value)} className="w-full bg-slate-50 p-4 rounded-3xl font-bold outline-none" />}
        </div>
      </div>
      <button type="submit" className="w-full bg-slate-900 text-white py-6 rounded-3xl text-xl font-black shadow-lg">Add to Stock</button>
    </form>
  );
};

export default AddItemView;
