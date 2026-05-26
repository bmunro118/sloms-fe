import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Factory,
  Package,
  Truck,
  type LucideIcon,
} from 'lucide-react-native';

// ── Tracking payload types ─────────────────────────────────────────────────────

export type TrackingEntry = {
  timestamp?: string;
  changedOn?: string;
  status?: string;
  note?: string;
  message?: string;
  [key: string]: unknown;
};

export type TrackingItem = {
  serialNumber?: string;
  description?: string;
  side?: string;
  status?: string;
  [key: string]: unknown;
};

export type OrderTrackingPayload = {
  orderNumber?: number;
  orderBatch?: number;
  customerRef?: string;
  status?: string;
  currentStatus?: string;
  statusChangedOn?: string;
  history?: TrackingEntry[];
  items?: TrackingItem[];
  itemProgress?: unknown;
  [key: string]: unknown;
};

export type TimelineUpdate = {
  id: string;
  status: string;
  statusLabel: string;
  timestamp?: string;
  timestampLabel: string;
  note?: string;
  message?: string;
};

export type FilterOption = {
  label: string;
  value: string;
};

export type StepState = 'complete' | 'current' | 'upcoming';

// ── Constants ──────────────────────────────────────────────────────────────────

export const ORDER_STEPS = ['Received', 'InProduction', 'Ready', 'Dispatched'] as const;

// ── Utility functions ──────────────────────────────────────────────────────────

export function formatTrackingDate(value?: string): string {
  if (!value) {
    return 'Unknown';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export function formatStatusLabel(value?: string): string {
  if (!value) {
    return 'Unknown';
  }

  return value.replace(/([a-z])([A-Z])/g, '$1 $2');
}

export function normalizeTrackingTimestamp(entry: TrackingEntry): string | undefined {
  if (typeof entry.changedOn === 'string' && entry.changedOn.trim().length > 0) {
    return entry.changedOn;
  }

  if (typeof entry.timestamp === 'string' && entry.timestamp.trim().length > 0) {
    return entry.timestamp;
  }

  return undefined;
}

export function getStatusIcon(status?: string): LucideIcon {
  switch (status) {
    case 'Received':
      return Package;
    case 'InProduction':
      return Factory;
    case 'Ready':
      return CheckCircle2;
    case 'Dispatched':
      return Truck;
    case 'Voided':
      return AlertTriangle;
    default:
      return Clock3;
  }
}
