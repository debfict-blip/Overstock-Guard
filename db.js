
import { get, set } from 'idb-keyval';

const STORAGE_KEY = 'kitchen_guard_inventory_idb';
const CONFIG_KEY = 'kitchen_guard_config';

export const db = {
  getItems: async () => {
    const data = await get(STORAGE_KEY);
    return data || [];
  },

  saveItems: async (items) => {
    await set(STORAGE_KEY, items);
  },

  addItem: async (item) => {
    const items = await db.getItems();
    const newItem = { ...item, lastModified: Date.now() };
    await db.saveItems([...items, newItem]);
  },

  updateItem: async (id, updates) => {
    const items = await db.getItems();
    const updated = items.map(item => 
      item.id === id ? { ...item, ...updates, lastModified: Date.now() } : item
    );
    await db.saveItems(updated);
  },

  deleteItem: async (id) => {
    const items = await db.getItems();
    await db.saveItems(items.filter(i => i.id !== id));
  },

  getClientId: async () => {
    const config = await get(CONFIG_KEY);
    return config?.googleClientId || null;
  },

  saveClientId: async (id) => {
    const config = (await get(CONFIG_KEY)) || {};
    await set(CONFIG_KEY, { ...config, googleClientId: id });
  }
};
