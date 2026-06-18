import { StyleSheet, Text, View } from 'react-native';
import { ThemedButton } from '@components/ui/ThemedButton';
import { ThemedInput } from '@components/ui/ThemedInput';
import { SettingRecord, UserSettingRecord } from '@src/features/settings';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';

export function GlobalSettingRow({
  entry,
  isEditing,
  draftVal,
  onDraftChange,
}: {
  entry: SettingRecord;
  isEditing: boolean;
  draftVal: string;
  onDraftChange: (val: string) => void;
}) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.settingRow}>
      <Text style={styles.settingKey}>{entry.key}</Text>
      {entry.description ? (
        <Text style={styles.settingDescription}>{entry.description}</Text>
      ) : null}
      {isEditing ? (
        <ThemedInput
          value={draftVal}
          onChangeText={onDraftChange}
          placeholder="Value"
          style={styles.settingInput}
          autoCapitalize="none"
          autoCorrect={false}
        />
      ) : (
        <Text style={styles.settingValue}>{entry.val ?? '—'}</Text>
      )}
    </View>
  );
}

export function UserSettingRow({
  entry,
  draftVal,
  onDraftChange,
  isSaving,
  isDeleting,
  onSave,
  onDelete,
}: {
  entry: UserSettingRecord;
  draftVal: string;
  onDraftChange: (val: string) => void;
  isSaving: boolean;
  isDeleting: boolean;
  onSave: () => void;
  onDelete: () => void;
}) {
  const styles = useThemedStyles(createStyles);
  const busy = isSaving || isDeleting;

  return (
    <View style={styles.settingRow}>
      <Text style={styles.settingKey}>{entry.key}</Text>
      <ThemedInput
        value={draftVal}
        onChangeText={onDraftChange}
        placeholder="Value"
        style={styles.settingInput}
        autoCapitalize="none"
        autoCorrect={false}
        editable={!busy}
      />
      <View style={styles.userSettingActions}>
        <ThemedButton
          label={isSaving ? 'Saving…' : 'Save'}
          onPress={onSave}
          disabled={busy || draftVal === (entry.val ?? '')}
          style={styles.actionButton}
        />
        <ThemedButton
          label={isDeleting ? 'Resetting…' : 'Reset'}
          onPress={onDelete}
          variant="secondary"
          disabled={busy}
          style={styles.actionButton}
          tooltip="Reset to system default"
        />
      </View>
    </View>
  );
}

export function createStyles(theme: AppTheme) {
  const common = createCommonScreenStyleDefinitions(theme);

  return StyleSheet.create({
    ...common,
    scrollContent: {
      gap: theme.spacing.md,
      paddingBottom: theme.spacing.xxl,
    },
    card: common.card,
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sectionSubtitle: {
      fontSize: 13,
      color: theme.colors.textMuted,
      marginTop: 2,
      marginBottom: theme.spacing.sm,
    },
    editingBadge: {
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.3,
      color: theme.colors.accent,
      borderWidth: 1,
      borderColor: theme.colors.accent,
      borderRadius: theme.radii.sm,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 2,
    },
    settingRow: {
      marginTop: theme.spacing.md,
      paddingTop: theme.spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
    },
    settingKey: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      fontFamily: 'monospace',
      marginBottom: theme.spacing.xs,
    },
    settingDescription: {
      fontSize: 12,
      color: theme.colors.textMuted,
      marginBottom: theme.spacing.xs,
    },
    settingValue: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    settingInput: {
      marginTop: 2,
    },
    userSettingActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.sm,
    },
    editActionsRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.lg,
      flexWrap: 'wrap',
    },
    actionButton: {
      flexShrink: 1,
    },
  });
}
