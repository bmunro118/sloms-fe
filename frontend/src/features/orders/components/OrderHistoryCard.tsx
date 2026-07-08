import { ChevronDown, ChevronUp, FileText, Filter } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ThemedCard } from '@components/ui/ThemedCard';
import { OrderStatusBadge } from '@components/ui/OrderStatusBadge';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { tokens } from '@src/theme/tokens';
import { FilterOption, TimelineEntry } from '../tracking-types';

interface OrderHistoryCardProps {
  entries: TimelineEntry[];
  updateFilterOptions: FilterOption[];
  selectedStatusFilter: string;
  onFilterChange: (value: string) => void;
  isFilterOpen: boolean;
  onToggleFilter: () => void;
  expandedUpdateId: string | null;
  onToggleExpand: (id: string | null) => void;
  selectedFilterLabel: string;
}

export function OrderHistoryCard({
  entries,
  updateFilterOptions,
  selectedStatusFilter,
  onFilterChange,
  isFilterOpen,
  onToggleFilter,
  expandedUpdateId,
  onToggleExpand,
  selectedFilterLabel,
}: OrderHistoryCardProps) {
  const styles = useThemedStyles(createStyles);

  const realEntries = entries.filter((e) => e.kind !== 'pending');
  const pendingEntries = entries.filter((e) => e.kind === 'pending');
  const hasEntries = realEntries.length > 0 || pendingEntries.length > 0;

  return (
    <ThemedCard style={styles.card} title="Order History">
      {/* Filter toolbar */}
      <View style={styles.updatesToolbar}>
        <View style={styles.filterGroup}>
          <Filter size={14} color={styles.filterButtonText.color} />
          <Text style={styles.filterLabel}>Filter</Text>
        </View>

        <View style={styles.filterContainer}>
          <Pressable
            onPress={onToggleFilter}
            style={({ pressed }) => [styles.filterButton, pressed ? styles.filterButtonPressed : null]}
            accessibilityRole="button"
            accessibilityLabel="Filter history by status"
          >
            <Text style={styles.filterButtonText}>{selectedFilterLabel}</Text>
            {isFilterOpen ? (
              <ChevronUp size={14} color={styles.filterButtonText.color} />
            ) : (
              <ChevronDown size={14} color={styles.filterButtonText.color} />
            )}
          </Pressable>

          {isFilterOpen ? (
            <View style={styles.filterDropdown}>
              {updateFilterOptions.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => { onFilterChange(option.value); }}
                  style={({ pressed }) => [
                    styles.filterOption,
                    option.value === selectedStatusFilter ? styles.filterOptionActive : null,
                    pressed ? styles.filterOptionPressed : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      option.value === selectedStatusFilter ? styles.filterOptionTextActive : null,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      </View>

      {/* Timeline entries */}
      {!hasEntries ? (
        <Text style={styles.muted}>No history available for this order.</Text>
      ) : (
        <View style={styles.timeline}>
          {entries.map((entry, index) => {
            const isLast = index === entries.length - 1;
            const showConnector = !isLast;

            return (
              <View key={entry.id}>
                {entry.kind === 'status' ? (
                  <StatusEntry
                    entry={entry}
                    expandedUpdateId={expandedUpdateId}
                    onToggleExpand={onToggleExpand}
                    styles={styles}
                  />
                ) : entry.kind === 'note' ? (
                  <NoteEntry entry={entry} styles={styles} />
                ) : (
                  <PendingEntry entry={entry} styles={styles} />
                )}

                {showConnector ? (
                  <View style={styles.connectorRow}>
                    <ChevronDown
                      size={16}
                      color={entry.kind === 'pending' ? styles.connectorPending.color : styles.connectorActive.color}
                    />
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      )}
    </ThemedCard>
  );
}

type StylesType = ReturnType<typeof createStyles>;

function StatusEntry({
  entry,
  expandedUpdateId,
  onToggleExpand,
  styles,
}: {
  entry: Extract<TimelineEntry, { kind: 'status' }>;
  expandedUpdateId: string | null;
  onToggleExpand: (id: string | null) => void;
  styles: StylesType;
}) {
  const hasDetail = Boolean(entry.message || entry.note);
  const isExpanded = expandedUpdateId === entry.id;

  return (
    <View style={styles.entryRow}>
      {hasDetail ? (
        <Pressable
          onPress={() => { onToggleExpand(isExpanded ? null : entry.id); }}
          style={({ pressed }) => [styles.entryHeader, pressed ? styles.entryHeaderPressed : null]}
          accessibilityRole="button"
          accessibilityLabel={`Toggle details for ${entry.statusLabel} update`}
        >
          <View style={styles.entryHeaderMain}>
            <OrderStatusBadge status={entry.status} size="sm" context="status" />
            <Text style={styles.entryTimestamp}>{entry.timestampLabel}</Text>
          </View>
          {isExpanded ? (
            <ChevronUp size={14} color={styles.chevronMuted.color} />
          ) : (
            <ChevronDown size={14} color={styles.chevronMuted.color} />
          )}
        </Pressable>
      ) : (
        <View style={styles.entryHeader}>
          <View style={styles.entryHeaderMain}>
            <OrderStatusBadge status={entry.status} size="sm" context="status" />
            <Text style={styles.entryTimestamp}>{entry.timestampLabel}</Text>
          </View>
        </View>
      )}

      {hasDetail && isExpanded ? (
        <View style={styles.entryBody}>
          {entry.message ? <Text style={styles.entryBodyText}>{entry.message}</Text> : null}
          {entry.note ? (
            <View style={styles.noteRow}>
              <Text style={styles.fieldLabel}>Note</Text>
              <Text style={styles.fieldValue}>{entry.note}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function NoteEntry({
  entry,
  styles,
}: {
  entry: Extract<TimelineEntry, { kind: 'note' }>;
  styles: StylesType;
}) {
  return (
    <View style={[styles.entryRow, styles.noteEntryRow]}>
      <View style={styles.entryHeader}>
        <View style={styles.entryHeaderMain}>
          <View style={styles.noteIconLabel}>
            <FileText size={14} color={styles.noteIcon.color} />
            <Text style={styles.noteLabel}>Note</Text>
          </View>
          <Text style={styles.entryTimestamp}>{entry.timestampLabel}</Text>
        </View>
      </View>
      <View style={styles.entryBody}>
        <Text style={styles.noteBodyText}>{entry.message}</Text>
      </View>
    </View>
  );
}

function PendingEntry({
  entry,
  styles,
}: {
  entry: Extract<TimelineEntry, { kind: 'pending' }>;
  styles: StylesType;
}) {
  return (
    <View style={[styles.entryRow, styles.pendingEntryRow]}>
      <View style={styles.entryHeader}>
        <View style={styles.entryHeaderMain}>
          <OrderStatusBadge status={entry.status} size="sm" context="progress" state="upcoming" />
          <Text style={styles.pendingTimestamp}>Pending</Text>
        </View>
      </View>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  const common = createCommonScreenStyleDefinitions(theme);
  return StyleSheet.create({
    ...common,
    card: { ...common.card, gap: 8 },
    timeline: {
      gap: 0,
    },
    connectorRow: {
      alignItems: 'center',
      paddingVertical: 2,
    },
    connectorActive: {
      color: theme.colors.accent,
    },
    connectorPending: {
      color: theme.colors.border,
    },
    // Filter toolbar
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
    // Entry rows
    entryRow: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.md,
      backgroundColor: theme.colors.surfaceMuted,
      overflow: 'hidden',
    },
    noteEntryRow: {
      borderColor: theme.colors.borderStrong,
      backgroundColor: theme.colors.surface,
    },
    pendingEntryRow: {
      borderStyle: 'dashed',
      opacity: 0.6,
    },
    entryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      paddingHorizontal: 10,
      paddingVertical: 10,
    },
    entryHeaderPressed: {
      backgroundColor: theme.colors.navItemHoverBackground,
    },
    entryHeaderMain: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flex: 1,
      gap: 8,
      flexWrap: 'wrap',
    },
    entryTimestamp: {
      color: theme.colors.textMuted,
      fontSize: 12,
      fontWeight: '500',
    },
    pendingTimestamp: {
      color: theme.colors.textMuted,
      fontSize: 12,
      fontWeight: '500',
      fontStyle: 'italic',
    },
    entryBody: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingHorizontal: 10,
      paddingVertical: 10,
      gap: 6,
      backgroundColor: theme.colors.surface,
    },
    entryBodyText: {
      color: theme.colors.textPrimary,
      fontSize: 14,
    },
    noteIconLabel: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    noteIcon: {
      color: theme.colors.textSecondary,
    },
    noteLabel: {
      color: theme.colors.textSecondary,
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    noteBodyText: {
      color: theme.colors.textPrimary,
      fontSize: 14,
      fontStyle: 'italic',
    },
    noteRow: {
      marginTop: 4,
    },
    chevronMuted: {
      color: theme.colors.textMuted,
    },
    fieldLabel: common.fieldLabel,
    fieldValue: common.fieldValue,
  });
}
