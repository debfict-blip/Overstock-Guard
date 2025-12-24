
import { get, set } from 'idb-keyval';

const STORAGE_KEY = 'kitchen_guard_inventory_idb';

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

  // Fix: Added getClientId to support sync configuration in JS version
  getClientId: async () => {
    const id = await get('kitchen_guard_client_id');
    return id || null;
  },

  // Fix: Added saveClientId to support sync configuration in JS version
  saveClientId: async (id) => {
    await set('kitchen_guard_client_id', id);
  }
};