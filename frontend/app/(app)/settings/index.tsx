import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { ScreenContent } from '@components/layout/ScreenContent';
import { ThemedCard } from '@components/ui/ThemedCard';
import { useAuth } from '@context/AuthContext';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';
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
  const styles = useThemedStyles(createStyles);
  const [settings, setSettings] = useState<SettingRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    const controller = new AbortController();
    (async () => {
      try {
        const response = await apiRequest<SettingsResponse>(ENDPOINTS.settings.list, {
          method: 'GET',
          requireAuth: true,
          signal: controller.signal,
        });
        if (!controller.signal.aborted) {
          setSettings(Array.isArray(response?.data) ? response.data : []);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Failed to load settings.');
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    })();
    return () => {
      controller.abort();
    };
  }, [isAdmin]);

  if (!isAdmin) {
    return <Redirect href="/(app)/dashboard" />;
  }

  return (
    <ScreenContent>
      <Text style={styles.title}>Settings</Text>
      {isLoading ? <Text style={styles.muted}>Loading settings...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!isLoading && !error && settings.length === 0 ? <Text style={styles.muted}>No settings found.</Text> : null}
      {settings.map((entry) => (
        <ThemedCard key={entry.key} style={styles.card}>
          <Text style={styles.cardTitle}>{entry.key}</Text>
          <Text style={styles.cardMeta}>Value: {entry.val ?? 'N/A'}</Text>
          <Text style={styles.cardMeta}>{entry.description ?? 'No description'}</Text>
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
