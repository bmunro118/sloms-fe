import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@context/AuthContext';
import { apiRequest } from '@utils/api';
import { ENDPOINTS } from '@utils/config';

type SettingRow = {
  key: string;
  val?: string;
  description?: string;
};

type SettingsResponse = {
  data?: SettingRow[];
};

export default function SettingsScreen() {
  const { isAdmin } = useAuth();
  const [settings, setSettings] = useState<SettingRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const response = await apiRequest<SettingsResponse>(ENDPOINTS.settings.list, {
          method: 'GET',
          requireAuth: true,
        });
        if (mounted) {
          setSettings(Array.isArray(response?.data) ? response.data : []);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load settings.');
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (!isAdmin) {
    return <Redirect href="/(app)/dashboard" />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      {isLoading ? <Text style={styles.muted}>Loading settings...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!isLoading && !error && settings.length === 0 ? <Text style={styles.muted}>No settings found.</Text> : null}
      {settings.map((entry) => (
        <View key={entry.key} style={styles.card}>
          <Text style={styles.cardTitle}>{entry.key}</Text>
          <Text style={styles.cardMeta}>Value: {entry.val ?? 'N/A'}</Text>
          <Text style={styles.cardMeta}>{entry.description ?? 'No description'}</Text>
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
