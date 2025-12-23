
import { InventoryItem, ItemStatus } from './types';

export const calculateStatus = (item: InventoryItem): ItemStatus => {
  const { expiryDate, quantity, parLevel } = item;

  // 1. High Priority RED: Out of stock/Below Par
  if (quantity < parLevel) {
    return ItemStatus.RED;
  }

  // 2. High Priority RED: Expired (if date exists)
  if (expiryDate) {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return ItemStatus.RED;
    }

    // YELLOW: Expiring within 3 days
    if (diffDays <= 3) {
      return ItemStatus.YELLOW;
    }
  }

  // 3. Medium Priority YELLOW: At Par Level
  if (quantity === parLevel) {
    return ItemStatus.YELLOW;
  }

  // GREEN: Healthy stock and distant/no expiry
  return ItemStatus.GREEN;
};

export const getStatusColor = (status: ItemStatus): string => {
  switch (status) {
    case ItemStatus.RED: return 'bg-red-500';
    case ItemStatus.YELLOW: return 'bg-amber-500';
    case ItemStatus.GREEN: return 'bg-emerald-500';
  }
};
