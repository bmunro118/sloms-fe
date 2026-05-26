import { OrderItemCardData, OrderItemEditValues } from './components/OrderItemCard';

// ── Order types ────────────────────────────────────────────────────────────────

export type OrderDetails = {
  orderNumber: number;
  orderBatch: number;
  status?: string;
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
    side: typeof item?.side === 'string' ? item.side : '',
    price: typeof item?.price === 'number' ? String(item.price) : '',
  };
}

export function isItemCheckedOut(item: OrderItemCardData): boolean {
  if (item.checkedOut === true || item.isCheckedOut === true) return true;
  if (typeof item.checkedOutAt === 'string' && (item.checkedOutAt as string).trim()) return true;
  if (typeof item.status === 'string' && item.status.toLowerCase().includes('checked out')) return true;
  return false;
}
