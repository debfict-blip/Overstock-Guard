
import React, { useState, useMemo, useEffect } from 'react';
import { InventoryItem, ItemStatus } from '../types.ts';
import { calculateStatus } from '../statusUtils.ts';
import { db } from '../db.ts';
import { CheckBadgeIcon, ShoppingBagIcon } from '@heroicons/react/24/solid';
import { ArchiveBoxArrowDownIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface Props {
  items: InventoryItem[];
  onUpdate: () => void;
}

const ShoppingListView: React.FC<Props> = ({ items, onUpdate }) => {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);

  const shoppingList = useMemo(() => {
    return items.filter(item => {
      const status = calculateStatus(item);
      return status === ItemStatus.RED || status === ItemStatus.YELLOW;
    }).sort((a, b) => {
      const statusA = calculateStatus(a);
      const statusB = calculateStatus(b);
      return statusA === ItemStatus.RED ? -1 : 1;
    });
  }, [items]);

  // Automatically check critical alert items when they enter the shopping list
  useEffect(() => {
    const alerts = shoppingList.filter(i => calculateStatus(i) === ItemStatus.RED);
    if (alerts.length > 0 && checked.size === 0) {
      setChecked(new Set(alerts.map(i => i.id)));
    }
  }, [shoppingList]);

  const toggleCheck = (id: string) => {
    const newChecked = new Set(checked);
    if (newChecked.has(id)) newChecked.delete(id);
    else newChecked.add(id);
    setChecked(newChecked);
  };

  const handleRestock = async () => {
    if (checked.size === 0 || isProcessing) return;
    
    setIsProcessing(true);
    try {
      // Atomic batch update to prevent race conditions
      const currentItems = await db.getItems();
      const updatedItems = currentItems.map(item => {
        if (checked.has(item.id)) {
          return {
            ...item,
            quantity: Math.max(item.quantity, item.parLevel) + 1,
            expiryDate: undefined, // Clear old expiry as we have new stock
            lastModified: Date.now()
          };
        }
        return item;
      });

      await db.saveItems(updatedItems);
      setChecked(new Set());
      await onUpdate();
    } catch (err) {
      console.error("Restock failed", err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (shoppingList.length === 0) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center px-10">
        <div className="w-24 h-24 bg-emerald-50 rounded-full mb-6 flex items-center justify-center">
          <CheckBadgeIcon className="w-12 h-12 text-emerald-400" />
        </div>
        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-2">Pantry Optimized</h3>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">All items are within par levels and fresh.</p>
      </div>
    );
  }

  const criticalItems = shoppingList.filter(i => calculateStatus(i) === ItemStatus.RED);
  const lowStockItems = shoppingList.filter(i => calculateStatus(i) === ItemStatus.YELLOW);

  return (
    <div className="space-y-6 pt-2 pb-32">
      <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden">
        <ArchiveBoxArrowDownIcon className="absolute right-[-10px] bottom-[-10px] w-32 h-32 opacity-10 rotate-12" />
        <h2 className="text-2xl font-black tracking-tighter uppercase mb-1">Buy List</h2>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">
          {criticalItems.length} Critical • {lowStockItems.length} Low
        </p>
      </div>
      
      {criticalItems.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500 px-2 flex items-center gap-2">
            <ExclamationTriangleIcon className="w-4 h-4" /> Critical Alerts
          </h3>
          <div className="bg-white rounded-[2rem] border border-slate-100 divide-y divide-slate-50 overflow-hidden shadow-sm">
            {criticalItems.map(item => renderItem(item))}
          </div>
        </div>
      )}

      {lowStockItems.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 px-2 flex items-center gap-2">
            Low Stock
          </h3>
          <div className="bg-white rounded-[2rem] border border-slate-100 divide-y divide-slate-50 overflow-hidden shadow-sm">
            {lowStockItems.map(item => renderItem(item))}
          </div>
        </div>
      )}

      {checked.size > 0 && (
        <div className="fixed bottom-24 left-6 right-6 max-sm mx-auto animate-in fade-in slide-in-from-bottom-4">
          <button 
            onClick={handleRestock}
            disabled={isProcessing}
            className="w-full py-6 rounded-3xl bg-slate-900 text-white font-black text-lg uppercase tracking-tighter shadow-2xl hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <ShoppingBagIcon className="w-6 h-6" />
            {isProcessing ? 'Updating Stock...' : `Buy Selected (${checked.size})`}
          </button>
        </div>
      )}
    </div>
  );

  function renderItem(item: InventoryItem) {
    const isChecked = checked.has(item.id);
    const deficit = Math.max(1, item.parLevel - item.quantity);
    const isAlert = calculateStatus(item) === ItemStatus.RED;

    return (
      <div 
        key={item.id} 
        onClick={() => toggleCheck(item.id)}
        className={`flex items-center gap-4 p-5 transition-all cursor-pointer ${isChecked ? 'bg-slate-50/50 grayscale opacity-60' : 'hover:bg-slate-50'}`}
      >
        <div className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all ${
          isChecked ? 'bg-slate-900 border-slate-900' : 'border-slate-200'
        }`}>
          {isChecked && <div className="w-2 h-2 bg-white rounded-sm rotate-45" />}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className={`font-black text-lg uppercase tracking-tighter leading-tight ${isChecked ? 'line-through text-slate-300' : 'text-slate-900'}`}>
            {item.name}
          </h4>
          <div className="flex items-center gap-2">
            <span className={`text-[9px] font-black uppercase tracking-widest ${isAlert ? 'text-red-500' : 'text-amber-500'}`}>
              {isAlert ? 'Critical' : 'Low Stock'}
            </span>
            <span className="text-slate-200">•</span>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              Stock: {item.quantity} / {item.parLevel}
            </span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xl font-black text-slate-900">+{deficit}</div>
          <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Needed</div>
        </div>
      </div>
    );
  }
};

export default ShoppingListView;
