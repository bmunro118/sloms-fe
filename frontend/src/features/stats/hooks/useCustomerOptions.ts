import { useEffect, useState } from 'react';
import { listCustomers } from '@src/features/customers/api';

export type CustomerOption = {
  customerId: number;
  label: string;
  accountNumber?: string;
  band?: string;
};

/**
 * Loads a flat list of (non-suspended) customers for the Stat Builder pickers.
 * Pulls up to `limit` in one page — the active customer base is small.
 */
export function useCustomerOptions(limit = 100) {
  const [options, setOptions] = useState<CustomerOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    listCustomers({ limit, page: 1 }, { signal: controller.signal })
      .then((res) => {
        const opts = (res.data ?? []).map((c) => ({
          customerId: c.customerId,
          accountNumber: c.accountNumber,
          band: c.band,
          label: c.accountNumber
            ? `${c.accountNumber} — ${c.companyName}`
            : c.companyName,
        }));
        opts.sort((a, b) => a.label.localeCompare(b.label));
        setOptions(opts);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Failed to load customers');
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [limit]);

  return { options, isLoading, error };
}
