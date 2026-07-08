import { useCallback, useState } from 'react';
import { PriceListItem } from '@src/features/price-list/api';
import { PendingItem } from '../components/ItemsCard/ItemsCardTypes';

export interface UsePendingItemsResult {
  pendingItems: PendingItem[];
  isSaving: boolean;
  handleAddPendingItem: (item: PendingItem) => void;
  handleRemovePendingItem: (id: string) => void;
  handleUpdatePendingItem: (id: string, updates: Partial<PendingItem>) => void;
  handleResetPendingItems: () => void;
  setIsSaving: (value: boolean) => void;
}

export function usePendingItems(initialItems: PendingItem[] = []): UsePendingItemsResult {
  const [pendingItems, setPendingItems] = useState<PendingItem[]>(initialItems);
  const [isSaving, setIsSaving] = useState(false);

  const handleAddPendingItem = useCallback(
    (item: PendingItem) => {
      setPendingItems((prev) => [...prev, item]);
    },
    []
  );

  const handleRemovePendingItem = useCallback((id: string) => {
    setPendingItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleUpdatePendingItem = useCallback(
    (id: string, updates: Partial<PendingItem>) => {
      setPendingItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                ...updates,
                total:
                  updates.quantity !== undefined && updates.unitPrice !== undefined
                    ? updates.quantity * (updates.unitPrice ?? 0)
                    : updates.quantity !== undefined
                    ? updates.quantity * (item.unitPrice ?? 0)
                    : updates.unitPrice !== undefined
                    ? item.quantity * (updates.unitPrice ?? 0)
                    : item.total,
              }
            : item
        )
      );
    },
    []
  );

  const handleResetPendingItems = useCallback(() => {
    setPendingItems([]);
  }, []);

  return {
    pendingItems,
    isSaving,
    handleAddPendingItem,
    handleRemovePendingItem,
    handleUpdatePendingItem,
    handleResetPendingItems,
    setIsSaving,
  };
}
