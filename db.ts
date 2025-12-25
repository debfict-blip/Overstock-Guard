
import { get, set } from 'idb-keyval';
import { InventoryItem, Category } from './types';

const STORAGE_KEY = 'kitchen_guard_inventory_idb';
const CATEGORY_KEY = 'kitchen_guard_categories_idb';

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'pantry', name: 'Pantry', icon: '🥫' },
  { id: 'dairy', name: 'Dairy', icon: '🥛' },
  { id: 'produce', name: 'Produce', icon: '🍎' },
  { id: 'meat', name: 'Meat', icon: '🥩' },
  { id: 'freezer', name: 'Freezer', icon: '🧊' },
  { id: 'household', name: 'Household', icon: '🧹' },
  { id: 'personal_care', name: 'Personal Care', icon: '🧴' },
  { id: 'hygiene', name: 'Hygiene Products', icon: '🧼' }
];

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

  // Dynamic Categories
  getCategories: async (): Promise<Category[]> => {
    const data = await get<Category[]>(CATEGORY_KEY);
    if (!data || data.length === 0) {
      await set(CATEGORY_KEY, DEFAULT_CATEGORIES);
      return DEFAULT_CATEGORIES;
    }
    return data;
  },

  saveCategories: async (categories: Category[]) => {
    await set(CATEGORY_KEY, categories);
  },

  getClientId: async (): Promise<string | null> => {
    const id = await get<string>('kitchen_guard_client_id');
    return id || null;
  },

  saveClientId: async (id: string) => {
    await set('kitchen_guard_client_id', id);
  }
};
