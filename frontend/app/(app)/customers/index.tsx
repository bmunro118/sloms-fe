import { Redirect, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@context/AuthContext';
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
    <View style={styles.container}>
      <Text style={styles.title}>Customers</Text>
      {isLoading ? <Text style={styles.muted}>Loading customers...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!isLoading && !error && customers.length === 0 ? <Text style={styles.muted}>No customers found.</Text> : null}
      {customers.map((customer) => (
        <Pressable
          key={customer.id}
          style={styles.card}
          onPress={() => router.push(`/(app)/customers/${customer.id}` as never)}
        >
          <Text style={styles.cardTitle}>{customer.companyName ?? `Customer #${customer.id}`}</Text>
          <Text style={styles.cardMeta}>Account: {customer.accountNumber ?? 'N/A'}</Text>
        </Pressable>
      ))}
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
  },
  cardTitle: {
    fontWeight: '700',
    color: '#0f172a',
  },
  cardMeta: {
    color: '#475569',
    marginTop: 4,
  },
});
