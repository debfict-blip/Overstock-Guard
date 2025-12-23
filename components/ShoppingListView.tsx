
import React from 'react';
import { InventoryItem, ItemStatus } from '../types';
import { calculateStatus } from '../statusUtils';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';

interface Props {
  items: InventoryItem[];
}

const ShoppingListView: React.FC<Props> = ({ items }) => {
  const needsRestock = items.filter(item => {
    const status = calculateStatus(item);
    return status === ItemStatus.RED || status === ItemStatus.YELLOW;
  });

  if (needsRestock.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-12">
        <div className="w-20 h-20 bg-emerald-50 rounded-full mb-4 flex items-center justify-center text-emerald-600">
          <CheckBadgeIcon className="w-10 h-10" />
        </div>
        <p className="text-lg font-medium">Full Stock!</p>
        <p className="text-sm">No items need restocking right now.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2 pb-12">
      <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
        <p className="text-sm font-medium text-blue-800">
          Auto-generated based on your par levels and expiry dates.
        </p>
      </div>
      
      <div className="space-y-1">
        {needsRestock.map(item => {
          const status = calculateStatus(item);
          return (
            <div key={item.id} className="group flex items-center justify-between py-4 border-b border-slate-100 last:border-0">
              <div className="flex items-center gap-4">
                <input type="checkbox" className="w-6 h-6 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500" />
                <div>
                  <h4 className="font-bold text-slate-900">{item.name}</h4>
                  <p className="text-[11px] font-bold text-slate-400">
                    {status === ItemStatus.RED ? 'OUT OF STOCK / EXPIRED' : 'RUNNING LOW'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-900">Need: {Math.max(1, item.parLevel - item.quantity + 1)}</p>
                <p className="text-[10px] text-slate-400">Current: {item.quantity}</p>
              </div>
            </div>
          );
        })}
      </div>

      <button className="w-full mt-6 flex items-center justify-center gap-2 text-blue-600 font-bold py-3 hover:bg-blue-50 rounded-xl transition-colors">
        Export to Notes
      </button>
    </div>
  );
};

export default ShoppingListView;
