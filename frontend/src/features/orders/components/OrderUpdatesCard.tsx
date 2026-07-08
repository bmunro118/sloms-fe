import { ChevronDown, ChevronUp, Filter } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ThemedCard } from '@components/ui/ThemedCard';
import { OrderStatusBadge } from '@components/ui/OrderStatusBadge';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { tokens } from '@src/theme/tokens';
import {
  FilterOption,
  TimelineUpdate,
} from '../tracking-types';

interface OrderUpdatesCardProps {
  updates: TimelineUpdate[];
  updateFilterOptions: FilterOption[];
  selectedStatusFilter: string;
  onFilterChange: (value: string) => void;
  isFilterOpen: boolean;
  onToggleFilter: () => void;
  expandedUpdateId: string | null;
  onToggleExpand: (id: string | null) => void;
  selectedFilterLabel: string;
}

export function OrderUpdatesCard({
  updates,
  updateFilterOptions,
  selectedStatusFilter,
  onFilterChange,
  isFilterOpen,
  onToggleFilter,
  expandedUpdateId,
  onToggleExpand,
  selectedFilterLabel,
}: OrderUpdatesCardProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <ThemedCard style={styles.card} title="Updates">
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
            accessibilityLabel="Filter updates by status"
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
                  onPress={() => {
                    onFilterChange(option.value);
                  }}
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

      {/* Update rows */}
      {updates.length === 0 ? (
        <Text style={styles.muted}>No updates match this filter.</Text>
      ) : (
        updates.map((entry) => {
          const hasDetail = Boolean(entry.message || entry.note);
          const isExpanded = expandedUpdateId === entry.id;

          return (
            <View key={entry.id} style={styles.updateRow}>
              {hasDetail ? (
                <Pressable
                  onPress={() => {
                    onToggleExpand(isExpanded ? null : entry.id);
                  }}
                  style={({ pressed }) => [styles.updateHeader, pressed ? styles.updateHeaderPressed : null]}
                  accessibilityRole="button"
                  accessibilityLabel={`Toggle details for ${entry.statusLabel} update`}
                >
                  <View style={styles.updateHeaderMain}>
                    <OrderStatusBadge status={entry.status} size="sm" />
                    <Text style={styles.updateTimestamp}>{entry.timestampLabel}</Text>
                  </View>
                  {isExpanded ? (
                    <ChevronUp size={14} color={styles.cardMeta.color} />
                  ) : (
                    <ChevronDown size={14} color={styles.cardMeta.color} />
                  )}
                </Pressable>
              ) : (
                <View style={styles.updateHeader}>
                  <View style={styles.updateHeaderMain}>
                    <OrderStatusBadge status={entry.status} size="sm" />
                    <Text style={styles.updateTimestamp}>{entry.timestampLabel}</Text>
                  </View>
                </View>
              )}

              {hasDetail && isExpanded ? (
                <View style={styles.updateBody}>
                  {entry.message ? <Text style={styles.cardItem}>{entry.message}</Text> : null}
                  {entry.note ? (
                    <View style={styles.updateNoteRow}>
                      <Text style={styles.fieldLabel}>Note</Text>
                      <Text style={styles.fieldValue}>{entry.note}</Text>
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>
          );
        })
      )}
    </ThemedCard>
  );
}

function createStyles(theme: AppTheme) {
  const common = createCommonScreenStyleDefinitions(theme);
  return StyleSheet.create({
    ...common,
    card: { ...common.card, gap: 8 },
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
    updateNoteRow: {
      marginTop: 4,
    },
    fieldLabel: common.fieldLabel,
    fieldValue: common.fieldValue,
    cardMeta: {
      color: theme.colors.textMuted,
      fontSize: 12,
    },
    cardItem: {
      color: theme.colors.textPrimary,
      fontSize: 14,
    },
  });
}
