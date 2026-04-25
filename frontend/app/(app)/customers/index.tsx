import { Redirect } from 'expo-router';
import { RefreshCw as RefreshIcon } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { ScreenContent } from '@components/layout/ScreenContent';
import { FilterModal } from '@components/ui/FilterModal';
import { ListFilterHeader } from '@components/ui/ListFilterHeader';
import { useAuth } from '@context/AuthContext';
import { TopBarAction } from '@context/ScreenTitleContext';
import { buildIconTopBarAction } from '@src/features/app-shell';
import { CustomerCard } from '@src/features/customers/components/CustomerCard';
import { useListFilters } from '@src/hooks/useListFilters';
import { useScreenTopBar } from '@src/hooks/useScreenTopBar';
import { useAppTheme } from '@theme/ThemeProvider';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';
import { apiRequest } from '@utils/api';
import { ENDPOINTS } from '@utils/config';

type Customer = {
  customerId: number;
  companyName?: string;
  accountNumber?: string;
};

type CustomerCardRow = Customer & {
  renderKey: string;
};

type CustomersResponse = {
  data?: Customer[];
};

type CustomerFilters = {
  includeSuspended: boolean;
};

function resolveCustomerKeyBase(customer: Customer): string {
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

function normalizeCustomers(rows: Customer[]): CustomerCardRow[] {
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
  const { isStaff } = useAuth();
  const styles = useThemedStyles(createStyles);
  const theme = useAppTheme();
  const [refreshTick, setRefreshTick] = useState(0);
  const [customers, setCustomers] = useState<CustomerCardRow[]>([]);
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
  } = useListFilters<CustomerFilters>(INITIAL_FILTERS);

  const topBarActions = useMemo<TopBarAction[]>(() => {
    return [
      buildIconTopBarAction({
        id: 'refresh-customers',
        label: 'Refresh customers',
        onPress: () => setRefreshTick((value) => value + 1),
        icon: RefreshIcon,
        disabled: isLoading,
      }),
    ];
  }, [isLoading]);

  useScreenTopBar({ title: 'Customers', actions: topBarActions });

  useEffect(() => {
    if (!isStaff) {
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (appliedFilters.includeSuspended) params.set('includeSuspended', 'true');
    const query = params.toString();
    const url = query ? `${ENDPOINTS.customers.list}?${query}` : ENDPOINTS.customers.list;

    (async () => {
      try {
        const response = await apiRequest<CustomersResponse>(url, {
          method: 'GET',
          requireAuth: true,
          signal: controller.signal,
        });
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
  }, [isStaff, refreshTick, appliedFilters]);

  const filteredCustomers = debouncedSearch.trim()
    ? customers.filter((c) => {
        const q = debouncedSearch.trim().toLowerCase();
        return (
          (c.companyName?.toLowerCase().includes(q) ?? false) ||
          (c.accountNumber?.toLowerCase().includes(q) ?? false)
        );
      })
    : customers;

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

        {isLoading ? <Text style={styles.muted}>Loading customers...</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!isLoading && !error && filteredCustomers.length === 0 ? <Text style={styles.muted}>No customers found.</Text> : null}
        {filteredCustomers.map((customer) => (
          <CustomerCard
            key={customer.renderKey}
            customer={customer}
          />
        ))}
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
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
  });
}
