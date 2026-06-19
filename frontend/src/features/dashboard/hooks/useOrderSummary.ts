import { useCallback, useEffect, useState } from 'react';
import { listOrders, OrderSummary } from '@src/features/orders/api';

export interface OrderSummaryData {
  received: number;
  inProduction: number;
  ready: number;
  recentlyDispatched: number;
}

const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;
const MAX_PAGES = 20;
const LIMIT = 100;

export function useOrderSummary() {
  const [data, setData] = useState<OrderSummaryData>({
    received: 0,
    inProduction: 0,
    ready: 0,
    recentlyDispatched: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const refresh = useCallback(() => setRefreshTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    async function fetchAll() {
      try {
        const first = await listOrders({ limit: LIMIT, page: 1 });
        const allOrders: OrderSummary[] = [...first.data];
        const total = first.total ?? first.data.length;
        let page = 2;
        while (allOrders.length < total && page <= MAX_PAGES) {
          const next = await listOrders({ limit: LIMIT, page });
          if (!next.data.length) break;
          allOrders.push(...next.data);
          page++;
        }
        if (cancelled) return;

        const active = allOrders.filter(
          (o) => o.isVoided !== true && o.status !== 'Voided',
        );

        const now = Date.now();

        setData({
          received: active.filter((o) => o.status === 'Received').length,
          inProduction: active.filter((o) => o.status === 'InProduction').length,
          ready: active.filter((o) => o.status === 'Ready').length,
          recentlyDispatched: active.filter((o) => {
            if (o.status !== 'Dispatched') return false;
            const dateStr =
              (o.dispatchedOn as string | null | undefined) ??
              (o.statusChangedOn as string | null | undefined);
            if (!dateStr) return true;
            return now - new Date(dateStr).getTime() <= FORTY_EIGHT_HOURS_MS;
          }).length,
        });
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load order summary');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void fetchAll();
    return () => {
      cancelled = true;
    };
  }, [refreshTick]);

  return { data, isLoading, error, refresh };
}
