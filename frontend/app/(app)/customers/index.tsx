import { Redirect, useRouter } from 'expo-router';
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
  const router = useRouter();
  const { isStaff } = useAuth();
  const styles = useThemedStyles(createStyles);
  useScreenTitle('Customers');
  const [customers, setCustomers] = useState<CustomerCardRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isStaff) {
      return;
    }

    const controller = new AbortController();
    (async () => {
      try {
        const response = await apiRequest<CustomersResponse>(ENDPOINTS.customers.list, {
          method: 'GET',
          requireAuth: true,
          signal: controller.signal,
        });
        if (!controller.signal.aborted) {
          console.log('[CustomersListScreen] API response:', response);
          if (response?.data && response.data.length > 0) {
            console.log('[CustomersListScreen] First customer object keys:', Object.keys(response.data[0]));
            console.log('[CustomersListScreen] First customer object:', response.data[0]);
          }
          const normalized = normalizeCustomers(Array.isArray(response?.data) ? response.data : []);
          console.log('[CustomersListScreen] Normalized customers:', normalized);
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
  }, [isStaff]);

  if (!isStaff) {
    return <Redirect href="/(app)/dashboard" />;
  }

  return (
    <ScreenContent>
      {isLoading ? <Text style={styles.muted}>Loading customers...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!isLoading && !error && customers.length === 0 ? <Text style={styles.muted}>No customers found.</Text> : null}
      {customers.map((customer) => (
        <ThemedCard
          key={customer.renderKey}
          style={styles.card}
          onPress={() => {
            const route = `/(app)/customers/${customer.customerId}`;
            console.log('[CustomersListScreen] Navigating to customer:', {
              customer,
              route,
              customerId: customer.customerId,
              customerIdType: typeof customer.customerId,
            });
            router.push(route as never);
          }}
        >
          <Text style={styles.cardTitle}>{customer.companyName ?? `Customer #${customer.customerId}`}</Text>
          <Text style={styles.cardMeta}>Account: {customer.accountNumber ?? 'N/A'}</Text>
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
