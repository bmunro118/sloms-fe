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
  id: number;
  companyName?: string;
  accountNumber?: string;
};

type CustomersResponse = {
  data?: Customer[];
};

export default function CustomersListScreen() {
  const router = useRouter();
  const { isStaff } = useAuth();
  const styles = useThemedStyles(createStyles);
  useScreenTitle('Customers');
  const [customers, setCustomers] = useState<Customer[]>([]);
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
          setCustomers(Array.isArray(response?.data) ? response.data : []);
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
      {customers.map((customer, index) => (
        <ThemedCard
          key={
            customer.id != null
              ? `customer-${customer.id}`
              : `customer-${customer.accountNumber ?? 'unknown'}-${index}`
          }
          style={styles.card}
          onPress={() => router.push(`/(app)/customers/${customer.id}` as never)}
        >
          <Text style={styles.cardTitle}>{customer.companyName ?? `Customer #${customer.id}`}</Text>
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
