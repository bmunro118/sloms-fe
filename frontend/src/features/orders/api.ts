import { apiRequest } from '@utils/api';
import { ENDPOINTS } from '@utils/config';

export type PaginationQuery = {
  page?: number;
  limit?: number;
};

export type OrdersListQuery = PaginationQuery & {
  includeVoided?: boolean;
  customerId?: number;
  status?: 'Received' | 'InProduction' | 'Ready' | 'Dispatched' | 'Voided';
};

export type OrdersListResponse<TOrder = OrderSummary> = {
  data: TOrder[];
  total?: number;
  page?: number;
  limit?: number;
};

export type OrderSummary = {
  orderNumber: number;
  orderBatch: number;
  status?: string;
  customerAccount?: number;
  [key: string]: unknown;
};

export type CreateOrderPayload = {
  orderNumber: number;
  orderBatch?: number;
  customerAccount: number;
  customerRef?: string;
  orderContact?: string;
  deliveryAddress?: number;
  receivedOn?: string;
  priceBand?: string;
};

export type UpdateOrderPayload = {
  customerRef?: string;
  orderContact?: string;
  deliveryAddress?: number;
  priceBand?: string;
  [key: string]: unknown;
};

export type OrderItem = {
  serialNumber: string;
  [key: string]: unknown;
};

export type OrderItemsListResponse<TItem = OrderItem> = {
  data: TItem[];
  total?: number;
  page?: number;
  limit?: number;
};

export type CreateOrderItemPayload = {
  serialNumber: string;
  [key: string]: unknown;
};

export type UpdateOrderItemPayload = {
  [key: string]: unknown;
};

type RequestConfig = {
  signal?: AbortSignal;
};

function buildUrlWithQuery(baseUrl: string, query?: Record<string, unknown>): string {
  if (!query) {
    return baseUrl;
  }

  const url = new URL(baseUrl);

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    url.searchParams.set(key, String(value));
  });

  return url.toString();
}

export function listOrders(query?: OrdersListQuery, requestConfig?: RequestConfig): Promise<OrdersListResponse> {
  return apiRequest<OrdersListResponse>(buildUrlWithQuery(ENDPOINTS.orders.list, query), {
    method: 'GET',
    requireAuth: true,
    signal: requestConfig?.signal,
  });
}

export function createOrder(payload: CreateOrderPayload): Promise<OrderSummary> {
  return apiRequest<OrderSummary>(ENDPOINTS.orders.list, {
    method: 'POST',
    requireAuth: true,
    body: payload,
  });
}

export function getOrder(
  orderNumber: number,
  orderBatch: number,
  requestConfig?: RequestConfig
): Promise<OrderSummary> {
  return apiRequest<OrderSummary>(ENDPOINTS.orders.byId(orderNumber, orderBatch), {
    method: 'GET',
    requireAuth: true,
    signal: requestConfig?.signal,
  });
}

export function updateOrder(
  orderNumber: number,
  orderBatch: number,
  payload: UpdateOrderPayload
): Promise<OrderSummary> {
  return apiRequest<OrderSummary>(ENDPOINTS.orders.byId(orderNumber, orderBatch), {
    method: 'PUT',
    requireAuth: true,
    body: payload,
  });
}

export function voidOrder(orderNumber: number, orderBatch: number): Promise<void> {
  return apiRequest<void>(ENDPOINTS.orders.byId(orderNumber, orderBatch), {
    method: 'DELETE',
    requireAuth: true,
  });
}

export function getOrderTracking<TTracking = unknown>(
  orderNumber: number,
  orderBatch: number,
  requestConfig?: RequestConfig
): Promise<TTracking> {
  return apiRequest<TTracking>(ENDPOINTS.orders.tracking(orderNumber, orderBatch), {
    method: 'GET',
    requireAuth: true,
    signal: requestConfig?.signal,
  });
}

export function dispatchOrder(orderNumber: number, orderBatch: number): Promise<void> {
  return apiRequest<void>(ENDPOINTS.orders.dispatch(orderNumber, orderBatch), {
    method: 'PATCH',
    requireAuth: true,
  });
}

export function getOrderBreakdownPdf(orderNumber: number, orderBatch: number): Promise<Blob> {
  return apiRequest<Blob>(ENDPOINTS.orders.breakdown(orderNumber, orderBatch), {
    method: 'GET',
    requireAuth: true,
    responseType: 'blob',
  });
}

export function getOrderItemBySerial<TItem = OrderItem>(serialNumber: string): Promise<TItem> {
  return apiRequest<TItem>(ENDPOINTS.orders.itemBySerial(serialNumber), {
    method: 'GET',
    requireAuth: true,
  });
}

export function listOrderItems<TItem = OrderItem>(
  orderNumber: number,
  orderBatch: number,
  query?: PaginationQuery,
  requestConfig?: RequestConfig
): Promise<OrderItemsListResponse<TItem>> {
  return apiRequest<OrderItemsListResponse<TItem>>(
    buildUrlWithQuery(ENDPOINTS.orders.items(orderNumber, orderBatch), query),
    {
      method: 'GET',
      requireAuth: true,
      signal: requestConfig?.signal,
    }
  );
}

export function addOrderItem<TItem = OrderItem>(
  orderNumber: number,
  orderBatch: number,
  payload: CreateOrderItemPayload
): Promise<TItem> {
  return apiRequest<TItem>(ENDPOINTS.orders.items(orderNumber, orderBatch), {
    method: 'POST',
    requireAuth: true,
    body: payload,
  });
}

export function getOrderItem<TItem = OrderItem>(
  orderNumber: number,
  orderBatch: number,
  serialNumber: string,
  requestConfig?: RequestConfig
): Promise<TItem> {
  return apiRequest<TItem>(ENDPOINTS.orders.itemById(orderNumber, orderBatch, serialNumber), {
    method: 'GET',
    requireAuth: true,
    signal: requestConfig?.signal,
  });
}

export function updateOrderItem<TItem = OrderItem>(
  orderNumber: number,
  orderBatch: number,
  serialNumber: string,
  payload: UpdateOrderItemPayload
): Promise<TItem> {
  return apiRequest<TItem>(ENDPOINTS.orders.itemById(orderNumber, orderBatch, serialNumber), {
    method: 'PUT',
    requireAuth: true,
    body: payload,
  });
}

export function voidOrderItem(
  orderNumber: number,
  orderBatch: number,
  serialNumber: string
): Promise<void> {
  return apiRequest<void>(ENDPOINTS.orders.itemById(orderNumber, orderBatch, serialNumber), {
    method: 'DELETE',
    requireAuth: true,
  });
}

export function checkoutOrderItem(
  orderNumber: number,
  orderBatch: number,
  serialNumber: string
): Promise<void> {
  return apiRequest<void>(ENDPOINTS.orders.checkoutItem(orderNumber, orderBatch, serialNumber), {
    method: 'PATCH',
    requireAuth: true,
  });
}

export function uncheckedOutOrderItem(
  orderNumber: number,
  orderBatch: number,
  serialNumber: string
): Promise<void> {
  return apiRequest<void>(ENDPOINTS.orders.uncheckedOutItem(orderNumber, orderBatch, serialNumber), {
    method: 'PATCH',
    requireAuth: true,
  });
}
