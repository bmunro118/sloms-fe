import { Text, View } from 'react-native';

import { LoadingSpinner } from '@components/ui/LoadingSpinner';
import { ThemedButton } from '@components/ui/ThemedButton';
import { ThemedCard } from '@components/ui/ThemedCard';
import { ListFilterHeader } from '@components/ui/ListFilterHeader';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';

import { ItemsTabProps } from './types';

export function ItemsTab({
  filteredItems,
  isLoading,
  error,
  expandedItemId,
  itemDetail,
  itemLists,
  isItemDetailLoading,
  searchQuery,
  hasActiveFilters,
  isAdmin,
  onSearchChange,
  onFilterPress,
  onToggleItem,
  onVoidItem,
}: ItemsTabProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <>
      <ListFilterHeader
        searchValue={searchQuery}
        onSearchChange={onSearchChange}
        onFilterPress={onFilterPress}
        hasActiveFilters={hasActiveFilters}
        placeholder="Search price list..."
      />
      {isLoading ? <LoadingSpinner message="Loading price list..." fullScreen /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!isLoading && !error && filteredItems.length === 0 ? (
        <Text style={styles.muted}>No price list items found.</Text>
      ) : null}

      {filteredItems.map((item) => {
        const isExpanded = expandedItemId === item.itemId;
        return (
          <ThemedCard key={item.itemId ?? item.description} style={styles.card}>
            <View style={styles.rowHeader}>
              <View style={styles.rowInfo}>
                <Text style={styles.cardTitle}>{item.itemId ?? 'Unnamed'}</Text>
                <Text style={styles.cardMeta}>{item.category ?? 'No category'}</Text>
              </View>
              <ThemedButton
                label={isExpanded ? 'Collapse' : 'View'}
                variant="secondary"
                onPress={() => { void onToggleItem(item.itemId ?? ''); }}
                style={styles.rowBtn}
              />
            </View>

            {isExpanded ? (
              isItemDetailLoading ? (
                <LoadingSpinner message="Loading detail..." />
              ) : (
                <>
                  {itemDetail?.description ? (
                    <Text style={styles.cardMeta}>{itemDetail.description}</Text>
                  ) : item.description ? (
                    <Text style={styles.cardMeta}>{item.description}</Text>
                  ) : null}

                  {itemLists.length > 0 ? (
                    <View style={styles.listPricesBlock}>
                      <Text style={styles.subHeading}>List Prices</Text>
                      {itemLists.map((lp) => (
                        <View key={lp.listName} style={styles.listPriceRow}>
                          <Text style={styles.listPriceName}>{lp.listName}</Text>
                          <Text style={styles.listPriceValue}>
                            {lp.price != null ? `£${lp.price.toFixed(2)}` :
                             lp.unitPrice != null ? `£${lp.unitPrice.toFixed(2)}` : '\u2014'}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : null}

                  {isAdmin ? (
                    <ThemedButton
                      label="Void Item"
                      variant="secondary"
                      onPress={() => { void onVoidItem(item.itemId ?? ''); }}
                      style={styles.voidBtn}
                      textStyle={styles.dangerText}
                    />
                  ) : null}
                </>
              )
            ) : null}
          </ThemedCard>
        );
      })}
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

function createStyles(theme: AppTheme) {
  const common = createCommonScreenStyleDefinitions(theme);

  return {
    ...common,
    rowHeader: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      justifyContent: 'space-between' as const,
    },
    rowInfo: { flex: 1 },
    rowBtn: { marginLeft: 8, flexShrink: 0 },
    subHeading: {
      fontSize: 13,
      fontWeight: '600' as const,
      color: theme.colors.textSecondary,
      marginBottom: 6,
      marginTop: 8,
    },
    listPricesBlock: { marginTop: 4 },
    listPriceRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      paddingVertical: 3,
      borderBottomWidth: 1 as const,
      borderBottomColor: theme.colors.border,
    },
    listPriceName: { fontSize: 13, color: theme.colors.textPrimary },
    listPriceValue: { fontSize: 13, color: theme.colors.textSecondary },
    voidBtn: { marginTop: 10, alignSelf: 'flex-start' as const },
    dangerText: { color: theme.colors.danger },
  };
}
