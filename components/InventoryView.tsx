
import React, { useState } from 'react';
import { InventoryItem, Category } from '../types.ts';
import { db } from '../db.ts';
import { calculateStatus, getStatusColor } from '../statusUtils.ts';
import { MinusIcon, PlusIcon, TrashIcon, ChevronRightIcon, ChevronDownIcon, PencilIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { ArchiveBoxIcon, CalendarIcon } from '@heroicons/react/24/outline';

interface Props {
  items: InventoryItem[];
  categories: Category[];
  onUpdate: () => void;
  requestConfirm?: (title: string, message: string, onConfirm: () => void) => void;
}

const InventoryView: React.FC<Props> = ({ items, categories, onUpdate, requestConfirm }) => {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const toggleCategory = (id: string) => {
    setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const adjustQty = async (id: string, delta: number) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const newQty = Math.max(0, item.quantity + delta);
    await db.updateItem(id, { quantity: newQty });
    onUpdate();
  };

  const deleteItem = async (item: InventoryItem) => {
    const performDelete = async () => {
      await db.deleteItem(item.id);
      onUpdate();
    };

    if (requestConfirm) {
      requestConfirm("Delete Item?", `Permanently remove ${item.name}?`, performDelete);
    } else {
      if (confirm('Delete this record?')) {
        performDelete();
      }
    }
  };

  if (items.length === 0) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center px-10 animate-in fade-in duration-500">
        <div className="w-24 h-24 bg-slate-50 rounded-full mb-6 flex items-center justify-center border-2 border-slate-100 border-dashed">
          <ArchiveBoxIcon className="w-10 h-10 text-slate-200" />
        </div>
        <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2 uppercase">Stock is Empty</h3>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-loose">Tap the '+' button below to start tracking.</p>
      </div>
    );
  }

  // Create groupings. Include a group for items whose category might have been deleted.
  const itemsByCategory = items.reduce((acc, item) => {
    const catId = item.category;
    if (!acc[catId]) acc[catId] = [];
    acc[catId].push(item);
    return acc;
  }, {} as Record<string, InventoryItem[]>);

  // Sorting: Categories in the order they appear in settings, plus any orphaned items at the bottom
  const sortedCategoryIds = [
    ...categories.map(c => c.id),
    ...Object.keys(itemsByCategory).filter(id => !categories.find(c => c.id === id))
  ];

  return (
    <div className="space-y-8 pb-32 pt-2">
      {sortedCategoryIds.map(catId => {
        const catItems = itemsByCategory[catId];
        if (!catItems || catItems.length === 0) return null;

        const category = categories.find(c => c.id === catId);
        const isCollapsed = collapsed[catId];

        return (
          <section key={catId} className="space-y-4">
            <button 
              onClick={() => toggleCategory(catId)}
              className="w-full flex items-center justify-between group px-1"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{category?.icon || '📦'}</span>
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
                  {category?.name || 'Uncategorized'}
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
                    <div key={item.id} className="relative group overflow-hidden bg-white border border-slate-100 rounded-[1.8rem] p-4 flex items-center gap-4 transition-all hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98]">
                      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${color}`} />
                      
                      <div className="flex-1 min-w-0 ml-1">
                        <h3 className="font-black text-slate-900 text-lg leading-tight truncate uppercase tracking-tighter">
                          {item.name}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          {item.expiryDate ? (
                            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${isExpired ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-400'}`}>
                              <CalendarIcon className="w-3 h-3" />
                              {new Date(item.expiryDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </div>
                          ) : (
                            <span className="text-[9px] font-black text-slate-200 uppercase">Perpetual</span>
                          )}
                          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Par: {item.parLevel}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-2xl border border-slate-100">
                        <button 
                          onClick={(e) => { e.stopPropagation(); adjustQty(item.id, -1); }}
                          className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <MinusIcon className="w-4 h-4" />
                        </button>
                        <div className="w-8 text-center">
                          <span className="text-sm font-black text-slate-900">{item.quantity}</span>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); adjustQty(item.id, 1); }}
                          className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-emerald-500 transition-colors"
                        >
                          <PlusIcon className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setEditingItem(item); }}
                          className="p-2 text-slate-200 hover:text-slate-900 transition-colors"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteItem(item); }}
                          className="p-2 text-slate-200 hover:text-red-400 transition-colors"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}

      {editingItem && (
        <EditModal 
          item={editingItem} 
          categories={categories}
          onClose={() => setEditingItem(null)} 
          onSave={async (updates) => {
            await db.updateItem(editingItem.id, updates);
            onUpdate();
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
};

const EditModal: React.FC<{ item: InventoryItem; categories: Category[]; onClose: () => void; onSave: (updates: Partial<InventoryItem>) => void }> = ({ item, categories, onClose, onSave }) => {
  const [name, setName] = useState(item.name);
  const [category, setCategory] = useState(item.category);
  const [par, setPar] = useState(item.parLevel);
  const [expiry, setExpiry] = useState(item.expiryDate || '');

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-black uppercase tracking-tighter italic text-slate-900">Edit Details</h3>
          <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-900"><XMarkIcon size={24}/></button>
        </div>
        
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 focus-within:ring-2 ring-slate-200 transition-all">
            <label className="text-[9px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-transparent font-bold outline-none text-lg text-slate-900" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
              <label className="text-[9px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Category</label>
              <select 
                value={category} 
                onChange={e => setCategory(e.target.value)} 
                className="w-full bg-transparent font-bold outline-none text-sm appearance-none text-slate-900"
              >
                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                {!categories.find(c => c.id === category) && <option value={category}>Orphaned</option>}
              </select>
            </div>
            <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
              <label className="text-[9px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Par Level</label>
              <input type="number" value={par} onChange={e => setPar(parseInt(e.target.value)||0)} className="w-full bg-transparent font-bold outline-none text-sm text-slate-900" />
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
            <label className="text-[9px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Expiry</label>
            <input type="date" value={expiry} onChange={e => setExpiry(e.target.value)} className="w-full bg-transparent font-bold outline-none text-sm text-slate-900" />
          </div>
        </div>

        <button 
          onClick={() => onSave({ name, category, parLevel: par, expiryDate: expiry || undefined })}
          className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black uppercase tracking-widest text-sm shadow-xl active:scale-95 transition-transform"
        >
          Confirm Update
        </button>
      </div>
    </div>
  );
};

export default InventoryView;
