import { StyleSheet } from 'react-native';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { tokens } from '@src/theme/tokens';

export function createStyles(theme: AppTheme) {
  const common = createCommonScreenStyleDefinitions(theme);

  return StyleSheet.create({
    ...common,
    scrollContent: {
      gap: 10,
      paddingBottom: 8,
    },
    card: {
      ...common.card,
      gap: 8,
    },
    field: { marginTop: theme.spacing.sm },
    summaryHeadRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      flexWrap: 'wrap',
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: theme.radii.md,
      borderWidth: 1,
      borderColor: theme.colors.borderStrong,
      backgroundColor: theme.colors.accentMuted,
      alignSelf: 'flex-start',
    },
    badgeText: {
      color: theme.colors.textPrimary,
      fontWeight: '700',
      fontSize: 12,
    },
    badgeTextReceived: {
      color: theme.colors.statusReceivedText,
      fontWeight: '700',
      fontSize: 12,
    },
    badgeTextInProgress: {
      color: theme.colors.statusInProgressText,
      fontWeight: '700',
      fontSize: 12,
    },
    badgeTextComplete: {
      color: theme.colors.statusCompleteText,
      fontWeight: '700',
      fontSize: 12,
    },
    // Status-specific badge backgrounds (subtle)
    statusBadgeReceived: {
      backgroundColor: theme.colors.statusReceived,
      borderColor: theme.colors.border,
    },
    statusBadgeInProgress: {
      backgroundColor: theme.colors.statusInProgress,
      borderColor: theme.colors.accent,
    },
    statusBadgeComplete: {
      backgroundColor: theme.colors.statusComplete,
      borderColor: theme.colors.accent,
    },
    stepRail: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    stepChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.md,
      backgroundColor: theme.colors.surfaceMuted,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    stepChipReceived: {
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.statusReceived,
    },
    stepChipInProgress: {
      borderColor: theme.colors.accent,
      backgroundColor: theme.colors.statusInProgress,
    },
    stepChipComplete: {
      borderColor: theme.colors.accent,
      backgroundColor: theme.colors.statusComplete,
    },
    stepChipCurrent: {
      borderColor: theme.colors.borderStrong,
      backgroundColor: theme.colors.navItemHoverBackground,
    },
    stepChipText: {
      color: theme.colors.textSecondary,
      fontWeight: '600',
      fontSize: 12,
    },
    stepChipStateText: {
      color: theme.colors.textPrimary,
    },
    // Vertical timeline (mobile)
    verticalTimeline: {
      paddingLeft: tokens.spacing.lg,
      position: 'relative' as const,
    },
    timelineNode: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.colors.surface,
      borderWidth: 2,
      borderColor: theme.colors.border,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      zIndex: tokens.zIndex.content,
    },
    timelineNodeComplete: {
      borderColor: theme.colors.accent,
      backgroundColor: theme.colors.accentMuted,
    },
    timelineNodeCurrent: {
      borderColor: theme.colors.borderStrong,
      backgroundColor: theme.colors.navItemHoverBackground,
    },
    timelineConnector: {
      position: 'absolute' as const,
      left: 11,
      top: 24,
      bottom: 0,
      width: 2,
      backgroundColor: theme.colors.border,
    },
    timelineRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: tokens.spacing.md,
      gap: tokens.spacing.md,
    },
    timelineRowLast: {
      marginBottom: 0,
    },
    timelineLabel: {
      flex: 1,
      fontWeight: '600' as const,
      fontSize: 14,
    },
    timelineLabelMuted: {
      color: theme.colors.textMuted,
      fontWeight: '600' as const,
      fontSize: 14,
    },
    // ── Centered Progress Timeline (dot-chevron-dot design) ─────────────────────
    progressContainer: {
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingVertical: tokens.spacing.md,
    },
    progressContainerVertical: {
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingHorizontal: tokens.spacing.md,
      gap: tokens.spacing.xs,
    },
    progressRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      flexWrap: 'wrap' as const,
      gap: tokens.spacing.sm,
    },
    progressItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: tokens.spacing.xs,
    },
    progressColumnItem: {
      flexDirection: 'column' as const,
      alignItems: 'center' as const,
      gap: tokens.spacing.xs,
    },
    // Step badge styles (refined from stepChip)
    stepBadge: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.md,
      backgroundColor: theme.colors.surfaceMuted,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    stepBadgeCurrent: {
      borderColor: theme.colors.borderStrong,
      backgroundColor: theme.colors.navItemHoverBackground,
    },
    stepBadgeUpcoming: {
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceMuted,
      opacity: 0.7,
    },
    stepBadgeText: {
      color: theme.colors.textSecondary,
      fontWeight: '600' as const,
      fontSize: 12,
    },
    stepBadgeStateText: {
      color: theme.colors.textPrimary,
    },
    stepBadgeUpcomingText: {
      color: theme.colors.textMuted,
    },
    // Connector dot styles
    connectorDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.border,
      marginHorizontal: 2,
    },
    connectorDotVertical: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.border,
      marginVertical: 2,
    },
    connectorDotActive: {
      backgroundColor: theme.colors.accentMuted,
    },
    connectorDotActiveLight: {
      backgroundColor: theme.colors.accentMuted,
      opacity: 0.35,
    },
    // Connector chevron styles
    connectorChevron: {
      color: theme.colors.border,
      marginHorizontal: 2,
    },
    connectorChevronVertical: {
      color: theme.colors.border,
      marginVertical: 2,
    },
    connectorChevronActive: {
      color: theme.colors.accentMuted,
    },
    problemRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: theme.radii.md,
      borderWidth: 1,
    },
    problemRowWarn: {
      borderColor: theme.colors.danger,
      backgroundColor: theme.colors.dangerSurface,
    },
    problemRowOk: {
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceMuted,
    },
    problemWarnText: {
      color: theme.colors.danger,
      flex: 1,
    },
    problemOkText: {
      color: theme.colors.textSecondary,
      flex: 1,
    },
    updatesToolbar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      flexWrap: 'wrap',
    },
    filterGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    filterLabel: {
      color: theme.colors.textSecondary,
      fontWeight: '600',
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    filterContainer: {
      minWidth: 170,
      position: 'relative',
      zIndex: tokens.zIndex.filterDropdown,
    },
    filterButton: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.inputBackground,
      borderRadius: theme.radii.md,
      paddingHorizontal: 10,
      paddingVertical: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    filterButtonPressed: {
      backgroundColor: theme.colors.surfaceMuted,
    },
    filterButtonText: {
      color: theme.colors.textPrimary,
      fontWeight: '600',
      fontSize: 13,
      flexShrink: 1,
    },
    filterDropdown: {
      position: 'absolute',
      top: 42,
      left: 0,
      right: 0,
      borderWidth: 1,
      borderColor: theme.colors.borderStrong,
      borderRadius: theme.radii.md,
      backgroundColor: theme.colors.surfaceElevated,
      padding: 4,
      gap: 2,
    },
    filterOption: {
      paddingHorizontal: 8,
      paddingVertical: 8,
      borderRadius: theme.radii.sm,
    },
    filterOptionActive: {
      backgroundColor: theme.colors.accentMuted,
    },
    filterOptionPressed: {
      backgroundColor: theme.colors.navItemHoverBackground,
    },
    filterOptionText: {
      color: theme.colors.textSecondary,
      fontSize: 13,
    },
    filterOptionTextActive: {
      color: theme.colors.textPrimary,
      fontWeight: '600',
    },
    updateRow: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.md,
      backgroundColor: theme.colors.surfaceMuted,
      overflow: 'hidden',
    },
    updateHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      paddingHorizontal: 10,
      paddingVertical: 10,
    },
    updateHeaderPressed: {
      backgroundColor: theme.colors.navItemHoverBackground,
    },
    updateHeaderMain: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flex: 1,
      gap: 8,
      flexWrap: 'wrap',
    },
    updateStatusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: theme.radii.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      alignSelf: 'flex-start',
    },
    updateTimestamp: {
      color: theme.colors.textMuted,
      fontSize: 12,
      fontWeight: '500',
    },
    updateBody: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingHorizontal: 10,
      paddingVertical: 10,
      gap: 6,
      backgroundColor: theme.colors.surface,
    },
    itemRow: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.md,
      backgroundColor: theme.colors.surfaceMuted,
      paddingHorizontal: 10,
      paddingVertical: 8,
      gap: 4,
    },
    itemTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      flexWrap: 'wrap',
    },
    itemStatusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: theme.radii.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    itemBadgeText: {
      color: theme.colors.textSecondary,
      fontSize: 12,
      fontWeight: '600',
    },
    rawPayload: {
      color: theme.colors.textSecondary,
      fontFamily: 'monospace',
      fontSize: 12,
      lineHeight: 18,
    },
  });
}
