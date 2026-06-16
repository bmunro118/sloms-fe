import { SlidersHorizontal as FiltersIcon, Search as SearchIcon } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useAppTheme } from '@theme/ThemeProvider';
import { TooltipPressable } from './TooltipPressable';
import { tokens } from '@src/theme/tokens';

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
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.row, { gap: spacing.sm, paddingBottom: spacing.sm }]}>
      <View
        style={[
          styles.searchContainer,
          {
            borderColor: focused ? colors.textPrimary : colors.border,
            borderWidth: 1,
            borderRadius: radii.md,
            backgroundColor: colors.inputBackground,
          },
        ]}
      >
        {focused ? (
          <View
            pointerEvents="none"
            style={[
              styles.focusRing,
              { borderColor: colors.textPrimary, borderRadius: radii.md },
            ]}
          />
        ) : null}
        <TextInput
          value={searchValue}
          onChangeText={onSearchChange}
          placeholder={placeholder}
          placeholderTextColor={colors.inputPlaceholder}
          returnKeyType="search"
          clearButtonMode="while-editing"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            styles.searchInput,
            { color: colors.textPrimary, borderRadius: radii.md },
          ]}
          accessibilityLabel="Search"
        />
        <View style={styles.iconOverlay} pointerEvents="none">
          <SearchIcon size={16} color={colors.inputPlaceholder} />
        </View>
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
    zIndex: tokens.zIndex.drawer,
  },
  searchContainer: {
    flex: 1,
    position: 'relative',
    borderWidth: 1,
  },
  focusRing: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
  },
  searchInput: {
    width: '100%',
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 36,
    paddingRight: 12,
    // Suppress the browser's default rectangular focus outline — focus state is
    // handled by the container border instead
    outlineStyle: 'none',
  } as any,
  iconOverlay: {
    position: 'absolute',
    left: 10,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButton: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
