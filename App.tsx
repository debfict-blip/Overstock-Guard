
import React, { useState, useEffect, useMemo } from 'react';
import { ViewType, InventoryItem, SyncStatus, ItemStatus } from './types';
import { db } from './db';
import { SyncService } from './services/syncService';
import { calculateStatus } from './statusUtils';
import InventoryView from './components/InventoryView';
import AddItemView from './components/AddItemView';
import ShoppingListView from './components/ShoppingListView';
import SettingsView from './components/SettingsView';
import { 
  ArchiveBoxIcon, 
  PlusCircleIcon, 
  ShoppingCartIcon,
  Cog6ToothIcon,
  CloudIcon,
  CloudArrowUpIcon,
  ExclamationCircleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('inventory');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(SyncStatus.DISCONNECTED);

  const refreshItems = async () => {
    const data = await db.getItems();
    setItems(data);
    setIsLoading(false);
  };

  useEffect(() => {
    refreshItems();
    // Initialize sync slightly delayed to allow UI to settle
    setTimeout(async () => {
      try {
        await SyncService.initialize((token) => {
          if (token) {
            setSyncStatus(SyncStatus.IDLE);
            triggerSync();
          }
        });
      } catch (e) {
        console.warn('Sync service init skipped');
      }
    }, 1500);
  }, []);

  const triggerSync = async () => {
    setSyncStatus(SyncStatus.SYNCING);
    try {
      await SyncService.syncWithDrive();
      await refreshItems();
      setSyncStatus(SyncStatus.SUCCESS);
      setTimeout(() => setSyncStatus(SyncStatus.IDLE), 3000);
    } catch (error) {
      setSyncStatus(SyncStatus.ERROR);
    }
  };

  // Stats for the Dashboard
  const stats = useMemo(() => {
    return items.reduce((acc, item) => {
      const status = calculateStatus(item);
      if (status === ItemStatus.RED) acc.critical++;
      if (status === ItemStatus.YELLOW) acc.warning++;
      return acc;
    }, { critical: 0, warning: 0, total: items.length });
  }, [items]);

  const getSyncIcon = () => {
    switch (syncStatus) {
      case SyncStatus.SYNCING: return <CloudArrowUpIcon className="w-5 h-5 text-amber-500 animate-bounce" />;
      case SyncStatus.SUCCESS: return <CloudIcon className="w-5 h-5 text-emerald-500" />;
      case SyncStatus.ERROR: return <ExclamationCircleIcon className="w-5 h-5 text-red-500" />;
      default: return <CloudIcon className="w-5 h-5 text-slate-200" />;
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-slate-50 shadow-2xl overflow-hidden border-x border-slate-200">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 bg-white border-b border-slate-100 shadow-sm z-20">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 p-2 rounded-xl rotate-3">
              <ArchiveBoxIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tighter text-slate-900 uppercase italic leading-none">Guard</h1>
                {getSyncIcon()}
              </div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">Kitchen Inventory</p>
            </div>
          </div>
          <button onClick={() => setActiveView('settings')} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400">
            <Cog6ToothIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Dashboard Summary (Always visible in inventory view) */}
        {activeView === 'inventory' && (
          <div className="flex gap-2">
            <div className="flex-1 bg-red-50 border border-red-100 p-3 rounded-2xl flex flex-col items-center">
              <span className="text-red-600 text-xl font-black">{stats.critical}</span>
              <span className="text-[8px] font-black uppercase text-red-400">Critical</span>
            </div>
            <div className="flex-1 bg-amber-50 border border-amber-100 p-3 rounded-2xl flex flex-col items-center">
              <span className="text-amber-600 text-xl font-black">{stats.warning}</span>
              <span className="text-[8px] font-black uppercase text-amber-400">Low Stock</span>
            </div>
            <div className="flex-1 bg-slate-50 border border-slate-100 p-3 rounded-2xl flex flex-col items-center">
              <span className="text-slate-600 text-xl font-black">{stats.total}</span>
              <span className="text-[8px] font-black uppercase text-slate-400">Total Items</span>
            </div>
          </div>
        )}
        
        {activeView !== 'inventory' && (
           <div className="py-2">
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter italic">
                {activeView === 'add' ? 'New Item Entry' : 
                 activeView === 'shopping' ? 'Shopping List' : 'System Settings'}
              </h2>
           </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-6 pb-32 no-scrollbar">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full opacity-30">
            <div className="w-12 h-12 border-4 border-slate-900/10 border-t-slate-900 rounded-full animate-spin mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest">Loading Stock...</p>
          </div>
        ) : (
          renderView()
        )}
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-md border-t border-slate-100 px-10 py-6 flex justify-between items-center safe-bottom z-20">
        <button onClick={() => setActiveView('inventory')} className={`flex flex-col items-center gap-1.5 transition-all ${activeView === 'inventory' ? 'text-slate-900 scale-110' : 'text-slate-300 hover:text-slate-500'}`}>
          <ChartBarIcon className="w-7 h-7 stroke-[2]" />
          <span className="text-[8px] font-black uppercase tracking-widest">Stock</span>
        </button>

        <button onClick={() => setActiveView('add')} className="relative -mt-14 transition-transform active:scale-95 group">
          <div className="bg-slate-900 text-white p-5 rounded-[2.5rem] shadow-2xl border-[6px] border-slate-50 group-hover:bg-slate-800 transition-colors">
            <PlusCircleIcon className="w-10 h-10" />
          </div>
        </button>

        <button onClick={() => setActiveView('shopping')} className={`flex flex-col items-center gap-1.5 transition-all ${activeView === 'shopping' ? 'text-slate-900 scale-110' : 'text-slate-300 hover:text-slate-500'}`}>
          <ShoppingCartIcon className="w-7 h-7 stroke-[2]" />
          <span className="text-[8px] font-black uppercase tracking-widest">Buy</span>
        </button>
      </nav>
    </div>
  );

  function renderView() {
    switch (activeView) {
      case 'inventory': return <InventoryView items={items} onUpdate={refreshItems} />;
      case 'add': return <AddItemView onAdded={() => { refreshItems(); setActiveView('inventory'); triggerSync(); }} />;
      case 'shopping': return <ShoppingListView items={items} />;
      case 'settings': return <SettingsView items={items} syncStatus={syncStatus} onSync={triggerSync} onSignIn={() => SyncService.signIn()} />;
      default: return <InventoryView items={items} onUpdate={refreshItems} />;
    }
  }
};

export default App;
