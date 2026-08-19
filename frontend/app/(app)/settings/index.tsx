import { useCallback, useEffect, useState } from 'react';
import { Platform, RefreshControl, ScrollView, Text } from 'react-native';
import { ScreenContent } from '@components/layout/ScreenContent';
import { LoadingSpinner } from '@components/ui/LoadingSpinner';
import { ThemedCard } from '@components/ui/ThemedCard';
import {
  SettingRecord,
  listSettings,
  patchSettingValue,
  GlobalSettingRow,
  createStyles,
} from '@src/features/settings';
import { useAppModal } from '@src/hooks/useAppModal';
import { useScreenTopBar } from '@src/hooks/useScreenTopBar';
import { useThemedStyles } from '@theme/useThemedStyles';

export default function SettingsScreen() {
  const styles = useThemedStyles(createStyles);
  const { showSuccess, showDanger } = useAppModal();

  // Global settings state
  const [settings, setSettings] = useState<SettingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handlePullToRefresh = useCallback(() => {
    setIsRefreshing(true);
    setRefreshTick((t) => t + 1);
  }, []);

  useEffect(() => {
    if (!isLoading) setIsRefreshing(false);
  }, [isLoading]);

  // Load global settings (admin only)
  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    (async () => {
      try {
        const response = await listSettings(
          { includeHidden: true },
          { signal: controller.signal }
        );
        if (!controller.signal.aborted) {
          const rows = Array.isArray(response?.data) ? response.data : [];
          setSettings(rows);
          const nextDraft: Record<string, string> = {};
          rows.forEach((r) => { nextDraft[r.key] = r.val ?? ''; });
          setDraft(nextDraft);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Failed to load settings.');
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    })();

    return () => controller.abort();
  }, [refreshTick]);

  const handleSaveGlobalSetting = useCallback(async (key: string) => {
    const val = draft[key] ?? '';
    setSavingKey(key);
    try {
      const updated = await patchSettingValue(key, val);
      setSettings((prev) =>
        prev.map((r) => (r.key === key ? { ...r, val: updated.val ?? val } : r))
      );
      setDraft((d) => ({ ...d, [key]: updated.val ?? val }));
      showSuccess('Setting saved');
    } catch (err) {
      showDanger('Save failed', err instanceof Error ? err.message : 'Could not save setting.');
    } finally {
      setSavingKey(null);
    }
  }, [draft, showSuccess, showDanger]);

  useScreenTopBar({ title: 'Settings' });

  return (
    <ScreenContent>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          Platform.OS !== 'web' ? (
            <RefreshControl refreshing={isRefreshing} onRefresh={handlePullToRefresh} />
          ) : undefined
        }
      >

        <ThemedCard title="Company Settings" style={styles.card}>
          <Text style={styles.sectionSubtitle}>Application-wide configuration values.</Text>

          {isLoading ? (
            <LoadingSpinner message="Loading settings..." />
          ) : error ? (
            <Text style={styles.error}>{error}</Text>
          ) : settings.length === 0 ? (
            <Text style={styles.muted}>No settings found.</Text>
          ) : (
            settings.map((entry) => (
              <GlobalSettingRow
                key={entry.key}
                entry={entry}
                draftVal={draft[entry.key] ?? entry.val ?? ''}
                onDraftChange={(val) =>
                  setDraft((d) => ({ ...d, [entry.key]: val }))
                }
                isSaving={savingKey === entry.key}
                onSave={() => handleSaveGlobalSetting(entry.key)}
              />
            ))
          )}
        </ThemedCard>

      </ScrollView>
    </ScreenContent>
  );
}
