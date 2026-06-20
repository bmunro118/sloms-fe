import { useEffect, useRef, useState } from 'react';
import { getCustomer } from '@src/features/customers/api';

export type CustomerInfo = {
  customerName: string | null;
  customerAccountNumber: string | null;
};

type OrderWithCustomer = {
  customerAccount?: number;
};

/**
 * Batch-resolves customer names and account numbers for a list of orders.
 * Deduplicates customer IDs and fetches them in parallel via Promise.all.
 * Returns a stable map (same reference when IDs haven't changed).
 */
export function useBulkOrderCustomers(orders: OrderWithCustomer[]): Map<number, CustomerInfo> {
  const [customerMap, setCustomerMap] = useState<Map<number, CustomerInfo>>(new Map());
  const previousIdKeyRef = useRef<string>('');

  useEffect(() => {
    const uniqueIds = [
      ...new Set(
        orders
          .map((o) => o.customerAccount)
          .filter((id): id is number => typeof id === 'number'),
      ),
    ];
    const idKey = uniqueIds.sort((a, b) => a - b).join(',');

    if (idKey === previousIdKeyRef.current) return;
    previousIdKeyRef.current = idKey;

    if (uniqueIds.length === 0) {
      setCustomerMap(new Map());
      return;
    }

    const controller = new AbortController();
    const map = new Map<number, CustomerInfo>();

    Promise.all(
      uniqueIds.map((id) =>
        getCustomer(id, { signal: controller.signal })
          .then((customer) => ({
            id,
            name: customer.companyName ?? null,
            accountNumber: customer.accountNumber ?? null,
          }))
          .catch(() => ({ id, name: null, accountNumber: null })),
      ),
    )
      .then((results) => {
        if (!controller.signal.aborted) {
          results.forEach(({ id, name, accountNumber }) =>
            map.set(id, { customerName: name, customerAccountNumber: accountNumber }),
          );
          setCustomerMap(map);
        }
      });

    return () => {
      controller.abort();
    };
  }, [orders]);

  return customerMap;
}
