import { describe, expect, it } from 'vitest';
import {
  bandClass,
  bucketRange,
  dateBucketMatches,
  customerSelectionState,
  parseBuilderPrefs,
  parseGraphPrefs,
  DEFAULT_BUILDER_PREFS,
  DEFAULT_GRAPH_PREFS,
} from './prefs';

describe('bandClass (mirrors Access hospital/non-hospital rules)', () => {
  it('treats 2-char B-bands as hospital', () => {
    expect(bandClass('B1')).toBe('hospital');
    expect(bandClass('B4')).toBe('hospital');
  });

  it('treats non-B bands longer than 2 chars as non-hospital', () => {
    expect(bandClass('Dispensary')).toBe('nonHospital');
    expect(bandClass('Specsavers')).toBe('nonHospital');
    expect(bandClass('NHS Band 1')).toBe('nonHospital');
  });

  it('classifies anything else as other', () => {
    expect(bandClass('5%')).toBe('other'); // 2 chars, not B
    expect(bandClass('B')).toBe('other'); // 1 char
    expect(bandClass('')).toBe('other');
    expect(bandClass(null)).toBe('other');
    expect(bandClass(undefined)).toBe('other');
  });
});

describe('parseBuilderPrefs', () => {
  it('accepts a well-formed blob', () => {
    const blob = {
      customerIds: [1, 2, 3],
      from: '2025-01-01',
      to: '2025-03-31',
      groupBy: 'category',
    };
    expect(parseBuilderPrefs(blob)).toEqual(blob);
  });

  it('rejects malformed blobs', () => {
    expect(parseBuilderPrefs(null)).toBeNull();
    expect(parseBuilderPrefs({})).toBeNull();
    expect(parseBuilderPrefs({ customerIds: ['x'], from: '2025-01-01', to: '2025-01-02', groupBy: 'model' })).toBeNull();
    expect(parseBuilderPrefs({ customerIds: [1], from: 'nope', to: '2025-01-02', groupBy: 'model' })).toBeNull();
    expect(parseBuilderPrefs({ customerIds: [1], from: '2025-01-01', to: '2025-01-02', groupBy: 'weekly' })).toBeNull();
  });

  it('has sane defaults', () => {
    const d = DEFAULT_BUILDER_PREFS();
    expect(d.customerIds).toEqual([]);
    expect(d.groupBy).toBe('model');
    expect(d.from).toMatch(/^\d{4}-01-01$/);
  });
});

describe('parseGraphPrefs', () => {
  it('accepts a well-formed blob', () => {
    const blob = { bucket: 'quarter', metric: 'orders', customerId: 7 };
    expect(parseGraphPrefs(blob)).toEqual(blob);
  });

  it('accepts a null customer filter', () => {
    expect(parseGraphPrefs({ bucket: 'week', metric: 'revenue', customerId: null })).toEqual({
      bucket: 'week',
      metric: 'revenue',
      customerId: null,
    });
  });

  it('rejects invalid enums', () => {
    expect(parseGraphPrefs({ bucket: 'decade', metric: 'revenue', customerId: null })).toBeNull();
    expect(parseGraphPrefs({ bucket: 'month', metric: 'profit', customerId: null })).toBeNull();
    expect(parseGraphPrefs({ bucket: 'month', metric: 'revenue', customerId: 'x' })).toBeNull();
  });

  it('has sane defaults', () => {
    expect(DEFAULT_GRAPH_PREFS()).toEqual({ bucket: 'month', metric: 'revenue', customerId: null });
  });
});

describe('bucketRange (this-period-to-date shortcuts)', () => {
  const now = new Date(2025, 4, 15); // Thu 15 May 2025 (local)

  it('computes year/quarter/month/week starts through today', () => {
    expect(bucketRange('year', now)).toEqual({ from: '2025-01-01', to: '2025-05-15' });
    expect(bucketRange('quarter', now)).toEqual({ from: '2025-04-01', to: '2025-05-15' });
    expect(bucketRange('month', now)).toEqual({ from: '2025-05-01', to: '2025-05-15' });
    expect(bucketRange('week', now)).toEqual({ from: '2025-05-12', to: '2025-05-15' }); // Mon
  });
});

describe('dateBucketMatches', () => {
  const now = new Date(2025, 4, 15);

  it('is true only when from/to equal the bucket range', () => {
    expect(dateBucketMatches('2025-05-01', '2025-05-15', 'month', now)).toBe(true);
    expect(dateBucketMatches('2025-05-01', '2025-05-14', 'month', now)).toBe(false);
    expect(dateBucketMatches('2025-01-01', '2025-05-15', 'year', now)).toBe(true);
  });
});

describe('customerSelectionState', () => {
  const customers = [
    { customerId: 1, band: 'B1' },
    { customerId: 2, band: 'Dispensary' },
    { customerId: 3, band: 'B2' },
    { customerId: 4, band: 'Specsavers' },
    { customerId: 5, band: '5%' }, // "other"
  ];

  it('flags the hospital group when selection equals all hospitals', () => {
    expect(customerSelectionState([1, 3], customers)).toEqual({
      all: false,
      hospital: true,
      nonHospital: false,
    });
  });

  it('flags the non-hospital group', () => {
    expect(customerSelectionState([2, 4], customers)).toEqual({
      all: false,
      hospital: false,
      nonHospital: true,
    });
  });

  it('flags all when every customer is selected (order-insensitive)', () => {
    expect(customerSelectionState([5, 4, 3, 2, 1], customers).all).toBe(true);
  });

  it('flags nothing for a partial or empty selection', () => {
    expect(customerSelectionState([1], customers)).toEqual({
      all: false,
      hospital: false,
      nonHospital: false,
    });
    expect(customerSelectionState([], customers)).toEqual({
      all: false,
      hospital: false,
      nonHospital: false,
    });
  });
});
