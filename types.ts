
export enum ItemStatus {
  RED = 'RED',
  YELLOW = 'YELLOW',
  GREEN = 'GREEN'
}

export enum SyncStatus {
  DISCONNECTED = 'DISCONNECTED',
  IDLE = 'IDLE',
  SYNCING = 'SYNCING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  parLevel: number;
  expiryDate?: string; 
  createdAt: number;
  lastModified?: number;
}

export type ViewType = 'inventory' | 'add' | 'shopping' | 'settings';
