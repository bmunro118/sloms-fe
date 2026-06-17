import { AppTheme } from '@theme/types';
import {
  PriceListItem,
  PriceListRevision,
  PriceListType,
  ItemListPrice,
} from '@src/features/price-list/api';

export function normalizePriceListItems(raw: unknown): PriceListItem[] {
  if (Array.isArray(raw)) return raw as PriceListItem[];
  const r = raw as { data?: PriceListItem[] };
  return Array.isArray(r?.data) ? r.data : [];
}

export function normalizeRevisions(raw: unknown): PriceListRevision[] {
  if (Array.isArray(raw)) return raw as PriceListRevision[];
  const r = raw as { data?: PriceListRevision[] };
  return Array.isArray(r?.data) ? r.data : [];
}

export function normalizeItemLists(raw: unknown): ItemListPrice[] {
  if (Array.isArray(raw)) return raw as ItemListPrice[];
  const r = raw as { data?: ItemListPrice[] };
  return Array.isArray(r?.data) ? r.data : [];
}

export function normalizeTypes(raw: unknown): PriceListType[] {
  if (Array.isArray(raw)) return raw as PriceListType[];
  const r = raw as { data?: PriceListType[] };
  return Array.isArray(r?.data) ? r.data : [];
}

export function statusColor(
  status: PriceListRevision['status'],
  theme: AppTheme,
): string {
  if (status === 'active') return theme.colors.accent;
  if (status === 'draft') return theme.colors.textSecondary;
  return theme.colors.textMuted;
}

export function formatDate(iso?: string): string {
  if (!iso) return '\u2014';
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}
