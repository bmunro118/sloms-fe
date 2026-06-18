import { Redirect } from 'expo-router';
import { Pencil as EditIcon, PencilOff as CancelEditIcon, RefreshCw as RefreshIcon } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { ScreenContent } from '@components/layout/ScreenContent';
import { LoadingSpinner } from '@components/ui/LoadingSpinner';
import { ThemedCard } from '@components/ui/ThemedCard';
import { ThemedButton } from '@components/ui/ThemedButton';
import { useAuth } from '@context/AuthContext';
import { TopBarAction } from '@context/ScreenTitleContext';
import { buildIconTopBarAction } from '@src/features/app-shell';
import {
  SettingRecord,
  UserSettingRecord,
  listSettings,
  patchSettingValue,
  listUserSettings,
  upsertUserSetting,
  deleteUserSetting,
} from '@src/features/settings';
import { useAppModal } from '@src/hooks/useAppModal';
import { useScreenTopBar } from '@src/hooks/useScreenTopBar';
import { useUnsavedChangesGuard } from '@src/hooks/useUnsavedChangesGuard';
import { GlobalSettingRow, UserSettingRow, createStyles } from './SettingsSubComponents';
import { useThemedStyles } from '@theme/useThemedStyles';

export default function SettingsScreen() {
  const { isAdmin } = useAuth();
  const styles = useThemedStyles(createStyles);
  const { showConfirm, showSuccess, showDanger } = useAppModal();

  // Global settings state
  const [globalSettings, setGlobalSettings] = useState<SettingRecord[]>([]);
  const [isLoadingGlobal, setIsLoadingGlobal] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isEditingGlobal, setIsEditingGlobal] = useState(false);
  const [isSavingGlobal, setIsSavingGlobal] = useState(false);
  const [globalDraft, setGlobalDraft] = useState<Record<string, string>>({});
  const [refreshGlobalTick, setRefreshGlobalTick] = useState(0);

  // User settings state
  const [userSettings, setUserSettings] = useState<UserSettingRecord[]>([]);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [userError, setUserError] = useState<string | null>(null);
  const [userDraft, setUserDraft] = useState<Record<string, string>>({});
  const [savingUserKey, setSavingUserKey] = useState<string | null>(null);
  const [deletingUserKey, setDeletingUserKey] = useState<string | null>(null);
  const [refreshUserTick, setRefreshUserTick] = useState(0);

  // Load global settings (Admin only)
  useEffect(() => {
    if (!isAdmin) {
      setIsLoadingGlobal(false);
      return;
    }

    const controller = new AbortController();
    setIsLoadingGlobal(true);
    setGlobalError(null);

    (async () => {
      try {
        const response = await listSettings(undefined, { signal: controller.signal });
        if (!controller.signal.aborted) {
          const rows = Array.isArray(response?.data) ? response.data : [];
          setGlobalSettings(rows);
          const draft: Record<string, string> = {};
          rows.forEach((r) => { draft[r.key] = r.val ?? ''; });
          setGlobalDraft(draft);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setGlobalError(err instanceof Error ? err.message : 'Failed to load settings.');
        }
      } finally {
        if (!controller.signal.aborted) setIsLoadingGlobal(false);
      }
    })();

    return () => controller.abort();
  }, [isAdmin, refreshGlobalTick]);

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

  const handleStartEditGlobal = useCallback(() => {
    // Reset draft to current saved values before entering edit mode
    const draft: Record<string, string> = {};
    globalSettings.forEach((r) => { draft[r.key] = r.val ?? ''; });
    setGlobalDraft(draft);
    setIsEditingGlobal(true);
  }, [globalSettings]);

  // ── Unsaved changes guard for global settings (same-screen edit, no beforeRemove) ──
  const isDirtyGlobal = useMemo(
    () => isEditingGlobal && globalSettings.some((r) => (globalDraft[r.key] ?? '') !== (r.val ?? '')),
    [isEditingGlobal, globalSettings, globalDraft],
  );

  const { guardAction: guardGlobalEdit } = useUnsavedChangesGuard({ isDirty: isDirtyGlobal });

  const handleCancelEditGlobal = useCallback(() => {
    void guardGlobalEdit(() => {
      const draft: Record<string, string> = {};
      globalSettings.forEach((r) => { draft[r.key] = r.val ?? ''; });
      setGlobalDraft(draft);
      setIsEditingGlobal(false);
    });
  }, [guardGlobalEdit, globalSettings]);

  const handleSaveAllGlobal = useCallback(async () => {
    // Find changed entries
    const changed = globalSettings.filter(
      (r) => (globalDraft[r.key] ?? '') !== (r.val ?? '')
    );

    if (changed.length === 0) {
      setIsEditingGlobal(false);
      return;
    }

    const confirmed = await showConfirm({
      title: 'Save settings?',
      message: `This will update ${changed.length} setting${changed.length === 1 ? '' : 's'}.`,
      confirmLabel: 'Save',
    });
    if (!confirmed) return;

    setIsSavingGlobal(true);
    try {
      await Promise.all(
        changed.map((r) => patchSettingValue(r.key, globalDraft[r.key] ?? ''))
      );
      showSuccess('Settings saved', `${changed.length} setting${changed.length === 1 ? '' : 's'} updated.`);
      setIsEditingGlobal(false);
      setRefreshGlobalTick((t) => t + 1);
    } catch (err) {
      showDanger('Save failed', err instanceof Error ? err.message : 'Could not save settings.');
    } finally {
      setIsSavingGlobal(false);
    }
  }, [globalSettings, globalDraft, showConfirm, showSuccess, showDanger]);

  const handleSaveUserSetting = useCallback(async (key: string) => {
    const val = userDraft[key] ?? '';
    setSavingUserKey(key);
    try {
      const updated = await upsertUserSetting(key, val);
      setUserSettings((prev) =>
        prev.map((r) => (r.key === key ? { ...r, val: updated.val ?? val } : r))
      );
      showSuccess('Setting saved');
    } catch (err) {
      showDanger('Save failed', err instanceof Error ? err.message : 'Could not save setting.');
    } finally {
      setSavingUserKey(null);
    }
  }, [userDraft, showSuccess, showDanger]);

  const handleDeleteUserSetting = useCallback(async (key: string) => {
    const confirmed = await showConfirm({
      title: 'Reset to default?',
      message: `"${key}" will be reset to the system default value.`,
      confirmLabel: 'Reset',
    });
    if (!confirmed) return;

    setDeletingUserKey(key);
    try {
      await deleteUserSetting(key);
      setRefreshUserTick((t) => t + 1);
      showSuccess('Setting reset', 'Reverted to system default.');
    } catch (err) {
      showDanger('Reset failed', err instanceof Error ? err.message : 'Could not reset setting.');
    } finally {
      setDeletingUserKey(null);
    }
  }, [showConfirm, showSuccess, showDanger]);

  const topBarActions = useMemo<TopBarAction[]>(() => {
    if (!isAdmin) return [];

    if (isEditingGlobal) {
      return [
        buildIconTopBarAction({
          id: 'save-settings',
          label: isSavingGlobal ? 'Saving…' : 'Save all changes',
          onPress: handleSaveAllGlobal,
          icon: EditIcon,
          disabled: isSavingGlobal,
        }),
        buildIconTopBarAction({
          id: 'cancel-settings-edit',
          label: 'Cancel editing',
          onPress: handleCancelEditGlobal,
          icon: CancelEditIcon,
          disabled: isSavingGlobal,
        }),
      ];
    }

    return [
      buildIconTopBarAction({
        id: 'edit-settings',
        label: 'Edit settings',
        onPress: handleStartEditGlobal,
        icon: EditIcon,
        disabled: isLoadingGlobal || globalSettings.length === 0,
      }),
      buildIconTopBarAction({
        id: 'refresh-settings',
        label: 'Refresh',
        onPress: () => {
          setRefreshGlobalTick((t) => t + 1);
          setRefreshUserTick((t) => t + 1);
        },
        icon: RefreshIcon,
        disabled: isLoadingGlobal || isLoadingUser,
      }),
    ];
  }, [
    isAdmin,
    isEditingGlobal,
    isSavingGlobal,
    isLoadingGlobal,
    isLoadingUser,
    globalSettings.length,
    handleSaveAllGlobal,
    handleCancelEditGlobal,
    handleStartEditGlobal,
  ]);

  useScreenTopBar({ title: 'Settings', actions: topBarActions });

  if (!isAdmin) {
    return <Redirect href="/(app)/dashboard" />;
  }

  return (
    <ScreenContent>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Global settings ── */}
        <ThemedCard style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Global Settings</Text>
            {isEditingGlobal ? (
              <Text style={styles.editingBadge}>Editing</Text>
            ) : null}
          </View>

          {isLoadingGlobal ? (
            <LoadingSpinner message="Loading settings..." />
          ) : globalError ? (
            <Text style={styles.error}>{globalError}</Text>
          ) : globalSettings.length === 0 ? (
            <Text style={styles.muted}>No global settings found.</Text>
          ) : (
            globalSettings.map((entry) => (
              <GlobalSettingRow
                key={entry.key}
                entry={entry}
                isEditing={isEditingGlobal}
                draftVal={globalDraft[entry.key] ?? entry.val ?? ''}
                onDraftChange={(val) =>
                  setGlobalDraft((d) => ({ ...d, [entry.key]: val }))
                }
              />
            ))
          )}

          {isEditingGlobal ? (
            <View style={styles.editActionsRow}>
              <ThemedButton
                label={isSavingGlobal ? 'Saving…' : 'Save All'}
                onPress={handleSaveAllGlobal}
                disabled={isSavingGlobal}
                style={styles.actionButton}
              />
              <ThemedButton
                label="Cancel"
                onPress={handleCancelEditGlobal}
                variant="secondary"
                disabled={isSavingGlobal}
                style={styles.actionButton}
              />
            </View>
          ) : null}
        </ThemedCard>

        {/* ── User settings ── */}
        <ThemedCard style={styles.card}>
          <Text style={styles.sectionTitle}>My Preferences</Text>
          <Text style={styles.sectionSubtitle}>Personal settings that apply only to your account.</Text>

          {isLoadingUser ? (
            <LoadingSpinner message="Loading preferences..." />
          ) : userError ? (
            <Text style={styles.error}>{userError}</Text>
          ) : userSettings.length === 0 ? (
            <Text style={styles.muted}>No personal preferences set.</Text>
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
