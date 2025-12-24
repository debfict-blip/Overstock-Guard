
import React, { useState, useMemo, useEffect } from 'react';
import { ItemStatus } from '../types.js';
import { calculateStatus } from '../statusUtils.js';
import { db } from '../db.js';
import { CheckBadgeIcon, ShoppingBagIcon } from '@heroicons/react/24/solid';

const ShoppingListView = ({ items, onUpdate }) => {
  const [checked, setChecked] = useState(new Set());
  
  const shoppingList = useMemo(() => {
    return items.filter(i => {
      const s = calculateStatus(i);
      return s === ItemStatus.RED || s === ItemStatus.YELLOW;
    }).sort((a, b) => {
      const sA = calculateStatus(a);
      const sB = calculateStatus(b);
      return sA === ItemStatus.RED ? -1 : 1;
    });
  }, [items]);

  useEffect(() => {
    const alerts = shoppingList.filter(i => calculateStatus(i) === ItemStatus.RED);
    if (alerts.length > 0 && checked.size === 0) {
      setChecked(new Set(alerts.map(i => i.id)));
    }
  }, [shoppingList]);

  const toggleCheck = (id) => {
    const next = new Set(checked);
    if (next.has(id)) next.delete(id); else next.add(id);
    setChecked(next);
  };

  const handleRestock = async () => {
    const currentItems = await db.getItems();
    const updatedItems = currentItems.map(item => {
      if (checked.has(item.id)) {
        return {
          ...item,
          quantity: Math.max(item.quantity, item.parLevel) + 1,
          expiryDate: undefined,
          lastModified: Date.now()
        };
      }
      return item;
    });

    await db.saveItems(updatedItems);
    setChecked(new Set());
    onUpdate();
  };

  if (shoppingList.length === 0) return (
    <div className="h-[60vh] flex flex-col items-center justify-center text-center opacity-30">
      <CheckBadgeIcon className="w-12 h-12 mb-4" />
      <p className="font-black uppercase text-[10px]">Everything Stocked</p>
    </div>
  );

  const alertItems = shoppingList.filter(i => calculateStatus(i) === ItemStatus.RED);
  const otherItems = shoppingList.filter(i => calculateStatus(i) === ItemStatus.YELLOW);

  const renderItem = (item) => (
    <div key={item.id} onClick={() => toggleCheck(item.id)} className={`flex items-center gap-4 p-5 cursor-pointer ${checked.has(item.id) ? 'bg-slate-50 opacity-50' : ''}`}>
      <div className={`w-6 h-6 rounded-lg border-2 ${checked.has(item.id) ? 'bg-slate-900 border-slate-900' : 'border-slate-200'}`} />
      <div className="flex-1">
        <h4 className={`font-black uppercase tracking-tighter ${checked.has(item.id) ? 'line-through' : ''}`}>{item.name}</h4>
        <p className={`text-[9px] uppercase font-bold ${calculateStatus(item) === ItemStatus.RED ? 'text-red-400' : 'text-slate-400'}`}>
          Need: {item.parLevel - item.quantity}
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pt-2 pb-32">
      {alertItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase text-red-400 tracking-widest px-2">Critical Alerts</p>
          <div className="bg-white rounded-[2rem] border divide-y overflow-hidden shadow-sm">
            {alertItems.map(renderItem)}
          </div>
        </div>
      )}
      {otherItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest px-2">Low Stock</p>
          <div className="bg-white rounded-[2rem] border divide-y overflow-hidden shadow-sm">
            {otherItems.map(renderItem)}
          </div>
        </div>
      )}
      {checked.size > 0 && (
        <div className="fixed bottom-24 left-6 right-6">
          <button onClick={handleRestock} className="w-full py-6 bg-slate-900 text-white font-black rounded-3xl shadow-2xl flex items-center justify-center gap-2">
            <ShoppingBagIcon className="w-5 h-5"/> Buy Selected ({checked.size})
          </button>
        </div>
      )}
    </div>
  );
};

export default ShoppingListView;
