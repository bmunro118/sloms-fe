import { AppTheme } from '@theme/types';

export function createCommonScreenStyleDefinitions(theme: AppTheme) {
  return {
    title: {
      fontSize: 28,
      fontWeight: '800' as const,
      color: theme.colors.textPrimary,
    },
    meta: {
      color: theme.colors.textSecondary,
    },
    sectionTitle: {
      marginTop: theme.spacing.sm,
      fontSize: 16,
      fontWeight: '700' as const,
      color: theme.colors.textPrimary,
    },
    muted: {
      color: theme.colors.textMuted,
    },
    error: {
      color: theme.colors.danger,
    },
    status: {
      color: theme.colors.textSecondary,
    },
    card: {
      borderRadius: theme.radii.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.md,
    },
    cardTitle: {
      fontWeight: '700' as const,
      color: theme.colors.textPrimary,
    },
    cardMeta: {
      color: theme.colors.textMuted,
      marginTop: theme.spacing.xs,
    },
    cardItem: {
      color: theme.colors.textPrimary,
    },
    fieldLabel: {
      fontSize: 12,
      fontWeight: '600' as const,
      color: theme.colors.textMuted,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.3,
      marginBottom: theme.spacing.xs,
    },
    fieldValue: {
      fontSize: 15,
      color: theme.colors.textPrimary,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.md,
      backgroundColor: theme.colors.inputBackground,
      color: theme.colors.textPrimary,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: 10,
    },
    primaryButton: {
      borderRadius: theme.radii.md,
      backgroundColor: theme.colors.accent,
      paddingHorizontal: 14,
      paddingVertical: 10,
      alignItems: 'center' as const,
    },
    primaryButtonText: {
      color: theme.colors.accentText,
      fontWeight: '700' as const,
    },
    secondaryButton: {
      borderRadius: theme.radii.md,
      borderWidth: 1,
      borderColor: theme.colors.buttonSecondaryBorder,
      backgroundColor: theme.colors.buttonSecondaryBackground,
      paddingHorizontal: 14,
      paddingVertical: 10,
      alignItems: 'center' as const,
    },
    secondaryButtonText: {
      color: theme.colors.buttonSecondaryText,
      fontWeight: '700' as const,
    },
    outlineButton: {
      borderRadius: theme.radii.md,
      borderWidth: 1,
      borderColor: theme.colors.buttonSecondaryBorder,
      backgroundColor: theme.colors.buttonSecondaryBackground,
      paddingHorizontal: 14,
      paddingVertical: 10,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    outlineButtonText: {
      color: theme.colors.buttonSecondaryText,
      fontWeight: '700' as const,
      fontSize: 15,
    },
    disabled: {
      opacity: 0.65,
    },
    contentActionRowRight: {
      alignItems: 'flex-end' as const,
      marginTop: 2,
      marginBottom: 2,
    },
    contentActionButton: {
      minHeight: 36,
      borderRadius: 10,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      flexDirection: 'row' as const,
      gap: 8,
      paddingHorizontal: 12,
      backgroundColor: theme.colors.navBackground,
      borderWidth: 1,
      borderColor: theme.colors.navBorder,
    },
    contentActionButtonPressed: {
      backgroundColor: theme.colors.navItemHoverBackground,
    },
    contentActionButtonHover: {
      backgroundColor: theme.colors.navItemHoverBackground,
    },
    contentActionButtonDisabled: {
      opacity: 0.55,
    },
    contentActionButtonText: {
      color: theme.colors.navTextStrong,
      fontSize: 14,
      fontWeight: '600' as const,
    },
    contentActionButtonTextDisabled: {
      color: theme.colors.textMuted,
    },
    twoColumnRow: {
      flexDirection: 'row' as const,
      gap: theme.spacing.md,
    },
    twoColumnField: {
      flex: 1,
    },
  };
}