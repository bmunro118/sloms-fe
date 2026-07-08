// ── Types for ItemsCard Component ─────────────────────────────────────────────

import { PriceListItem } from '@src/features/price-list/api';
import { OrderItemCardData } from '../OrderItemCard';

// Mode types
export type ItemsCardMode = 'edit' | 'display';

// Pending item type (used during order creation)
export type PendingItem = {
  id: string;
  itemId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  patientInitial?: string;
  patientSurname?: string;
  side?: string;
  vatRate?: number;
  error?: string;
};

// Props for PendingItemCard component (for pending items in edit mode)
export type PendingItemCardProps = {
  item: PendingItem;
  isAddingItem: boolean;
  onUpdateItem: (id: string, updates: Partial<PendingItem>) => void;
  onRemoveItem: (id: string) => void;
};

// Props for DisplayItemCard component (for existing order items in display mode)
export type DisplayItemCardProps = {
  item: OrderItemCardData;
};


