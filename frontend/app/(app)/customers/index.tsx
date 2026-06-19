import { Redirect, useRouter } from 'expo-router';
import { Building2 as CreateCustomerIcon } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, RefreshControl, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { ScreenContent } from '@components/layout/ScreenContent';
import { FilterModal } from '@components/ui/FilterModal';
import { ListFilterHeader } from '@components/ui/ListFilterHeader';
import { LoadingSpinner } from '@components/ui/LoadingSpinner';
import { useAuth } from '@context/AuthContext';
import { TopBarAction } from '@context/ScreenTitleContext';
import { buildIconTopBarAction } from '@src/features/app-shell';
import { listCustomers, CustomerRecord } from '@src/features/customers/api';
import { CustomerCard } from '@src/features/customers/components/CustomerCard';
import { useListFilters } from '@src/hooks/useListFilters';
import { useScreenTopBar } from '@src/hooks/useScreenTopBar';
import { useAppTheme } from '@theme/ThemeProvider';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';

type CustomerCardRow = CustomerRecord & {
  renderKey: string;
};

type CustomerFilters = {
  includeSuspended: boolean;
};

function resolveCustomerKeyBase(customer: CustomerRecord): string {
  if (typeof customer.customerId === 'number' && Number.isFinite(customer.customerId)) {
    return `id:${customer.customerId}`;
  }

  if (customer.accountNumber?.trim()) {
    return `account:${customer.accountNumber.trim().toLowerCase()}`;
  }

  if (customer.companyName?.trim()) {
    return `company:${customer.companyName.trim().toLowerCase()}`;
  }

  return 'unknown-customer';
}

function normalizeCustomers(rows: CustomerRecord[]): CustomerCardRow[] {
  const keyCounts = new Map<string, number>();

  return rows.map((customer) => {
    const baseKey = resolveCustomerKeyBase(customer);
    const nextCount = (keyCounts.get(baseKey) ?? 0) + 1;
    keyCounts.set(baseKey, nextCount);

    return {
      ...customer,
      renderKey: nextCount === 1 ? baseKey : `${baseKey}#${nextCount}`,
    };
  });
}

const INITIAL_FILTERS: CustomerFilters = { includeSuspended: false };

export default function CustomersListScreen() {
  const { isStaff, role, canMutate } = useAuth();
  const router = useRouter();
  const styles = useThemedStyles(createStyles);
  const theme = useAppTheme();
  const [refreshTick, setRefreshTick] = useState(0);
  const [customers, setCustomers] = useState<CustomerCardRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handlePullToRefresh = useCallback(() => {
    setIsRefreshing(true);
    setRefreshTick((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!isLoading) setIsRefreshing(false);
  }, [isLoading]);

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
  } = useListFilters<CustomerFilters>(INITIAL_FILTERS);

  const topBarActions = useMemo<TopBarAction[]>(() => {
    return [
      buildIconTopBarAction({
        id: 'create-customer',
        label: 'Create customer',
        onPress: () => router.push('/(app)/customers/create' as never),
        icon: CreateCustomerIcon,
        disabled: isLoading,
        hidden: role !== 'Admin' && role !== 'Manager',
      }),
    ];
  }, [isLoading, role, router]);

  useScreenTopBar({ title: 'Customers', actions: topBarActions });

  useEffect(() => {
    if (!isStaff) {
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    (async () => {
      try {
        const response = await listCustomers(undefined, { signal: controller.signal });
        if (!controller.signal.aborted) {
          const normalized = normalizeCustomers(Array.isArray(response?.data) ? response.data : []);
          setCustomers(normalized);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Failed to load customers.');
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    })();
    return () => {
      controller.abort();
    };
  }, [isStaff, refreshTick]);

  const customersByFilter = appliedFilters.includeSuspended
    ? customers
    : customers.filter((c) => c.isSuspended !== true);

  const filteredCustomers = debouncedSearch.trim()
    ? customersByFilter.filter((c) => {
        const q = debouncedSearch.trim().toLowerCase();
        return (
          (c.companyName?.toLowerCase().includes(q) ?? false) ||
          (c.accountNumber?.toLowerCase().includes(q) ?? false)
        );
      })
    : customersByFilter;

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
          placeholder="Search customers..."
        />

        {isLoading ? <LoadingSpinner message="Loading customers..." fullScreen /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!isLoading && !error ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              Platform.OS !== 'web' ? (
                <RefreshControl refreshing={isRefreshing} onRefresh={handlePullToRefresh} />
              ) : undefined
            }
          >
            {filteredCustomers.length === 0 ? <Text style={styles.muted}>No customers found.</Text> : null}
            {filteredCustomers.map((customer) => (
              <CustomerCard
                key={customer.renderKey}
                customer={customer}
                canMutate={canMutate}
              />
            ))}
          </ScrollView>
        ) : null}
      </ScreenContent>

      <FilterModal
        visible={isModalOpen}
        onClose={closeModal}
        onApply={applyFilters}
        onClear={clearFilters}
        title="Filter Customers"
      >
        <View style={styles.toggleRow}>
          <Text style={{ color: theme.colors.textPrimary }}>Include suspended</Text>
          <Switch
            value={draftFilters.includeSuspended}
            onValueChange={(val) => setDraftFilter('includeSuspended', val)}
            trackColor={{ true: theme.colors.accent, false: theme.colors.border }}
            thumbColor={theme.colors.surface}
          />
        </View>
      </FilterModal>
    </>
  );
}

function createStyles(theme: AppTheme) {
  const common = createCommonScreenStyleDefinitions(theme);

  return StyleSheet.create({
    ...common,
    listContent: {
      gap: 12,
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
  });
}
