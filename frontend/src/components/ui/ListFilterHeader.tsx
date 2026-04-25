import { SlidersHorizontal as FiltersIcon, Search as SearchIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useAppTheme } from '@theme/ThemeProvider';
import { ThemedInput } from './ThemedInput';
import { TooltipPressable } from './TooltipPressable';

interface ListFilterHeaderProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onFilterPress: () => void;
  hasActiveFilters: boolean;
  placeholder?: string;
  showFilterButton?: boolean;
}

export function ListFilterHeader({
  searchValue,
  onSearchChange,
  onFilterPress,
  hasActiveFilters,
  placeholder = 'Search...',
  showFilterButton = true,
}: ListFilterHeaderProps) {
  const { colors, radii, spacing } = useAppTheme();

  return (
    <View style={[styles.row, { gap: spacing.sm, paddingBottom: spacing.sm }]}>
      <View style={styles.searchWrap}>
        <SearchIcon
          size={16}
          color={colors.inputPlaceholder}
          style={styles.searchIcon}
        />
        <ThemedInput
          value={searchValue}
          onChangeText={onSearchChange}
          placeholder={placeholder}
          returnKeyType="search"
          clearButtonMode="while-editing"
          style={styles.searchInput}
          accessibilityLabel="Search"
        />
      </View>

      {showFilterButton ? (
        <TooltipPressable
          tooltip="Filter"
          onPress={onFilterPress}
          style={[
            styles.filterButton,
            {
              borderRadius: radii.md,
              borderColor: hasActiveFilters ? colors.accent : colors.border,
              backgroundColor: hasActiveFilters ? colors.accentMuted : colors.inputBackground,
            },
          ]}
          accessibilityLabel="Open filters"
          accessibilityRole="button"
        >
          <FiltersIcon
            size={18}
            color={hasActiveFilters ? colors.accent : colors.textSecondary}
          />
        </TooltipPressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchWrap: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: 10,
    zIndex: 1,
  },
  searchInput: {
    paddingLeft: 34,
  },
  filterButton: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
