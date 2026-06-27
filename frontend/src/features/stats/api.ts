import { apiRequest } from '@utils/api';
import { ENDPOINTS } from '@utils/config';
import {
  BuilderQuery,
  BuilderResult,
  TimeseriesQuery,
  TimeseriesResult,
} from './types';

// Re-export so existing imports (`from '../api'`) keep working.
export * from './types';
export * from './format';

type RequestConfig = { signal?: AbortSignal };

function buildTimeseriesUrl(query: TimeseriesQuery): string {
  const url = new URL(ENDPOINTS.stats.timeseries);
  url.searchParams.set('bucket', query.bucket);
  if (query.metric) url.searchParams.set('metric', query.metric);
  if (query.from) url.searchParams.set('from', query.from);
  if (query.to) url.searchParams.set('to', query.to);
  if (query.band) url.searchParams.set('band', query.band);
  // customerId is repeatable: ?customerId=1&customerId=2
  (query.customerId ?? []).forEach((id) =>
    url.searchParams.append('customerId', String(id)),
  );
  return url.toString();
}

export function getTimeseries(
  query: TimeseriesQuery,
  config?: RequestConfig,
): Promise<TimeseriesResult> {
  return apiRequest<TimeseriesResult>(buildTimeseriesUrl(query), {
    method: 'GET',
    requireAuth: true,
    signal: config?.signal,
  });
}

export function runStatBuilder(
  query: BuilderQuery,
  config?: RequestConfig,
): Promise<BuilderResult> {
  return apiRequest<BuilderResult>(ENDPOINTS.stats.builder, {
    method: 'POST',
    requireAuth: true,
    body: query,
    signal: config?.signal,
  });
}
