
import React, { useState } from 'react';
import { CATEGORIES } from '../types.js';
import { db } from '../db.js';
import { calculateStatus, getStatusColor } from '../statusUtils.js';
import { MinusIcon, PlusIcon, TrashIcon, ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/24/solid';
import { ArchiveBoxIcon, CalendarIcon } from '@heroicons/react/24/outline';

const InventoryView = ({ items, onUpdate }) => {
  const [collapsed, setCollapsed] = useState({});

  const toggleCategory = (id) => {
    setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const adjustQty = async (id, delta) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const newQty = Math.max(0, item.quantity + delta);
    await db.updateItem(id, { quantity: newQty });
    onUpdate();
  };

  const deleteItem = async (id) => {
    if (confirm('Delete this record?')) {
      await db.deleteItem(id);
      onUpdate();
    }
  };

  if (items.length === 0) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center px-10">
        <div className="w-24 h-24 bg-slate-50 rounded-full mb-6 flex items-center justify-center border-2 border-slate-100 border-dashed">
          <ArchiveBoxIcon className="w-10 h-10 text-slate-200" />
        </div>
        <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2 uppercase">Stock is Empty</h3>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-loose">Tap the '+' button below to start tracking.</p>
      </div>
    );
  }

  const itemsByCategory = CATEGORIES.reduce((acc, cat) => {
    const catItems = items.filter(i => i.category === cat.id);
    if (catItems.length > 0) acc[cat.id] = catItems;
    return acc;
  }, {});

  return (
    <div className="space-y-8 pb-12">
      {Object.entries(itemsByCategory).map(([catId, catItems]) => {
        const category = CATEGORIES.find(c => c.id === catId);
        const isCollapsed = collapsed[catId];

        return (
          <section key={catId} className="space-y-4">
            <button 
              onClick={() => toggleCategory(catId)}
              className="w-full flex items-center justify-between group"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{category.icon}</span>
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
                  {category.name}
                  <span className="ml-2 bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-full text-[8px] tracking-normal">{catItems.length}</span>
                </h2>
              </div>
              {isCollapsed ? (
                <ChevronRightIcon className="w-3 h-3 text-slate-200 group-hover:text-slate-400" />
              ) : (
                <ChevronDownIcon className="w-3 h-3 text-slate-200 group-hover:text-slate-400" />
              )}
            </button>

            {!isCollapsed && (
              <div className="grid gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                {catItems.map(item => {
                  const status = calculateStatus(item);
                  const color = getStatusColor(status);
                  const isExpired = item.expiryDate && new Date(item.expiryDate) < new Date();
                  return (
                    <div key={item.id} className="relative group overflow-hidden bg-white border border-slate-100 rounded-3xl p-4 flex items-center gap-4 transition-all">
                      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${color}`} />
                      <div className="flex-1 min-w-0 ml-1">
                        <h3 className="font-black text-slate-900 text-lg truncate uppercase tracking-tighter">{item.name}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          {item.expiryDate ? (
                            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${isExpired ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-400'}`}>
                              <CalendarIcon className="w-3 h-3" />
                              {new Date(item.expiryDate).toLocaleDateString()}
                            </div>
                          ) : <span className="text-[9px] font-black text-slate-200 uppercase">Perpetual</span>}
                          <span className="text-[9px] font-black text-slate-300 uppercase">Par: {item.parLevel}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-2xl">
                        <button onClick={(e) => { e.stopPropagation(); adjustQty(item.id, -1); }} className="p-2 text-slate-400 hover:text-red-500"><MinusIcon className="w-4 h-4" /></button>
                        <span className="w-6 text-center font-black">{item.quantity}</span>
                        <button onClick={(e) => { e.stopPropagation(); adjustQty(item.id, 1); }} className="p-2 text-slate-400 hover:text-emerald-500"><PlusIcon className="w-4 h-4" /></button>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }} className="p-2 text-slate-200 hover:text-red-400 opacity-0 group-hover:opacity-100"><TrashIcon className="w-5 h-5" /></button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
};

export default InventoryView;
