
import { get, set } from 'idb-keyval';
import { InventoryItem } from './types';

const STORAGE_KEY = 'kitchen_guard_inventory_idb';
const CONFIG_KEY = 'kitchen_guard_config';

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

  // Config helpers
  getClientId: async (): Promise<string | null> => {
    const config = await get<{ googleClientId?: string }>(CONFIG_KEY);
    return config?.googleClientId || null;
  },

  saveClientId: async (id: string) => {
    const config = (await get<{ googleClientId?: string }>(CONFIG_KEY)) || {};
    await set(CONFIG_KEY, { ...config, googleClientId: id });
  }
};
