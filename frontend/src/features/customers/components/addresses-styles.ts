import { StyleSheet } from 'react-native';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';

export function createStyles(theme: AppTheme) {
  const common = createCommonScreenStyleDefinitions(theme);
  return StyleSheet.create({
    ...common,
    card: { ...common.card, marginBottom: 16 },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.textPrimary,
      marginBottom: 12,
    },
    muted: {
      fontSize: 14,
      color: theme.colors.textMuted,
    },
    field: { marginTop: theme.spacing.sm },
    fieldLabel: common.fieldLabel,
    fieldValue: common.fieldValue,
    label: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    formGroup: { marginBottom: 12 },
    addressBlock: {
      paddingBottom: 12,
      marginBottom: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    addressBlockLast: {
      borderBottomWidth: 0,
      marginBottom: 0,
      paddingBottom: 0,
    },
    addressHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    addressTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textPrimary,
      flex: 1,
    },
    defaultBadge: {
      fontSize: 12,
      color: theme.colors.accent,
      fontWeight: '400',
    },
    detailBlock: { marginBottom: 8 },
    actionRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 8,
    },
    actionBtn: { flex: 1, minWidth: 80 },
    rowBtn: { marginLeft: 8 },
    dangerText: { color: theme.colors.danger },
    addRow: { marginTop: 12, alignItems: 'flex-end' },
    addBtn: {},
  });
}

export type StylesRef = ReturnType<typeof createStyles>;
