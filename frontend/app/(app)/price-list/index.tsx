import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { ScreenContent } from '@components/layout/ScreenContent';
import { ThemedCard } from '@components/ui/ThemedCard';
import { useAuth } from '@context/AuthContext';
import { useScreenTitle } from '@src/hooks/useScreenTitle';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';
import { apiRequest } from '@utils/api';
import { ENDPOINTS } from '@utils/config';

type PriceListRow = {
  itemId?: string;
  description?: string;
  category?: string;
};

type PriceListCardRow = PriceListRow & {
  renderKey: string;
};

function resolvePriceListKeyBase(row: PriceListRow): string {
  if (row.itemId?.trim()) {
    return `item:${row.itemId.trim().toLowerCase()}`;
  }

  if (row.description?.trim()) {
    return `description:${row.description.trim().toLowerCase()}`;
  }

  return 'unknown-item';
}

function normalizePriceListRows(rows: PriceListRow[]): PriceListCardRow[] {
  const keyCounts = new Map<string, number>();

  return rows.map((row) => {
    const baseKey = resolvePriceListKeyBase(row);
    const nextCount = (keyCounts.get(baseKey) ?? 0) + 1;
    keyCounts.set(baseKey, nextCount);

    return {
      ...row,
      renderKey: nextCount === 1 ? baseKey : `${baseKey}#${nextCount}`,
    };
  });
}

export default function PriceListScreen() {
  const { isStaff } = useAuth();
  const styles = useThemedStyles(createStyles);
  useScreenTitle('Price List');
  const [rows, setRows] = useState<PriceListCardRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isStaff) {
      return;
    }

    const controller = new AbortController();
    (async () => {
      try {
        const response = await apiRequest<PriceListRow[] | { data?: PriceListRow[] }>(ENDPOINTS.priceList.list, {
          method: 'GET',
          requireAuth: true,
          signal: controller.signal,
        });
        if (!controller.signal.aborted) {
          const items = Array.isArray(response) ? response : Array.isArray(response?.data) ? response.data : [];
          setRows(normalizePriceListRows(items));
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Failed to load price list.');
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    })();
    return () => {
      controller.abort();
    };
  }, [isStaff]);

  if (!isStaff) {
    return <Redirect href="/(app)/dashboard" />;
  }

  return (
    <ScreenContent>
      {isLoading ? <Text style={styles.muted}>Loading price list...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!isLoading && !error && rows.length === 0 ? <Text style={styles.muted}>No price list items found.</Text> : null}
      {rows.map((row) => (
        <ThemedCard key={row.renderKey} style={styles.card}>
          <Text style={styles.cardTitle}>{row.itemId ?? 'Unnamed item'}</Text>
          <Text style={styles.cardMeta}>Category: {row.category ?? 'N/A'}</Text>
          <Text style={styles.cardMeta}>{row.description ?? 'No description'}</Text>
        </ThemedCard>
      ))}
    </ScreenContent>
  );
}

function createStyles(theme: AppTheme) {
  const common = createCommonScreenStyleDefinitions(theme);

  return StyleSheet.create({
    ...common,
  });
}
