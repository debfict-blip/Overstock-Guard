
import React, { useState, useMemo, useEffect } from 'react';
import { ItemStatus } from '../types.js';
import { calculateStatus } from '../statusUtils.js';
import { db } from '../db.js';
import { CheckBadgeIcon, ShoppingBagIcon } from '@heroicons/react/24/solid';

const ShoppingListView = ({ items, onUpdate }) => {
  const [checked, setChecked] = useState(new Set());

  const isExpired = (item) => {
    if (!item.expiryDate) return false;
    return new Date(item.expiryDate).getTime() <= Date.now();
  };

  const isCriticalStock = (item) => {
    return item.quantity < item.parLevel;
  };

  const { expiredItems, criticalStockItems, lowStockItems } = useMemo(() => {
    const expired = [];
    const critical = [];
    const low = [];

    items.forEach(item => {
      const status = calculateStatus(item);
      if (isExpired(item)) {
        expired.push(item);
      } else if (isCriticalStock(item)) {
        critical.push(item);
      } else if (status === ItemStatus.YELLOW) {
        low.push(item);
      }
    });

    return {
      expiredItems: expired.sort((a, b) => a.name.localeCompare(b.name)),
      criticalStockItems: critical.sort((a, b) => a.name.localeCompare(b.name)),
      lowStockItems: low.sort((a, b) => a.name.localeCompare(b.name))
    };
  }, [items]);

  useEffect(() => {
    if (checked.size === 0) {
      const autoChecked = new Set();
      expiredItems.forEach(i => autoChecked.add(i.id));
      criticalStockItems.forEach(i => autoChecked.add(i.id));
      if (autoChecked.size > 0) setChecked(autoChecked);
    }
  }, [expiredItems, criticalStockItems]);

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

  const totalItems = expiredItems.length + criticalStockItems.length + lowStockItems.length;

  if (totalItems === 0) return (
    <div className="h-[60vh] flex flex-col items-center justify-center text-center opacity-30">
      <CheckBadgeIcon className="w-12 h-12 mb-4" />
      <p className="font-black uppercase text-[10px]">Everything Stocked</p>
    </div>
  );

  const renderItem = (item, label, labelColor) => (
    <div key={item.id} onClick={() => toggleCheck(item.id)} className={`flex items-center gap-4 p-5 cursor-pointer ${checked.has(item.id) ? 'bg-slate-50 opacity-50' : ''}`}>
      <div className={`w-6 h-6 rounded-lg border-2 ${checked.has(item.id) ? 'bg-slate-900 border-slate-900' : 'border-slate-200'}`} />
      <div className="flex-1">
        <h4 className={`font-black uppercase tracking-tighter ${checked.has(item.id) ? 'line-through' : ''}`}>{item.name}</h4>
        <p className={`text-[9px] uppercase font-black ${labelColor}`}>
          {label} (Need: {item.parLevel - item.quantity})
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pt-2 pb-32">
      {expiredItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase text-red-600 tracking-widest px-2">⚠️ Expired - Replace</p>
          <div className="bg-white rounded-[2rem] border divide-y overflow-hidden shadow-sm border-red-50">
            {expiredItems.map(item => renderItem(item, 'Expired', 'text-red-600'))}
          </div>
        </div>
      )}
      {criticalStockItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase text-red-400 tracking-widest px-2">Critical Alerts</p>
          <div className="bg-white rounded-[2rem] border divide-y overflow-hidden shadow-sm">
            {criticalStockItems.map(item => renderItem(item, 'Critical', 'text-red-400'))}
          </div>
        </div>
      )}
      {lowStockItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest px-2">Low Stock</p>
          <div className="bg-white rounded-[2rem] border divide-y overflow-hidden shadow-sm">
            {lowStockItems.map(item => renderItem(item, 'Low Stock', 'text-amber-500'))}
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
