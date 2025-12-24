
import React, { useState, useEffect } from 'react';
import { SyncStatus } from '../types.js';
import { db } from '../db.js';
import { ArrowDownTrayIcon, KeyIcon, CloudArrowUpIcon, CheckIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const SettingsView = ({ items, syncStatus, onSync, onSignIn }) => {
  const [clientId, setClientId] = useState('');
  useEffect(() => { db.getClientId().then(id => id && setClientId(id)); }, []);

  const saveConfig = async () => {
    await db.saveClientId(clientId);
    alert("Saved!");
  };

  return (
    <div className="space-y-6 pt-4">
      {/* Security Warning Banner */}
      <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden">
        <ShieldCheckIcon className="absolute right-[-20px] top-[-20px] w-48 h-48 opacity-10 rotate-12" />
        <h2 className="text-xl font-black uppercase tracking-widest mb-2 italic">Data Security</h2>
        <p className="text-xs text-slate-400 font-medium leading-relaxed">
          Your inventory is saved locally on this device. **Warning:** Your data will be permanently lost if you clear your browser history/data or delete this page from your device. 
          Use the manual backup tools below to keep your data safe.
        </p>
      </div>

      <div className="bg-slate-900 text-white p-6 rounded-[2rem]">
        <h3 className="text-[10px] font-black uppercase mb-4 opacity-50 flex items-center gap-2"><KeyIcon className="w-4 h-4"/> Config</h3>
        <input type="password" value={clientId} onChange={e => setClientId(e.target.value)} placeholder="Google Client ID" className="w-full bg-slate-800 p-3 rounded-xl text-sm mb-2 outline-none" />
        <button onClick={saveConfig} className="bg-blue-600 w-full p-3 rounded-xl font-bold">Save Client ID</button>
      </div>
      <div className="bg-white p-6 rounded-3xl border">
        <h3 className="font-black text-xs mb-4 uppercase flex items-center gap-2"><CloudArrowUpIcon className="w-4 h-4"/> Cloud Sync</h3>
        {syncStatus === SyncStatus.DISCONNECTED ? (
          <button onClick={onSignIn} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold">Sign in with Google</button>
        ) : (
          <button onClick={onSync} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold">Sync Now</button>
        )}
      </div>
    </div>
  );
};

export default SettingsView;
