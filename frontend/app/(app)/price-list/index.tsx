import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@context/AuthContext';
import { apiRequest } from '@utils/api';
import { ENDPOINTS } from '@utils/config';

type PriceListRow = {
  itemId?: string;
  description?: string;
  category?: string;
};

export default function PriceListScreen() {
  const { isStaff } = useAuth();
  const [rows, setRows] = useState<PriceListRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const response = await apiRequest<PriceListRow[] | { data?: PriceListRow[] }>(ENDPOINTS.priceList.list, {
          method: 'GET',
          requireAuth: true,
        });
        if (mounted) {
          const items = Array.isArray(response) ? response : Array.isArray(response?.data) ? response.data : [];
          setRows(items);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load price list.');
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (!isStaff) {
    return <Redirect href="/(app)/dashboard" />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Price List</Text>
      {isLoading ? <Text style={styles.muted}>Loading price list...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!isLoading && !error && rows.length === 0 ? <Text style={styles.muted}>No price list items found.</Text> : null}
      {rows.map((row, index) => (
        <View key={`${row.itemId ?? 'item'}-${index}`} style={styles.card}>
          <Text style={styles.cardTitle}>{row.itemId ?? 'Unnamed item'}</Text>
          <Text style={styles.cardMeta}>Category: {row.category ?? 'N/A'}</Text>
          <Text style={styles.cardMeta}>{row.description ?? 'No description'}</Text>
        </View>
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
