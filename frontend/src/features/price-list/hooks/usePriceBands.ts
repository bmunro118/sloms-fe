import { useEffect, useState } from 'react';
import { SelectOption } from '@components/ui/ThemedSelect';
import { listPriceListTypes, PriceListType, PriceListTypesResponse } from '../api';

export type UsePriceBandsResult = {
  priceBands: SelectOption<string>[];
  isLoading: boolean;
  error: Error | null;
};

/**
 * Fetches price list types and converts them to SelectOption<string> for use with ThemedSelect.
 * Uses the existing listPriceListTypes API function.
 * Handles the union return type (PriceListTypesResponse | PriceListType[]).
 */
export function usePriceBands(): UsePriceBandsResult {
  const [priceBands, setPriceBands] = useState<SelectOption<string>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    listPriceListTypes({ signal: controller.signal })
      .then((response) => {
        if (!controller.signal.aborted) {
          // Handle union type: PriceListTypesResponse | PriceListType[]
          const types: PriceListType[] = Array.isArray(response) 
            ? response 
            : (response as PriceListTypesResponse).data ?? [];
          
          // Convert to SelectOption<string> using name as value and displayName as label fallback
          const options: SelectOption<string>[] = types.map((type) => ({
            value: type.name,
            label: type.displayName ?? type.name,
          }));
          
          setPriceBands(options);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          if (__DEV__) console.log('[usePriceBands] failed to fetch price bands', err);
          setError(err instanceof Error ? err : new Error('Failed to load price bands'));
          setPriceBands([]);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => { controller.abort(); };
  }, []);

  return { priceBands, isLoading, error };
}
