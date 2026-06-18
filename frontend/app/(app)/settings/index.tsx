import { RefreshCw as RefreshIcon } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { ScreenContent } from '@components/layout/ScreenContent';
import { LoadingSpinner } from '@components/ui/LoadingSpinner';
import { ThemedCard } from '@components/ui/ThemedCard';
import { TopBarAction } from '@context/ScreenTitleContext';
import { buildIconTopBarAction } from '@src/features/app-shell';
import {
  UserSettingRecord,
  listUserSettings,
  upsertUserSetting,
  deleteUserSetting,
} from '@src/features/settings';
import { useAppModal } from '@src/hooks/useAppModal';
import { useScreenTopBar } from '@src/hooks/useScreenTopBar';
import { UserSettingRow, createStyles } from './SettingsSubComponents';
import { useThemedStyles } from '@theme/useThemedStyles';

export default function SettingsScreen() {
  const styles = useThemedStyles(createStyles);
  const { showConfirm, showSuccess, showDanger } = useAppModal();

  // User settings state
  const [userSettings, setUserSettings] = useState<UserSettingRecord[]>([]);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [userError, setUserError] = useState<string | null>(null);
  const [userDraft, setUserDraft] = useState<Record<string, string>>({});
  const [savingUserKey, setSavingUserKey] = useState<string | null>(null);
  const [deletingUserKey, setDeletingUserKey] = useState<string | null>(null);
  const [refreshUserTick, setRefreshUserTick] = useState(0);

  // Load user settings (all authenticated users)
  useEffect(() => {
    const controller = new AbortController();
    setIsLoadingUser(true);
    setUserError(null);

    (async () => {
      try {
        const response = await listUserSettings({ signal: controller.signal });
        if (!controller.signal.aborted) {
          const rows = Array.isArray(response?.data) ? response.data : [];
          setUserSettings(rows);
          const draft: Record<string, string> = {};
          rows.forEach((r) => { draft[r.key] = r.val ?? ''; });
          setUserDraft(draft);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setUserError(err instanceof Error ? err.message : 'Failed to load user settings.');
        }
      } finally {
        if (!controller.signal.aborted) setIsLoadingUser(false);
      }
    })();

    return () => controller.abort();
  }, [refreshUserTick]);

  const handleSaveUserSetting = useCallback(async (key: string) => {
    const val = userDraft[key] ?? '';
    setSavingUserKey(key);
    try {
      const updated = await upsertUserSetting(key, val);
      setUserSettings((prev) =>
        prev.map((r) => (r.key === key ? { ...r, val: updated.val ?? val } : r))
      );
      showSuccess('Preference saved');
    } catch (err) {
      showDanger('Save failed', err instanceof Error ? err.message : 'Could not save setting.');
    } finally {
      setSavingUserKey(null);
    }
  }, [userDraft, showSuccess, showDanger]);

  const handleDeleteUserSetting = useCallback(async (key: string) => {
    const confirmed = await showConfirm({
      title: 'Reset to default?',
      message: 'This setting will be reset to the system default.',
      confirmLabel: 'Reset',
    });
    if (!confirmed) return;

    setDeletingUserKey(key);
    try {
      await deleteUserSetting(key);
      setRefreshUserTick((t) => t + 1);
      showSuccess('Preference reset', 'Reverted to default.');
    } catch (err) {
      showDanger('Reset failed', err instanceof Error ? err.message : 'Could not reset setting.');
    } finally {
      setDeletingUserKey(null);
    }
  }, [showConfirm, showSuccess, showDanger]);

  const topBarActions = useMemo<TopBarAction[]>(() => [
    buildIconTopBarAction({
      id: 'refresh-settings',
      label: 'Refresh',
      onPress: () => setRefreshUserTick((t) => t + 1),
      icon: RefreshIcon,
      disabled: isLoadingUser,
    }),
  ], [isLoadingUser]);

  useScreenTopBar({ title: 'Settings', actions: topBarActions });

  return (
    <ScreenContent>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        <ThemedCard title="My Preferences" style={styles.card}>
          <Text style={styles.sectionSubtitle}>Personal preferences for your account.</Text>

          {isLoadingUser ? (
            <LoadingSpinner message="Loading preferences..." />
          ) : userError ? (
            <Text style={styles.error}>{userError}</Text>
          ) : userSettings.length === 0 ? (
            <Text style={styles.muted}>No preferences found.</Text>
          ) : (
            userSettings.map((entry) => (
              <UserSettingRow
                key={entry.key}
                entry={entry}
                draftVal={userDraft[entry.key] ?? entry.val ?? ''}
                onDraftChange={(val) =>
                  setUserDraft((d) => ({ ...d, [entry.key]: val }))
                }
                isSaving={savingUserKey === entry.key}
                isDeleting={deletingUserKey === entry.key}
                onSave={() => handleSaveUserSetting(entry.key)}
                onDelete={() => handleDeleteUserSetting(entry.key)}
              />
            ))
          )}
        </ThemedCard>

      </ScrollView>
    </ScreenContent>
  );
}
