
import React, { useState, useEffect } from 'react';
import { ViewType, InventoryItem, SyncStatus } from './types';
import { db } from './db';
import { SyncService } from './services/syncService';
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
  ExclamationCircleIcon
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
    
    // Initialize Sync Service
    const initSync = async () => {
      try {
        await SyncService.initialize((token) => {
          if (token) {
            setSyncStatus(SyncStatus.IDLE);
            triggerSync();
          }
        });
      } catch (e) {
        console.warn('Sync service failed to init (might be missing Client ID)');
      }
    };
    
    // Small delay to ensure Google scripts are loaded
    setTimeout(initSync, 1000);
  }, []);

  const triggerSync = async () => {
    setSyncStatus(SyncStatus.SYNCING);
    try {
      await SyncService.syncWithDrive();
      await refreshItems();
      setSyncStatus(SyncStatus.SUCCESS);
      // Reset to idle after 3 seconds
      setTimeout(() => setSyncStatus(SyncStatus.IDLE), 3000);
    } catch (error) {
      console.error('Sync error:', error);
      setSyncStatus(SyncStatus.ERROR);
    }
  };

  const renderView = () => {
    if (isLoading) return <div className="p-8 text-center animate-pulse">Loading Inventory...</div>;

    switch (activeView) {
      case 'inventory': return <InventoryView items={items} onUpdate={refreshItems} />;
      case 'add': return <AddItemView onAdded={() => { refreshItems(); setActiveView('inventory'); triggerSync(); }} />;
      case 'shopping': return <ShoppingListView items={items} />;
      case 'settings': return <SettingsView items={items} syncStatus={syncStatus} onSync={triggerSync} onSignIn={() => SyncService.signIn()} />;
      default: return <InventoryView items={items} onUpdate={refreshItems} />;
    }
  };

  const getSyncIcon = () => {
    switch (syncStatus) {
      case SyncStatus.SYNCING: return <CloudArrowUpIcon className="w-5 h-5 text-amber-500 animate-bounce" />;
      case SyncStatus.SUCCESS: return <CloudIcon className="w-5 h-5 text-emerald-500" />;
      case SyncStatus.ERROR: return <ExclamationCircleIcon className="w-5 h-5 text-red-500" />;
      case SyncStatus.DISCONNECTED: return <CloudIcon className="w-5 h-5 text-slate-200" />;
      default: return <CloudIcon className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-white shadow-xl overflow-hidden border-x border-slate-200">
      {/* Header */}
      <header className="px-6 pt-12 pb-4 bg-white sticky top-0 z-10 border-b border-slate-50">
        <div className="flex justify-between items-baseline">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-black tracking-tight text-slate-900">
                {activeView === 'inventory' && 'Stock'}
                {activeView === 'add' && 'New Item'}
                {activeView === 'shopping' && 'Buy List'}
                {activeView === 'settings' && 'Settings'}
              </h1>
              <div className="sync-indicator">
                {getSyncIcon()}
              </div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
              {activeView === 'inventory' && `${items.length} items`}
              {activeView === 'add' && 'Manual Entry'}
              {activeView === 'shopping' && 'Restock needs'}
              {activeView === 'settings' && 'Data & Backup'}
            </p>
          </div>
          {activeView !== 'settings' && (
            <button onClick={() => setActiveView('settings')} className="text-slate-400 p-2 hover:text-slate-900 transition-colors">
              <Cog6ToothIcon className="w-6 h-6" />
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-6 pb-32 no-scrollbar">
        {renderView()}
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-xl border-t border-slate-100 px-6 py-4 flex justify-between items-center safe-bottom z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
        <button 
          onClick={() => setActiveView('inventory')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeView === 'inventory' ? 'text-slate-900' : 'text-slate-300'}`}
        >
          <ArchiveBoxIcon className="w-7 h-7" />
          <span className="text-[9px] font-black uppercase tracking-widest">Inventory</span>
        </button>

        <button 
          onClick={() => setActiveView('add')}
          className={`flex flex-col items-center gap-1 transition-transform transform active:scale-90 ${activeView === 'add' ? 'text-blue-600' : 'text-slate-900'}`}
        >
          <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl -mt-10 mb-1 border-4 border-white">
            <PlusCircleIcon className="w-8 h-8" />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest">Add Item</span>
        </button>

        <button 
          onClick={() => setActiveView('shopping')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeView === 'shopping' ? 'text-slate-900' : 'text-slate-300'}`}
        >
          <ShoppingCartIcon className="w-7 h-7" />
          <span className="text-[9px] font-black uppercase tracking-widest">Shopping</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
