import { StyleSheet, Text, View } from 'react-native';
import { ThemedButton } from '@components/ui/ThemedButton';
import { ThemedInput } from '@components/ui/ThemedInput';
import { UserSettingRecord } from '@src/features/settings';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';

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
      <Text style={styles.fieldLabel}>{entry.key}</Text>
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
          variant="solid"
        />
        <ThemedButton
          label={isDeleting ? 'Resetting…' : 'Reset'}
          onPress={onDelete}
          variant="outline"
          disabled={busy}
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
    sectionSubtitle: {
      fontSize: 13,
      color: theme.colors.textMuted,
      marginTop: 2,
      marginBottom: theme.spacing.sm,
    },
    settingRow: {
      marginTop: theme.spacing.md,
      paddingTop: theme.spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
      gap: theme.spacing.xs,
    },
    settingInput: {
      marginTop: 2,
    },
    userSettingActions: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.sm,
    },
  });
}
