import { Redirect } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { ScreenContent } from '@components/layout/ScreenContent';
import { FilterModal } from '@components/ui/FilterModal';
import { ThemedInput } from '@components/ui/ThemedInput';
import { useScreenTopBar } from '@src/hooks/useScreenTopBar';
import { useAppTheme } from '@theme/ThemeProvider';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';
import { featureFlags } from '@utils/features';

import { Tab } from './types';
import { usePriceList } from './usePriceList';
import { ItemsTab } from './ItemsTab';
import { RevisionsTab } from './RevisionsTab';
import { TypesTab } from './TypesTab';

// ── Screen ────────────────────────────────────────────────────────────────────

export default function PriceListScreen() {
  const styles = useThemedStyles(createStyles);
  const theme = useAppTheme();

  const {
    isStaff,
    isAdmin,
    activeTab,
    setActiveTab,
    filteredItems,
    isItemsLoading,
    itemsError,
    expandedItemId,
    itemDetail,
    itemLists,
    isItemDetailLoading,
    revisions,
    isRevisionsLoading,
    revisionsError,
    expandedRevisionId,
    revisionDetail,
    isRevisionDetailLoading,
    listTypes,
    isTypesLoading,
    typesError,
    searchQuery,
    hasActiveFilters,
    draftFilters,
    isModalOpen,
    setSearchQuery,
    setDraftFilter,
    openModal,
    closeModal,
    applyFilters,
    clearFilters,
    handleToggleItem,
    handleVoidItem,
    handleToggleRevision,
    handleActivateRevision,
    handleDeleteType,
    topBarActions,
  } = usePriceList();

  useScreenTopBar({ title: 'Price List', actions: topBarActions });

  // Feature flag guard — redirect to dashboard if disabled
  if (!featureFlags.priceListPage) {
    return <Redirect href="/(app)/dashboard" />;
  }

  if (!isStaff) return <Redirect href="/(app)/dashboard" />;

  // ── Tab list (filtered by enabled features) ──────────────────────────────────
  const tabs: Tab[] = (['items'] as Tab[])
    .concat(featureFlags.priceListRevisions ? ['revisions'] : [])
    .concat(featureFlags.priceListTypes ? ['types'] : []);

  const hasMultipleTabs = tabs.length > 1;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <ScreenContent>
        {/* Tab bar — only shown when more than one tab is enabled */}
        {hasMultipleTabs ? (
          <View style={styles.tabBar}>
            {tabs.map((tab) => (
              <Pressable
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
                  {tab === 'items' ? 'Items' : tab === 'revisions' ? 'Revisions' : 'List Types'}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {/* ── Items tab ── */}
        {activeTab === 'items' ? (
          <ItemsTab
            filteredItems={filteredItems}
            isLoading={isItemsLoading}
            error={itemsError}
            expandedItemId={expandedItemId}
            itemDetail={itemDetail}
            itemLists={itemLists}
            isItemDetailLoading={isItemDetailLoading}
            searchQuery={searchQuery}
            hasActiveFilters={hasActiveFilters}
            isAdmin={isAdmin}
            onSearchChange={setSearchQuery}
            onFilterPress={openModal}
            onToggleItem={handleToggleItem}
            onVoidItem={handleVoidItem}
          />
        ) : null}

        {/* ── Revisions tab ── */}
        {activeTab === 'revisions' ? (
          <RevisionsTab
            revisions={revisions}
            isLoading={isRevisionsLoading}
            error={revisionsError}
            expandedRevisionId={expandedRevisionId}
            revisionDetail={revisionDetail}
            isRevisionDetailLoading={isRevisionDetailLoading}
            isAdmin={isAdmin}
            onToggleRevision={handleToggleRevision}
            onActivateRevision={handleActivateRevision}
          />
        ) : null}

        {/* ── List Types tab ── */}
        {activeTab === 'types' ? (
          <TypesTab
            listTypes={listTypes}
            isLoading={isTypesLoading}
            error={typesError}
            isAdmin={isAdmin}
            onDeleteType={handleDeleteType}
          />
        ) : null}
      </ScreenContent>

      <FilterModal
        visible={isModalOpen}
        onClose={closeModal}
        onApply={applyFilters}
        onClear={clearFilters}
        title="Filter Price List"
      >
        <Text style={[styles.filterLabel, { color: theme.colors.textSecondary }]}>Category</Text>
        <ThemedInput
          value={draftFilters.category}
          onChangeText={(val) => setDraftFilter('category', val)}
          placeholder="e.g. Hearing Aid"
          returnKeyType="done"
          clearButtonMode="while-editing"
        />
      </FilterModal>
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

function createStyles(theme: AppTheme) {
  return {
    tabBar: {
      flexDirection: 'row' as const,
      marginBottom: 12,
      borderBottomWidth: 1 as const,
      borderBottomColor: theme.colors.border,
    },
    tab: {
      flex: 1,
      alignItems: 'center' as const,
      paddingVertical: 10,
    },
    tabActive: {
      borderBottomWidth: 2,
      borderBottomColor: theme.colors.accent,
    },
    tabLabel: {
      fontSize: 14,
      fontWeight: '500' as const,
      color: theme.colors.textSecondary,
    },
    tabLabelActive: {
      color: theme.colors.accent,
      fontWeight: '600' as const,
    },
    filterLabel: {
      fontSize: 12,
      fontWeight: '600' as const,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.5,
      marginBottom: 4,
    },
  };
}
