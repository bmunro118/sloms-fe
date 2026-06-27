import { StatBucket, StatGroupBy, StatMetric } from './types';

// ── Customer band classification (mirrors Access frmAccountFigures_SUB) ──────────
//
// Access "Select all Hospitals"      → band is 2 chars starting with "B" (B1–B4).
// Access "Select all Non-Hospitals"  → band does NOT start with "B" and is >2 chars
//                                       (Dispensary, Specsavers, "NHS Band N", …).
// Anything else (e.g. "5%", blank) belongs to neither group, exactly as in Access.

export type BandClass = 'hospital' | 'nonHospital' | 'other';

export function bandClass(band?: string | null): BandClass {
  const b = (band ?? '').trim();
  if (b.length === 2 && b.startsWith('B')) return 'hospital';
  if (b.length > 2 && !b.startsWith('B')) return 'nonHospital';
  return 'other';
}

// ── Persisted preferences (stored as JSON in user settings) ─────────────────────

export const STATS_BUILDER_PREFS_KEY = 'stats.builder.v1';
export const STATS_GRAPH_PREFS_KEY = 'stats.graph.v1';

export type BuilderPrefs = {
  customerIds: number[];
  from: string;
  to: string;
  groupBy: StatGroupBy;
};

export type GraphPrefs = {
  bucket: StatBucket;
  metric: StatMetric;
  customerId: number | null;
};

/** Format a Date as a LOCAL calendar date (YYYY-MM-DD) — matches what the
 *  `<input type="date">` control reads/writes, avoiding UTC off-by-one. */
export function isoLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function startOfYearIso(): string {
  return `${new Date().getFullYear()}-01-01`;
}
export function todayIso(): string {
  return isoLocal(new Date());
}

// ── Date-range bucket shortcuts (Year / Quarter / Month / Week → from/to) ────────
//
// Each shortcut sets the range to the start of the current period through today
// ("this year/quarter/month/week to date"). Reuses the StatBucket union.

export function bucketRange(
  bucket: StatBucket,
  now: Date = new Date(),
): { from: string; to: string } {
  const to = isoLocal(now);
  let from: Date;
  switch (bucket) {
    case 'year':
      from = new Date(now.getFullYear(), 0, 1);
      break;
    case 'quarter': {
      const qStartMonth = Math.floor(now.getMonth() / 3) * 3;
      from = new Date(now.getFullYear(), qStartMonth, 1);
      break;
    }
    case 'month':
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'week': {
      const d = new Date(now);
      const dow = (d.getDay() + 6) % 7; // Mon=0 … Sun=6
      d.setDate(d.getDate() - dow);
      from = d;
      break;
    }
  }
  return { from: isoLocal(from), to };
}

/** True when the given from/to exactly match a bucket's "to date" range. */
export function dateBucketMatches(
  from: string,
  to: string,
  bucket: StatBucket,
  now: Date = new Date(),
): boolean {
  const r = bucketRange(bucket, now);
  return r.from === from && r.to === to;
}

// ── Customer quick-select active state ──────────────────────────────────────────

type CustomerLike = { customerId: number; band?: string | null };

function sameSet(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((x) => set.has(x));
}

export type CustomerSelectionState = {
  all: boolean;
  hospital: boolean;
  nonHospital: boolean;
};

/**
 * Reports which quick-select group (if any) the current selection exactly equals,
 * so the matching button can stay highlighted until the selection diverges.
 */
export function customerSelectionState(
  selectedIds: number[],
  customers: CustomerLike[],
): CustomerSelectionState {
  if (selectedIds.length === 0) {
    return { all: false, hospital: false, nonHospital: false };
  }
  const allIds = customers.map((c) => c.customerId);
  const hospitalIds = customers
    .filter((c) => bandClass(c.band) === 'hospital')
    .map((c) => c.customerId);
  const nonHospitalIds = customers
    .filter((c) => bandClass(c.band) === 'nonHospital')
    .map((c) => c.customerId);

  return {
    all: allIds.length > 0 && sameSet(selectedIds, allIds),
    hospital: hospitalIds.length > 0 && sameSet(selectedIds, hospitalIds),
    nonHospital: nonHospitalIds.length > 0 && sameSet(selectedIds, nonHospitalIds),
  };
}

export const DEFAULT_BUILDER_PREFS = (): BuilderPrefs => ({
  customerIds: [],
  from: startOfYearIso(),
  to: todayIso(),
  groupBy: 'model',
});

export const DEFAULT_GRAPH_PREFS = (): GraphPrefs => ({
  bucket: 'month',
  metric: 'revenue',
  customerId: null,
});

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const BUCKETS: StatBucket[] = ['year', 'quarter', 'month', 'week'];
const METRICS: StatMetric[] = ['revenue', 'orders', 'items', 'avgPrice'];
const GROUP_BYS: StatGroupBy[] = ['model', 'category'];

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

/** Validate a parsed builder-prefs blob; returns null if anything is off. */
export function parseBuilderPrefs(raw: unknown): BuilderPrefs | null {
  if (!isObject(raw)) return null;
  const { customerIds, from, to, groupBy } = raw;
  if (!Array.isArray(customerIds) || !customerIds.every((n) => Number.isInteger(n))) {
    return null;
  }
  if (typeof from !== 'string' || !ISO_DATE.test(from)) return null;
  if (typeof to !== 'string' || !ISO_DATE.test(to)) return null;
  if (typeof groupBy !== 'string' || !GROUP_BYS.includes(groupBy as StatGroupBy)) {
    return null;
  }
  return {
    customerIds: customerIds as number[],
    from,
    to,
    groupBy: groupBy as StatGroupBy,
  };
}

/** Validate a parsed graph-prefs blob; returns null if anything is off. */
export function parseGraphPrefs(raw: unknown): GraphPrefs | null {
  if (!isObject(raw)) return null;
  const { bucket, metric, customerId } = raw;
  if (typeof bucket !== 'string' || !BUCKETS.includes(bucket as StatBucket)) return null;
  if (typeof metric !== 'string' || !METRICS.includes(metric as StatMetric)) return null;
  if (customerId !== null && !Number.isInteger(customerId)) return null;
  return {
    bucket: bucket as StatBucket,
    metric: metric as StatMetric,
    customerId: (customerId as number | null) ?? null,
  };
}
