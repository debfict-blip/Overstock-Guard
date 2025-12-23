
import React from 'react';
import { InventoryItem, CATEGORIES } from '../types';
import { db } from '../db';
import { calculateStatus, getStatusColor } from '../statusUtils';
import { MinusIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/solid';
import { ArchiveBoxIcon, CalendarIcon } from '@heroicons/react/24/outline';

interface Props {
  items: InventoryItem[];
  onUpdate: () => void;
}

const InventoryView: React.FC<Props> = ({ items, onUpdate }) => {
  const adjustQty = async (id: string, delta: number) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const newQty = Math.max(0, item.quantity + delta);
    await db.updateItem(id, { quantity: newQty });
    onUpdate();
  };

  const deleteItem = async (id: string) => {
    if (confirm('Remove item from stock?')) {
      await db.deleteItem(id);
      onUpdate();
    }
  };

  if (items.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-20">
        <div className="w-20 h-20 bg-slate-100 rounded-full mb-4 flex items-center justify-center">
          <ArchiveBoxIcon className="w-10 h-10" />
        </div>
        <p className="text-lg font-medium">Your pantry is empty</p>
        <p className="text-sm">Tap '+' to track your first item</p>
      </div>
    );
  }

  // Grouping logic
  const itemsByCategory = CATEGORIES.reduce((acc, cat) => {
    const catItems = items
      .filter(i => i.category === cat.id)
      .sort((a, b) => {
        const order = { RED: 0, YELLOW: 1, GREEN: 2 };
        return order[calculateStatus(a)] - order[calculateStatus(b)];
      });
    
    if (catItems.length > 0) {
      acc[cat.id] = catItems;
    }
    return acc;
  }, {} as Record<string, InventoryItem[]>);

  const uncategorized = items.filter(i => !CATEGORIES.find(c => c.id === i.category));
  if (uncategorized.length > 0) {
    itemsByCategory['other'] = uncategorized;
  }

  return (
    <div className="space-y-8 pt-2">
      {Object.entries(itemsByCategory).map(([catId, catItems]) => {
        const category = CATEGORIES.find(c => c.id === catId) || { name: 'Other', icon: '📦' };
        
        return (
          <section key={catId} className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <span>{category.icon}</span>
                {category.name}
                <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-bold">
                  {catItems.length}
                </span>
              </h2>
            </div>

            <div className="space-y-3">
              {catItems.map(item => {
                const status = calculateStatus(item);
                const color = getStatusColor(status);
                const isExpired = item.expiryDate && new Date(item.expiryDate) < new Date();

                return (
                  <div key={item.id} className="bg-white border border-slate-100 shadow-sm rounded-2xl p-4 flex items-center gap-4 transition-all active:scale-[0.98]">
                    <div className={`w-1.5 h-10 rounded-full ${color} shrink-0`} />

                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 leading-tight truncate">{item.name}</h3>
                      {item.expiryDate ? (
                        <p className={`text-[10px] font-bold mt-0.5 flex items-center gap-1 ${isExpired ? 'text-red-500' : 'text-slate-400'}`}>
                          <CalendarIcon className="w-3 h-3" />
                          {isExpired ? 'EXPIRED' : `EXP: ${new Date(item.expiryDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`}
                        </p>
                      ) : (
                        <p className="text-[10px] font-bold mt-0.5 text-slate-300 uppercase tracking-tighter">No expiry set</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-1.5 py-1 rounded-xl">
                      <button 
                        onClick={(e) => { e.stopPropagation(); adjustQty(item.id, -1); }}
                        className="p-1 hover:text-red-600 transition-colors"
                      >
                        <MinusIcon className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); adjustQty(item.id, 1); }}
                        className="p-1 hover:text-emerald-600 transition-colors"
                      >
                        <PlusIcon className="w-4 h-4" />
                      </button>
                    </div>

                    <button 
                      onClick={() => deleteItem(item.id)}
                      className="text-slate-200 hover:text-red-400 p-1"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default InventoryView;
