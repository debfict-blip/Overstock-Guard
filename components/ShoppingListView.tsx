
import React, { useState } from 'react';
import { InventoryItem, ItemStatus } from '../types';
import { calculateStatus } from '../statusUtils';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';
import { ArchiveBoxArrowDownIcon } from '@heroicons/react/24/outline';

interface Props {
  items: InventoryItem[];
}

const ShoppingListView: React.FC<Props> = ({ items }) => {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggleCheck = (id: string) => {
    const newChecked = new Set(checked);
    if (newChecked.has(id)) newChecked.delete(id);
    else newChecked.add(id);
    setChecked(newChecked);
  };

  const needsRestock = items.filter(item => {
    const status = calculateStatus(item);
    return status === ItemStatus.RED || status === ItemStatus.YELLOW;
  }).sort((a, b) => {
    const statusA = calculateStatus(a);
    const statusB = calculateStatus(b);
    return statusA === ItemStatus.RED ? -1 : 1;
  });

  if (needsRestock.length === 0) {
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

  return (
    <div className="space-y-6 pt-2 pb-12">
      <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden">
        <ArchiveBoxArrowDownIcon className="absolute right-[-10px] bottom-[-10px] w-32 h-32 opacity-10 rotate-12" />
        <h2 className="text-2xl font-black tracking-tighter uppercase mb-1">Store Ready</h2>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">
          {needsRestock.length} Items flagged for restock
        </p>
      </div>
      
      <div className="bg-white rounded-[2rem] border border-slate-100 divide-y divide-slate-50 overflow-hidden">
        {needsRestock.map(item => {
          const status = calculateStatus(item);
          const isChecked = checked.has(item.id);
          const deficit = Math.max(1, item.parLevel - item.quantity);

          return (
            <div 
              key={item.id} 
              onClick={() => toggleCheck(item.id)}
              className={`flex items-center gap-4 p-5 transition-all cursor-pointer ${isChecked ? 'bg-slate-50/50 grayscale' : 'hover:bg-slate-50'}`}
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
                  <span className={`text-[9px] font-black uppercase tracking-widest ${status === ItemStatus.RED ? 'text-red-500' : 'text-amber-500'}`}>
                    {status === ItemStatus.RED ? 'Critical' : 'Low Stock'}
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
        })}
      </div>

      {checked.size > 0 && (
        <button 
          onClick={() => {
            if(confirm('Clear checked items? (Note: This currently only visual)')) setChecked(new Set());
          }}
          className="w-full py-5 rounded-3xl bg-slate-50 text-slate-400 font-black text-xs uppercase tracking-[0.3em] hover:bg-slate-100 transition-colors"
        >
          Clear Checked ({checked.size})
        </button>
      )}
    </div>
  );
};

export default ShoppingListView;
