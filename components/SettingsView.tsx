
import React, { useState, useEffect } from 'react';
import { InventoryItem, SyncStatus } from '../types.ts';
import { db } from '../db.ts';
import { 
  ArrowDownTrayIcon, 
  ShareIcon, 
  CloudArrowUpIcon,
  UserCircleIcon,
  KeyIcon,
  CheckIcon,
  QuestionMarkCircleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

interface Props {
  items: InventoryItem[];
  syncStatus: SyncStatus;
  onSync: () => void;
  onSignIn: () => void;
}

const SettingsView: React.FC<Props> = ({ items, syncStatus, onSync, onSignIn }) => {
  const [clientId, setClientId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

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

  const exportToJson = () => {
    const dataStr = JSON.stringify(items, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `kitchen-guard-backup-${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const shareData = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Kitchen Guard Backup',
          text: JSON.stringify(items),
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      exportToJson();
    }
  };

  return (
    <div className="space-y-6 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Security Warning Banner */}
      <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
        <ShieldCheckIcon className="absolute right-[-20px] top-[-20px] w-48 h-48 opacity-10 rotate-12" />
        <h2 className="text-xl font-black uppercase tracking-widest mb-2 italic">Data Security</h2>
        <p className="text-xs text-slate-400 font-medium leading-relaxed">
          Your inventory is saved locally on this device. **Warning:** Your data will be permanently lost if you clear your browser history/data or delete this page from your device. 
          Use the manual backup tools below to keep your data safe.
        </p>
      </div>

      {/* Configuration Section (Required for Google Sync) */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <h3 className="font-black uppercase tracking-widest text-[10px] mb-4 flex items-center gap-2 text-slate-400">
          <KeyIcon className="w-4 h-4" />
          Sync Configuration
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-[9px] font-black uppercase tracking-widest mb-2 opacity-40">Google OAuth Client ID</label>
            <div className="flex gap-2">
              <input 
                type="password"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="00000000-xxxx.apps.googleusercontent.com"
                className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-slate-900/5 outline-none text-slate-900"
              />
              <button 
                onClick={saveConfig}
                disabled={isSaving}
                className="bg-slate-900 p-3 rounded-xl hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50 text-white"
              >
                {showSaved ? <CheckIcon className="w-5 h-5" /> : <ArrowDownTrayIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          <a 
            href="https://console.cloud.google.com/apis/credentials" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-500 transition-colors"
          >
            <QuestionMarkCircleIcon className="w-4 h-4" />
            How to create a Client ID?
          </a>
        </div>
      </div>

      {/* Cloud Sync Section */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
          <CloudArrowUpIcon className="w-4 h-4" />
          Google Drive Sync
        </h3>
        
        {syncStatus === SyncStatus.DISCONNECTED ? (
          <div className="text-center py-4">
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Securely backup your stock to your private Google Drive AppData folder.
            </p>
            <button 
              onClick={onSignIn}
              disabled={!clientId}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-30 disabled:grayscale"
            >
              <UserCircleIcon className="w-6 h-6" />
              Sign in with Google
            </button>
            {!clientId && <p className="text-[9px] font-black uppercase text-red-400 mt-4 tracking-widest">Enter Client ID Above First</p>}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl">
              <div>
                <p className="text-xs font-bold text-slate-900 uppercase">Status</p>
                <p className="text-sm text-slate-500">
                  {syncStatus === SyncStatus.SYNCING ? 'Uploading...' : 
                   syncStatus === SyncStatus.SUCCESS ? 'Connected & Synced' : 
                   syncStatus === SyncStatus.ERROR ? 'Connection Error' : 'Ready'}
                </p>
              </div>
              <div className={`w-3 h-3 rounded-full ${
                syncStatus === SyncStatus.SUCCESS ? 'bg-emerald-500' :
                syncStatus === SyncStatus.SYNCING ? 'bg-amber-500 animate-pulse' :
                syncStatus === SyncStatus.ERROR ? 'bg-red-500' : 'bg-slate-300'
              }`} />
            </div>
            
            <button 
              onClick={onSync}
              disabled={syncStatus === SyncStatus.SYNCING}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold active:scale-[0.98] transition-all disabled:opacity-50"
            >
              Sync Now
            </button>
          </div>
        )}
      </div>

      {/* Manual Export Section */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs mb-4">Manual Backup</h3>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          Export your local inventory to a JSON file for manual storage.
        </p>
        
        <div className="space-y-3">
          <button 
            onClick={exportToJson}
            className="w-full flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:border-slate-300 transition-colors font-bold text-slate-900 group"
          >
            <div className="flex items-center gap-3">
              <ArrowDownTrayIcon className="w-5 h-5 text-slate-400 group-hover:text-slate-900" />
              <span>Export as JSON</span>
            </div>
            <span className="text-[10px] text-slate-400 uppercase">.json</span>
          </button>

          <button 
            onClick={shareData}
            className="w-full flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:border-slate-300 transition-colors font-bold text-slate-900 group"
          >
            <div className="flex items-center gap-3">
              <ShareIcon className="w-5 h-5 text-slate-400 group-hover:text-slate-900" />
              <span>Share Raw Data</span>
            </div>
          </button>
        </div>
      </div>

      <div className="text-center pt-8 opacity-20">
        <p className="text-[10px] font-black uppercase tracking-widest">Kitchen Guard v1.2.0</p>
      </div>
    </div>
  );
};

export default SettingsView;
