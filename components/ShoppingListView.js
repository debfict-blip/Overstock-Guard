
import React, { useState } from 'react';
import { ItemStatus } from '../types.js';
import { calculateStatus } from '../statusUtils.js';
import { db } from '../db.js';
import { CheckBadgeIcon, ShoppingBagIcon } from '@heroicons/react/24/solid';

const ShoppingListView = ({ items, onUpdate }) => {
  const [checked, setChecked] = useState(new Set());
  const toggleCheck = (id) => {
    const next = new Set(checked);
    if (next.has(id)) next.delete(id); else next.add(id);
    setChecked(next);
  };

  const handleRestock = async () => {
    for (const id of checked) {
      const item = items.find(i => i.id === id);
      if (item) await db.updateItem(id, { quantity: item.parLevel });
    }
    setChecked(new Set());
    onUpdate();
  };

  const needsRestock = items.filter(i => {
    const s = calculateStatus(i);
    return s === ItemStatus.RED || s === ItemStatus.YELLOW;
  });

  if (needsRestock.length === 0) return (
    <div className="h-[60vh] flex flex-col items-center justify-center text-center opacity-30">
      <CheckBadgeIcon className="w-12 h-12 mb-4" />
      <p className="font-black uppercase text-[10px]">Everything Stocked</p>
    </div>
  );

  return (
    <div className="space-y-6 pt-2 pb-12">
      <div className="bg-white rounded-[2rem] border divide-y overflow-hidden">
        {needsRestock.map(item => (
          <div key={item.id} onClick={() => toggleCheck(item.id)} className={`flex items-center gap-4 p-5 cursor-pointer ${checked.has(item.id) ? 'bg-slate-50 opacity-50' : ''}`}>
            <div className={`w-6 h-6 rounded-lg border-2 ${checked.has(item.id) ? 'bg-slate-900 border-slate-900' : 'border-slate-200'}`} />
            <div className="flex-1">
              <h4 className="font-black uppercase tracking-tighter">{item.name}</h4>
              <p className="text-[9px] uppercase font-bold text-slate-400">Need: {item.parLevel - item.quantity}</p>
            </div>
          </div>
        ))}
      </div>
      {checked.size > 0 && <button onClick={handleRestock} className="w-full py-6 bg-emerald-500 text-white font-black rounded-3xl shadow-lg">Restock {checked.size}</button>}
    </div>
  );
};

export default ShoppingListView;
