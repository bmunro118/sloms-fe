import { Redirect, useLocalSearchParams } from 'expo-router';
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

type CustomerDetails = {
  id: number;
  companyName?: string;
  accountNumber?: string;
  contactName?: string;
  contactEmail?: string;
};

export default function CustomerDetailScreen() {
  const { isStaff } = useAuth();
  const styles = useThemedStyles(createStyles);
  useScreenTitle('Customer Detail');
  const params = useLocalSearchParams<{ id: string }>();
  const customerId = Number(params.id);

  const [customer, setCustomer] = useState<CustomerDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isStaff) {
      return;
    }

    const controller = new AbortController();
    (async () => {
      try {
        const response = await apiRequest<CustomerDetails>(ENDPOINTS.customers.byId(customerId), {
          method: 'GET',
          requireAuth: true,
          signal: controller.signal,
        });
        if (!controller.signal.aborted) setCustomer(response);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Failed to load customer.');
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    })();

    return () => {
      controller.abort();
    };
  }, [customerId, isStaff]);

  if (!isStaff) {
    return <Redirect href="/(app)/dashboard" />;
  }

  return (
    <ScreenContent>
      {isLoading ? <Text style={styles.muted}>Loading...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!isLoading && customer ? (
        <ThemedCard style={styles.card}>
          <Text style={styles.item}>ID: {customer.id}</Text>
          <Text style={styles.item}>Company: {customer.companyName ?? 'N/A'}</Text>
          <Text style={styles.item}>Account: {customer.accountNumber ?? 'N/A'}</Text>
          <Text style={styles.item}>Contact: {customer.contactName ?? 'N/A'}</Text>
          <Text style={styles.item}>Email: {customer.contactEmail ?? 'N/A'}</Text>
        </ThemedCard>
      ) : null}
    </ScreenContent>
  );
}

function createStyles(theme: AppTheme) {
  const common = createCommonScreenStyleDefinitions(theme);

  return StyleSheet.create({
    ...common,
    card: {
      ...common.card,
      gap: 6,
    },
    item: common.cardItem,
  });
}
