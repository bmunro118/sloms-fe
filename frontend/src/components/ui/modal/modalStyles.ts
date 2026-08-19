import { StyleSheet } from 'react-native';
import { AppTheme } from '@theme/types';
import { ModalPresentation } from './modalPresentation';

export function createStyles(theme: AppTheme, presentation: ModalPresentation) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
    },
    sheet: {
      width: '100%',
      borderWidth: 1,
    },
    sheetWeb: {
      maxWidth: 480,
      marginBottom: 'auto',
      marginTop: 'auto',
      alignSelf: 'center',
      borderRadius: 12,
    },
    handle: {
      alignSelf: 'center',
      width: 36,
      height: 4,
      borderRadius: 2,
      marginTop: 10,
      marginBottom: 4,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: 4,
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
      paddingBottom: 4,
    },
    title: {
      fontSize: 18,
      fontWeight: '800',
      marginBottom: theme.spacing.sm,
    },
    closeButtonPressed: {
      opacity: 0.7,
    },
    iconWrap: {
      flexShrink: 0,
    },
    message: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
    typeChip: {
      alignSelf: 'flex-start',
      borderRadius: theme.radii.sm,
      backgroundColor: presentation.chipColor,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 4,
      flexShrink: 0,
    },
    typeChipText: {
      color: presentation.accentColor,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.2,
      textTransform: 'uppercase',
    },
    actionsRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      flexWrap: 'wrap',
      justifyContent: 'flex-end',
    },
    actionButton: {
      minWidth: 104,
      minHeight: 38,
      borderRadius: theme.radii.md,
      paddingHorizontal: theme.spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    actionPrimary: {
      backgroundColor: theme.colors.accent,
      borderColor: theme.colors.accent,
    },
    actionPrimaryHovered: {
      backgroundColor: theme.colors.accentMuted,
      borderColor: theme.colors.accentMuted,
    },
    actionSecondary: {
      backgroundColor: theme.colors.buttonSecondaryBackground,
      borderColor: theme.colors.buttonSecondaryBorder,
    },
    actionSecondaryHovered: {
      backgroundColor: theme.colors.surfaceMuted,
      borderColor: theme.colors.borderStrong,
    },
    actionDanger: {
      backgroundColor: theme.colors.buttonDangerBackground,
      borderColor: theme.colors.buttonDangerBackground,
    },
    actionDangerHovered: {
      backgroundColor: theme.colors.danger,
      borderColor: theme.colors.danger,
    },
    actionPressed: {
      opacity: 0.82,
      transform: [{ scale: 0.97 }],
    },
    actionDisabled: {
      opacity: 0.65,
    },
    actionText: {
      fontSize: 14,
      fontWeight: '700',
    },
    actionTextPrimary: {
      color: theme.colors.accentText,
    },
    actionTextSecondary: {
      color: theme.colors.buttonSecondaryText,
    },
  });
}
