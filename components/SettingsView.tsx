import React, { useState, useEffect } from 'react';
import { InventoryItem, SyncStatus, Category } from '../types.ts';
import { db } from '../db.ts';
import { 
  ArrowDownTrayIcon, 
  ShareIcon, 
  CloudArrowUpIcon,
  UserCircleIcon,
  KeyIcon,
  CheckIcon,
  QuestionMarkCircleIcon,
  ShieldCheckIcon,
  PlusIcon,
  TrashIcon,
  SwatchIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';

interface Props {
  items: InventoryItem[];
  categories: Category[];
  onUpdateCategories: (newCats: Category[]) => void;
  syncStatus: SyncStatus;
  onSync: () => void;
  onSignIn: () => void;
}

const EMOJI_OPTIONS = [
  '🥫', '🥛', '🍎', '🥩', '🧊', '🧹', '🧴', '🧼', '📦', '🥚', 
  '🍞', '🧀', '🍗', '🐟', '🥗', '🍕', '🧁', '🍷', '🍺', '☕',
  '🧻', '💊', '🔋', '🕯️', '🛠️', '🌱', '🐕', '🐈', '👶', '🛀',
  '🧂', '🍳', '🥄', '🥢', '🥡', '🍫', '🥨', '🥜', '🥞'
];

const SettingsView: React.FC<Props> = ({ items, categories, onUpdateCategories, syncStatus, onSync, onSignIn }) => {
  const [clientId, setClientId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [isCategoryArchitectOpen, setIsCategoryArchitectOpen] = useState(false);
  
  // Category form state
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('📦');
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null); // 'new' or catId

  useEffect(() => {
    db.getClientId().then(id => {
      if (id) setClientId(id);
    });
  }, []);

  const saveConfig = async () => {
    setIsSaving(true);
    await db.saveClientId(clientId);
    setIsSaving(false);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  };

  const updateCategoryIcon = (id: string, icon: string) => {
    const next = categories.map(c => c.id === id ? { ...c, icon } : c);
    onUpdateCategories(next);
  };

  const addCategory = () => {
    if (!newCatName.trim()) return;
    const newCat: Category = {
      id: newCatName.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now(),
      name: newCatName.trim(),
      icon: newCatIcon || '📦'
    };
    onUpdateCategories([...categories, newCat]);
    setNewCatName('');
    setNewCatIcon('📦');
  };

  const removeCategory = (id: string) => {
    if (categories.length <= 1) {
      alert("At least one category is required.");
      return;
    }
    const hasItems = items.some(i => i.category === id);
    if (hasItems) {
      if (!confirm("This category contains items. They will be visible but grouped differently. Proceed?")) return;
    }
    onUpdateCategories(categories.filter(c => c.id !== id));
  };

  const exportToJson = () => {
    const dataStr = JSON.stringify({ items, categories }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `kitchen-guard-backup-${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="space-y-8 pt-4 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-300 relative">
      
      {/* Category Management */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm relative">
        <button 
          onClick={() => setIsCategoryArchitectOpen(!isCategoryArchitectOpen)}
          className="w-full flex items-center justify-between text-left group focus:outline-none"
        >
          <h3 className="font-black text-slate-900 uppercase tracking-widest text-[10px] flex items-center gap-2">
            <SwatchIcon className="w-4 h-4 text-slate-400" />
            Category Architect
          </h3>
          {isCategoryArchitectOpen ? (
            <ChevronUpIcon className="w-4 h-4 text-slate-300 group-hover:text-slate-900 transition-colors" />
          ) : (
            <ChevronDownIcon className="w-4 h-4 text-slate-300 group-hover:text-slate-900 transition-colors" />
          )}
        </button>
        
        {isCategoryArchitectOpen && (
          <div className="mt-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="space-y-3 mb-6">
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between bg-slate-50 p-2.5 pl-3 rounded-2xl border border-slate-100 group">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setShowEmojiPicker(cat.id)}
                      className="text-xl w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm border border-slate-100 active:scale-95 transition-transform hover:bg-slate-50"
                      title="Change Icon"
                    >
                      {cat.icon}
                    </button>
                    <span className="font-bold text-slate-900 text-sm uppercase tracking-tight">{cat.name}</span>
                  </div>
                  <button 
                    onClick={() => removeCategory(cat.id)}
                    className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="bg-slate-50 p-4 rounded-3xl border border-dashed border-slate-200">
              <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">Add New Category</label>
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => setShowEmojiPicker('new')}
                  className="w-12 text-center bg-white border border-slate-100 rounded-xl py-3 text-xl shadow-sm active:scale-95 transition-transform"
                  title="Pick Icon"
                >
                  {newCatIcon}
                </button>
                <input 
                  type="text" 
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="flex-1 bg-white border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-slate-900/5 outline-none"
                  placeholder="Category Name"
                  onKeyPress={(e) => e.key === 'Enter' && addCategory()}
                />
                <button 
                  onClick={addCategory}
                  className="bg-slate-900 text-white p-3 rounded-xl active:scale-95 transition-transform"
                >
                  <PlusIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floating Emoji Picker Modal */}
        {showEmojiPicker && (
          <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-md flex items-center justify-center p-4 rounded-[2.5rem] animate-in fade-in duration-200">
            <div className="bg-white w-full border border-slate-200 rounded-[2rem] p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pick an Icon</span>
                <button 
                  onClick={() => setShowEmojiPicker(null)} 
                  className="p-1.5 text-slate-300 hover:text-slate-900 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6"/>
                </button>
              </div>
              <div className="grid grid-cols-5 gap-3 max-h-64 overflow-y-auto no-scrollbar pr-1">
                {EMOJI_OPTIONS.map(emoji => (
                  <button 
                    key={emoji}
                    onClick={() => {
                      if (showEmojiPicker === 'new') {
                        setNewCatIcon(emoji);
                      } else {
                        updateCategoryIcon(showEmojiPicker, emoji);
                      }
                      setShowEmojiPicker(null);
                    }}
                    className="text-3xl p-3 hover:bg-slate-50 rounded-2xl transition-all active:scale-75 flex items-center justify-center"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cloud Sync Section */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <h3 className="font-black text-slate-900 uppercase tracking-widest text-[10px] mb-6 flex items-center gap-2">
          <CloudArrowUpIcon className="w-4 h-4 text-slate-400" />
          Google Drive Sync
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-[9px] font-black uppercase tracking-widest mb-2 opacity-40">Client ID</label>
            <div className="flex gap-2">
              <input 
                type="password"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="apps.googleusercontent.com"
                className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-[10px] font-mono outline-none"
              />
              <button 
                onClick={saveConfig}
                className="bg-slate-900 p-3 rounded-xl text-white shadow-lg active:scale-95 transition-transform"
              >
                {showSaved ? <CheckIcon className="w-5 h-5" /> : <ArrowDownTrayIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          <button 
            onClick={syncStatus === SyncStatus.DISCONNECTED ? onSignIn : onSync}
            disabled={syncStatus === SyncStatus.SYNCING || !clientId}
            className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all ${
              syncStatus === SyncStatus.DISCONNECTED ? 'bg-blue-600 text-white' : 'bg-slate-900 text-white'
            } disabled:opacity-30`}
          >
            {syncStatus === SyncStatus.SYNCING ? 'Syncing...' : syncStatus === SyncStatus.DISCONNECTED ? 'Connect Drive' : 'Sync Now'}
          </button>
        </div>
      </div>

      {/* Data Portability */}
      <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
        <ShieldCheckIcon className="absolute right-[-20px] top-[-20px] w-48 h-48 opacity-10 rotate-12" />
        <h2 className="text-xl font-black uppercase tracking-widest mb-2 italic">Data Security</h2>
        <p className="text-xs text-slate-400 font-medium leading-relaxed mb-6">
          Your inventory is local. Use backups to prevent data loss.
        </p>
        <button 
          onClick={exportToJson}
          className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-md py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 transition-colors shadow-sm border border-white/5"
        >
          <ShareIcon className="w-4 h-4" />
          Export All Data (.JSON)
        </button>
      </div>

      <div className="text-center pt-4 opacity-20">
        <p className="text-[10px] font-black uppercase tracking-widest">Kitchen Guard v2.1.2</p>
      </div>
    </div>
  );
};

export default SettingsView;