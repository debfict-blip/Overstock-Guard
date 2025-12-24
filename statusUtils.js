
import { ItemStatus } from './types.js';

export const calculateStatus = (item) => {
  const { expiryDate, quantity, parLevel } = item;

  if (quantity < parLevel) {
    return ItemStatus.RED;
  }

  if (expiryDate) {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return ItemStatus.RED;
    }

    if (diffDays <= 3) {
      return ItemStatus.YELLOW;
    }
  }

  if (quantity === parLevel) {
    return ItemStatus.YELLOW;
  }

  return ItemStatus.GREEN;
};

export const getStatusColor = (status) => {
  switch (status) {
    case ItemStatus.RED: return 'bg-red-500';
    case ItemStatus.YELLOW: return 'bg-amber-500';
    case ItemStatus.GREEN: return 'bg-emerald-500';
    default: return 'bg-slate-200';
  }
};
