import { describe, expect, it } from 'vitest';
import { formatMetric, metricValue, niceCeil } from './format';
import { TimeseriesPoint } from './types';

const point: TimeseriesPoint = {
  period: '2025-01',
  periodStart: '2025-01-01',
  revenue: 1234.5,
  orders: 42,
  items: 100,
  avgPrice: 12.345,
};

describe('metricValue', () => {
  it('selects the requested measure', () => {
    expect(metricValue(point, 'revenue')).toBe(1234.5);
    expect(metricValue(point, 'orders')).toBe(42);
    expect(metricValue(point, 'items')).toBe(100);
    expect(metricValue(point, 'avgPrice')).toBe(12.345);
  });
});

describe('formatMetric', () => {
  it('formats money metrics with a £ and 2dp', () => {
    expect(formatMetric(1234.5, 'revenue')).toBe('£1,234.50');
    expect(formatMetric(12.3, 'avgPrice')).toBe('£12.30');
  });

  it('formats count metrics as plain integers', () => {
    expect(formatMetric(42, 'orders')).toBe('42');
    expect(formatMetric(1000, 'items')).toBe('1,000');
  });
});

describe('niceCeil', () => {
  it('rounds up to 1/2/5 × 10^n', () => {
    expect(niceCeil(0)).toBe(1);
    expect(niceCeil(1)).toBe(1);
    expect(niceCeil(1.5)).toBe(2);
    expect(niceCeil(3)).toBe(5);
    expect(niceCeil(7)).toBe(10);
    expect(niceCeil(1234)).toBe(2000);
    expect(niceCeil(48230.5)).toBe(50000);
  });
});
