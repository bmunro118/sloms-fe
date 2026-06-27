import { StatBucket, StatMetric, TimeseriesPoint } from './types';

export const METRIC_LABELS: Record<StatMetric, string> = {
  revenue: 'Revenue',
  orders: 'Orders',
  items: 'Items',
  avgPrice: 'Avg Price',
};

export const BUCKET_LABELS: Record<StatBucket, string> = {
  year: 'Year',
  quarter: 'Quarter',
  month: 'Month',
  week: 'Week',
};

/** Pull a single metric's value out of a time-series point. */
export function metricValue(point: TimeseriesPoint, metric: StatMetric): number {
  return point[metric];
}

/** Format a metric value for display (money for revenue/avgPrice, integer otherwise). */
export function formatMetric(value: number, metric: StatMetric): string {
  if (metric === 'revenue' || metric === 'avgPrice') {
    return `£${value.toLocaleString('en-GB', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  return value.toLocaleString('en-GB');
}

/** Round a positive number up to 1/2/5 × 10^n for clean chart axis ticks. */
export function niceCeil(value: number): number {
  if (value <= 0) return 1;
  const exp = Math.floor(Math.log10(value));
  const base = Math.pow(10, exp);
  const frac = value / base;
  const niceFrac = frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 5 ? 5 : 10;
  return niceFrac * base;
}
