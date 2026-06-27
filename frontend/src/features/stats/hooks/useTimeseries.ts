import { useEffect, useState } from 'react';
import { getTimeseries, TimeseriesQuery, TimeseriesResult } from '../api';

/**
 * Fetches the bucketed time-series whenever the query changes. The graphs are
 * read-only, so this auto-runs (unlike the Stat Builder, which is run on demand).
 */
export function useTimeseries(query: TimeseriesQuery) {
  const [data, setData] = useState<TimeseriesResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { bucket, metric, from, to, band } = query;
  // customerId is an array; serialise so the effect re-runs on content change.
  const customerKey = (query.customerId ?? []).join(',');

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    getTimeseries(
      {
        bucket,
        metric,
        from,
        to,
        band,
        customerId: customerKey ? customerKey.split(',').map(Number) : undefined,
      },
      { signal: controller.signal },
    )
      .then((result) => setData(result))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Failed to load statistics');
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [bucket, metric, from, to, band, customerKey]);

  return { data, isLoading, error };
}
