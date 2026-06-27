import { useCallback, useState } from 'react';
import { runStatBuilder, BuilderQuery, BuilderResult } from '../api';

/**
 * Runs the Stat Builder on demand (the user assembles a query then presses Run),
 * mirroring the Access "Run Query" button rather than auto-fetching.
 */
export function useStatBuilder() {
  const [data, setData] = useState<BuilderResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (query: BuilderQuery) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await runStatBuilder(query);
      setData(result);
      return result;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to run query');
      setData(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, isLoading, error, run, reset };
}
