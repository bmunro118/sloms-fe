import { OrderItemCardData, OrderItemEditValues } from './components/OrderItemCard';

// ── Order types ────────────────────────────────────────────────────────────────

export type OrderDetails = {
  orderNumber: number;
  orderBatch: number;
  status?: string;
  currentStatus?: string;
  void?: boolean;
  dispatchedOn?: string | Date | null;
  items?: Array<{ void?: boolean; checkedOut?: boolean }>;
  customerAccount?: number;
  customerRef?: string;
  orderContact?: string;
  deliveryAddress?: number;
  priceBand?: string;
};

export type OrderUpdatePayload = {
  customerRef?: string;
  orderContact?: string;
  deliveryAddress?: number;
  priceBand?: string;
};

export type OrderEditForm = {
  customerRef: string;
  orderContact: string;
  deliveryAddress: number | null;
  priceBand: string;
};

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * The SLOMS API returns no `status` field — it must be derived from entity fields.
 * - `void === true`         → "Voided"
 * - `dispatchedOn` is set  → "Dispatched"
 * - has items, all checked out → "Ready"
 * - has items, some not checked out → "InProduction"
 * - otherwise              → "Received"
 * Falls back to `currentStatus` or `status` if present (future-proofing).
 */
export function resolveOrderStatus(order: {
  status?: string;
  currentStatus?: string;
  void?: boolean;
  dispatchedOn?: string | Date | null;
  items?: Array<{ void?: boolean; checkedOut?: boolean }>;
}): string {
  if (order.void) return 'Voided';
  if (order.dispatchedOn) return 'Dispatched';

  // Items-based status (only available on the detail endpoint)
  if (Array.isArray(order.items)) {
    const activeItems = order.items.filter((i) => !i.void);
    if (activeItems.length > 0) {
      return activeItems.every((i) => i.checkedOut) ? 'Ready' : 'InProduction';
    }
  }

  // Explicit status fields as fallback (in case backend adds them later)
  if (order.currentStatus) return order.currentStatus;
  if (order.status) return order.status;

  return 'Received';
}

export function toOrderEditForm(order: OrderDetails | null): OrderEditForm {
  return {
    customerRef: order?.customerRef ?? '',
    orderContact: order?.orderContact ?? '',
    deliveryAddress: typeof order?.deliveryAddress === 'number' ? order.deliveryAddress : null,
    priceBand: order?.priceBand ?? '',
  };
}

export function toItemEditForm(item: OrderItemCardData | null): OrderItemEditValues {
  return {
    description: typeof item?.description === 'string' ? item.description : '',
    patientInitial: typeof item?.patientInitial === 'string' ? item.patientInitial : '',
    patientSurname: typeof item?.patientSurname === 'string' ? item.patientSurname : '',
    side: typeof item?.orientation === 'string' ? item.orientation : (typeof item?.side === 'string' ? item.side : ''),
    price: typeof item?.price === 'number' ? String(item.price) : '',
  };
}

export function isItemCheckedOut(item: OrderItemCardData): boolean {
  if (item.checkedOut === true) return true;
  if (typeof item.checkoutDateStamp === 'string' && (item.checkoutDateStamp as string).trim()) return true;
  return false;
}
