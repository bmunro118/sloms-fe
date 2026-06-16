import { StyleSheet } from 'react-native';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';

export function createItemsStyles(theme: AppTheme) {
  const common = createCommonScreenStyleDefinitions(theme);
  return StyleSheet.create({
    ...common,
    card: { ...common.card, gap: 8 },
    itemCard: { ...common.card, gap: 6, marginTop: 4 },
    addSection: { gap: 8, marginBottom: 12 },
    sectionLabel: { ...common.meta, marginTop: 4 },
    addButton: { alignSelf: 'flex-end' },
    itemHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: theme.radii.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    statusText: { fontWeight: '700', fontSize: 12 },
    badgeActive: {
      backgroundColor: theme.colors.statusReceived,
      borderColor: theme.colors.border,
    },
    badgeComplete: {
      backgroundColor: theme.colors.statusComplete,
      borderColor: theme.colors.accent,
    },
    badgeVoided: {
      backgroundColor: theme.colors.dangerSurface,
      borderColor: theme.colors.danger,
    },
    badgeTextActive: { color: theme.colors.statusReceivedText },
    badgeTextComplete: { color: theme.colors.statusCompleteText },
    badgeTextVoided: { color: theme.colors.danger },
    field: { marginTop: theme.spacing.sm },
    fieldLabel: common.fieldLabel,
    fieldValue: common.fieldValue,
  });
}
