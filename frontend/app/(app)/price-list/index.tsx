import { Redirect } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { RefreshCw as RefreshIcon } from 'lucide-react-native';
import { StyleSheet, Text } from 'react-native';
import { ScreenContent } from '@components/layout/ScreenContent';
import { ThemedCard } from '@components/ui/ThemedCard';
import { FilterModal } from '@components/ui/FilterModal';
import { ListFilterHeader } from '@components/ui/ListFilterHeader';
import { ThemedInput } from '@components/ui/ThemedInput';
import { useAuth } from '@context/AuthContext';
import { TopBarAction } from '@context/ScreenTitleContext';
import { buildIconTopBarAction } from '@src/features/app-shell';
import { useListFilters } from '@src/hooks/useListFilters';
import { useScreenTopBar } from '@src/hooks/useScreenTopBar';
import { useAppTheme } from '@theme/ThemeProvider';
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

type PriceListFilters = {
  category: string;
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

const INITIAL_FILTERS: PriceListFilters = { category: '' };

export default function PriceListScreen() {
  const { isStaff } = useAuth();
  const styles = useThemedStyles(createStyles);
  const theme = useAppTheme();
  const [refreshTick, setRefreshTick] = useState(0);
  const [allRows, setAllRows] = useState<PriceListCardRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    appliedFilters,
    draftFilters,
    searchQuery,
    debouncedSearch,
    isModalOpen,
    hasActiveFilters,
    setSearchQuery,
    setDraftFilter,
    openModal,
    closeModal,
    applyFilters,
    clearFilters,
  } = useListFilters<PriceListFilters>(INITIAL_FILTERS);

  const topBarActions = useMemo<TopBarAction[]>(() => {
    return [
      buildIconTopBarAction({
        id: 'refresh-price-list',
        label: 'Refresh price list',
        onPress: () => setRefreshTick((value) => value + 1),
        icon: RefreshIcon,
        disabled: isLoading,
      }),
    ];
  }, [isLoading]);

  useScreenTopBar({ title: 'Price List', actions: topBarActions });

  useEffect(() => {
    if (!isStaff) {
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (appliedFilters.category.trim()) params.set('category', appliedFilters.category.trim());
    const query = params.toString();
    const url = query ? `${ENDPOINTS.priceList.list}?${query}` : ENDPOINTS.priceList.list;

    (async () => {
      try {
        const response = await apiRequest<PriceListRow[] | { data?: PriceListRow[] }>(url, {
          method: 'GET',
          requireAuth: true,
          signal: controller.signal,
        });
        if (!controller.signal.aborted) {
          const items = Array.isArray(response) ? response : Array.isArray(response?.data) ? response.data : [];
          setAllRows(normalizePriceListRows(items));
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
  }, [isStaff, refreshTick, appliedFilters]);

  const rows = debouncedSearch.trim()
    ? allRows.filter((r) => {
        const q = debouncedSearch.trim().toLowerCase();
        return (
          (r.itemId?.toLowerCase().includes(q) ?? false) ||
          (r.description?.toLowerCase().includes(q) ?? false) ||
          (r.category?.toLowerCase().includes(q) ?? false)
        );
      })
    : allRows;

  if (!isStaff) {
    return <Redirect href="/(app)/dashboard" />;
  }

  return (
    <>
      <ScreenContent>
        <ListFilterHeader
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          onFilterPress={openModal}
          hasActiveFilters={hasActiveFilters}
          placeholder="Search price list..."
        />

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

      <FilterModal
        visible={isModalOpen}
        onClose={closeModal}
        onApply={applyFilters}
        onClear={clearFilters}
        title="Filter Price List"
      >
        <Text style={[styles.filterLabel, { color: theme.colors.textSecondary }]}>Category</Text>
        <ThemedInput
          value={draftFilters.category}
          onChangeText={(val) => setDraftFilter('category', val)}
          placeholder="e.g. Hearing Aid"
          returnKeyType="done"
          clearButtonMode="while-editing"
        />
      </FilterModal>
    </>
  );
}

function createStyles(theme: AppTheme) {
  const common = createCommonScreenStyleDefinitions(theme);

  return StyleSheet.create({
    ...common,
    filterLabel: {
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 4,
    },
  });
}
