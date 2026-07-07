import { useCallback, useEffect, useState } from 'react';
import { getCurrentVatRate, parseVatRate } from '@src/features/vat-rates/api';

export interface UseCurrentVatRateResult {
  vatRate: number | null | undefined;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useCurrentVatRate(initialValue: number | null | undefined = undefined): UseCurrentVatRateResult {
  const [vatRate, setVatRate] = useState<number | null | undefined>(initialValue);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    getCurrentVatRate({ signal: controller.signal })
      .then((vrResponse) => {
        if (!controller.signal.aborted) {
          setVatRate(parseVatRate(vrResponse.rate));
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setVatRate(null);
          setError(err instanceof Error ? err.message : 'Failed to load VAT rate.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const cleanup = refresh();
    return cleanup;
  }, [refresh]);

  return {
    vatRate,
    isLoading,
    error,
    refresh,
  };
}
