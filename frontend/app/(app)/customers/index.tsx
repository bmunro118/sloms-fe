import { Redirect } from 'expo-router';
import { RefreshCw as RefreshIcon } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { ScreenContent } from '@components/layout/ScreenContent';
import { useAuth } from '@context/AuthContext';
import { TopBarAction } from '@context/ScreenTitleContext';
import { buildIconTopBarAction } from '@src/features/app-shell';
import { CustomerCard } from '@src/features/customers/components/CustomerCard';
import { useScreenTopBar } from '@src/hooks/useScreenTopBar';
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

export default function CustomersListScreen() {
  const { isStaff } = useAuth();
  const styles = useThemedStyles(createStyles);
  const [refreshTick, setRefreshTick] = useState(0);
  const [customers, setCustomers] = useState<CustomerCardRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    (async () => {
      try {
        const response = await apiRequest<CustomersResponse>(ENDPOINTS.customers.list, {
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
  }, [isStaff, refreshTick]);

  if (!isStaff) {
    return <Redirect href="/(app)/dashboard" />;
  }

  return (
    <ScreenContent>
      {isLoading ? <Text style={styles.muted}>Loading customers...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!isLoading && !error && customers.length === 0 ? <Text style={styles.muted}>No customers found.</Text> : null}
      {customers.map((customer) => (
        <CustomerCard
          key={customer.renderKey}
          customer={customer}
        />
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
