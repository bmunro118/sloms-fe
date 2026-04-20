import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@context/AuthContext';
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
  const params = useLocalSearchParams<{ id: string }>();
  const customerId = Number(params.id);

  const [customer, setCustomer] = useState<CustomerDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const response = await apiRequest<CustomerDetails>(ENDPOINTS.customers.byId(customerId), {
          method: 'GET',
          requireAuth: true,
        });
        if (mounted) setCustomer(response);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load customer.');
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [customerId]);

  if (!isStaff) {
    return <Redirect href="/(app)/dashboard" />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Customer Detail</Text>
      {isLoading ? <Text style={styles.muted}>Loading...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!isLoading && customer ? (
        <View style={styles.card}>
          <Text style={styles.item}>ID: {customer.id}</Text>
          <Text style={styles.item}>Company: {customer.companyName ?? 'N/A'}</Text>
          <Text style={styles.item}>Account: {customer.accountNumber ?? 'N/A'}</Text>
          <Text style={styles.item}>Contact: {customer.contactName ?? 'N/A'}</Text>
          <Text style={styles.item}>Email: {customer.contactEmail ?? 'N/A'}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
  },
  muted: {
    color: '#64748b',
  },
  error: {
    color: '#b91c1c',
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    padding: 12,
    gap: 6,
  },
  item: {
    color: '#0f172a',
  },
});
