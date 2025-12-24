
export const ItemStatus = {
  RED: 'RED',
  YELLOW: 'YELLOW',
  GREEN: 'GREEN'
};

// Added SyncStatus to fix missing export error in JS version
export const SyncStatus = {
  DISCONNECTED: 'DISCONNECTED',
  IDLE: 'IDLE',
  SYNCING: 'SYNCING',
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR'
};

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