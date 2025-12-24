
export enum ItemStatus {
  RED = 'RED',
  YELLOW = 'YELLOW',
  GREEN = 'GREEN'
}

// Added SyncStatus enum to fix missing export error
export enum SyncStatus {
  DISCONNECTED = 'DISCONNECTED',
  IDLE = 'IDLE',
  SYNCING = 'SYNCING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  parLevel: number;
  expiryDate?: string; // Optional ISO String
  createdAt: number;
  lastModified?: number; // Added for sync resolution
}

export type ViewType = 'inventory' | 'add' | 'shopping' | 'settings';

export const CATEGORIES = [
  { id: 'pantry', name: 'Pantry', icon: '🥫' },
  { id: 'dairy', name: 'Dairy', icon: '🥛' },
  { id: 'produce', name: 'Produce', icon: '🍎' },
  { id: 'meat', name: 'Meat', icon: '🥩' },
  { id: 'freezer', name: 'Freezer', icon: '🧊' },
  { id: 'household', name: 'Household', icon: '🧹' },
  { id: 'personal_care', name: 'Personal Care', icon: '🧴' },
  { id: 'hygiene', name: 'Hygiene Products', icon: '🧼' }
];