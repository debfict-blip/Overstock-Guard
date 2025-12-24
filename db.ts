
import { get, set } from 'idb-keyval';
import { InventoryItem } from './types';

const STORAGE_KEY = 'kitchen_guard_inventory_idb';

export const db = {
  getItems: async (): Promise<InventoryItem[]> => {
    const data = await get<InventoryItem[]>(STORAGE_KEY);
    return data || [];
  },

  saveItems: async (items: InventoryItem[]) => {
    await set(STORAGE_KEY, items);
  },

  addItem: async (item: InventoryItem) => {
    const items = await db.getItems();
    const newItem = { ...item, lastModified: Date.now() };
    await db.saveItems([...items, newItem]);
  },

  updateItem: async (id: string, updates: Partial<InventoryItem>) => {
    const items = await db.getItems();
    const updated = items.map(item => 
      item.id === id ? { ...item, ...updates, lastModified: Date.now() } : item
    );
    await db.saveItems(updated);
  },

  deleteItem: async (id: string) => {
    const items = await db.getItems();
    await db.saveItems(items.filter(i => i.id !== id));
  },

  // Fix: Added getClientId to support sync configuration in SettingsView
  getClientId: async (): Promise<string | null> => {
    const id = await get<string>('kitchen_guard_client_id');
    return id || null;
  },

  // Fix: Added saveClientId to support sync configuration in SettingsView
  saveClientId: async (id: string) => {
    await set('kitchen_guard_client_id', id);
  }
};