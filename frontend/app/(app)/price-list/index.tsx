import * as DocumentPicker from 'expo-document-picker';
import { Redirect } from 'expo-router';
import {
  Download as DownloadIcon,
  RefreshCw as RefreshIcon,
  Upload as UploadIcon,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenContent } from '@components/layout/ScreenContent';
import { ThemedButton } from '@components/ui/ThemedButton';
import { ThemedCard } from '@components/ui/ThemedCard';
import { FilterModal } from '@components/ui/FilterModal';
import { ListFilterHeader } from '@components/ui/ListFilterHeader';
import { ThemedInput } from '@components/ui/ThemedInput';
import { useAuth } from '@context/AuthContext';
import { TopBarAction } from '@context/ScreenTitleContext';
import { buildIconTopBarAction } from '@src/features/app-shell';
import {
  PriceListItem,
  PriceListRevision,
  PriceListRevisionDetail,
  PriceListType,
  ItemListPrice,
  activateRevision,
  deletePriceListType,
  getItemLists,
  getRevision,
  getPriceListItem,
  listPriceListItems,
  listPriceListTypes,
  listRevisions,
  voidPriceListItem,
  getExportCsvUrl,
  importPriceListCsv,
} from '@src/features/price-list/api';
import { downloadAndShareCsvNative } from '@src/features/price-list/csv-export';
import { useAppModal } from '@src/hooks/useAppModal';
import { useListFilters } from '@src/hooks/useListFilters';
import { useScreenTopBar } from '@src/hooks/useScreenTopBar';
import { useAppTheme } from '@theme/ThemeProvider';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';
import { ENDPOINTS } from '@utils/config';
import { FEATURE_FLAGS } from '@utils/feature-flags';

// ── Types ─────────────────────────────────────────────────────────────────────

type PriceListFilters = { category: string };

type Tab = 'items' | 'revisions' | 'types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalizePriceListItems(raw: unknown): PriceListItem[] {
  if (Array.isArray(raw)) return raw as PriceListItem[];
  const r = raw as { data?: PriceListItem[] };
  return Array.isArray(r?.data) ? r.data : [];
}

function normalizeRevisions(raw: unknown): PriceListRevision[] {
  if (Array.isArray(raw)) return raw as PriceListRevision[];
  const r = raw as { data?: PriceListRevision[] };
  return Array.isArray(r?.data) ? r.data : [];
}

function normalizeItemLists(raw: unknown): ItemListPrice[] {
  if (Array.isArray(raw)) return raw as ItemListPrice[];
  const r = raw as { data?: ItemListPrice[] };
  return Array.isArray(r?.data) ? r.data : [];
}

function statusColor(
  status: PriceListRevision['status'],
  theme: ReturnType<typeof useAppTheme>
): string {
  if (status === 'active') return theme.colors.accent;
  if (status === 'draft') return theme.colors.textSecondary;
  return theme.colors.textMuted;
}

function formatDate(iso?: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

const INITIAL_FILTERS: PriceListFilters = { category: '' };

// ── Screen ────────────────────────────────────────────────────────────────────

export default function PriceListScreen() {
  const { isStaff, isAdmin } = useAuth();
  const styles = useThemedStyles(createStyles);
  const theme = useAppTheme();
  const { showConfirm, showSuccess, showDanger, showInfo } = useAppModal();
  const [activeTab, setActiveTab] = useState<Tab>('items');
  const [refreshTick, setRefreshTick] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // ── Items tab state ──────────────────────────────────────────────────────
  const [allItems, setAllItems] = useState<PriceListItem[]>([]);
  const [isItemsLoading, setIsItemsLoading] = useState(true);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [itemDetail, setItemDetail] = useState<PriceListItem | null>(null);
  const [itemLists, setItemLists] = useState<ItemListPrice[]>([]);
  const [isItemDetailLoading, setIsItemDetailLoading] = useState(false);

  // ── Revisions tab state ──────────────────────────────────────────────────
  const [revisions, setRevisions] = useState<PriceListRevision[]>([]);
  const [isRevisionsLoading, setIsRevisionsLoading] = useState(true);
  const [revisionsError, setRevisionsError] = useState<string | null>(null);
  const [expandedRevisionId, setExpandedRevisionId] = useState<number | null>(null);
  const [revisionDetail, setRevisionDetail] = useState<PriceListRevisionDetail | null>(null);
  const [isRevisionDetailLoading, setIsRevisionDetailLoading] = useState(false);

  // ── List types tab state ─────────────────────────────────────────────────
  const [listTypes, setListTypes] = useState<PriceListType[]>([]);
  const [isTypesLoading, setIsTypesLoading] = useState(true);
  const [typesError, setTypesError] = useState<string | null>(null);

  const {
    appliedFilters,
    draftFilters,
    searchQuery,
    debouncedSearch,
    isModalOpen,
    hasActiveFilters,
    setSearchQuery,
    setDraftFilter,
    openModal,
    closeModal,
    applyFilters,
    clearFilters,
  } = useListFilters<PriceListFilters>(INITIAL_FILTERS);

  // ── Load items ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isStaff) return;
    const controller = new AbortController();
    setIsItemsLoading(true);
    setItemsError(null);
    (async () => {
      try {
        const response = await listPriceListItems(undefined, { signal: controller.signal });
        if (!controller.signal.aborted) setAllItems(normalizePriceListItems(response));
      } catch (err) {
        if (!controller.signal.aborted)
          setItemsError(err instanceof Error ? err.message : 'Failed to load price list.');
      } finally {
        if (!controller.signal.aborted) setIsItemsLoading(false);
      }
    })();
    return () => controller.abort();
  }, [isStaff, refreshTick]);

  // ── Load revisions ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isStaff || !FEATURE_FLAGS.priceListRevisions) return;
    const controller = new AbortController();
    setIsRevisionsLoading(true);
    setRevisionsError(null);
    (async () => {
      try {
        const response = await listRevisions({ signal: controller.signal });
        if (!controller.signal.aborted) setRevisions(normalizeRevisions(response));
      } catch (err) {
        if (!controller.signal.aborted)
          setRevisionsError(err instanceof Error ? err.message : 'Failed to load revisions.');
      } finally {
        if (!controller.signal.aborted) setIsRevisionsLoading(false);
      }
    })();
    return () => controller.abort();
  }, [isStaff, refreshTick]);

  // ── Load list types ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isStaff || !FEATURE_FLAGS.priceListTypes) return;
    const controller = new AbortController();
    setIsTypesLoading(true);
    setTypesError(null);
    (async () => {
      try {
        const response = await listPriceListTypes({ signal: controller.signal });
        if (!controller.signal.aborted) {
          const types = Array.isArray(response)
            ? response
            : (response as { data?: PriceListType[] }).data ?? [];
          setListTypes(types);
        }
      } catch (err) {
        if (!controller.signal.aborted)
          setTypesError(err instanceof Error ? err.message : 'Failed to load list types.');
      } finally {
        if (!controller.signal.aborted) setIsTypesLoading(false);
      }
    })();
    return () => controller.abort();
  }, [isStaff, refreshTick]);
  const handleToggleItem = useCallback(async (itemId: string) => {
    if (expandedItemId === itemId) {
      setExpandedItemId(null);
      setItemDetail(null);
      setItemLists([]);
      return;
    }
    setExpandedItemId(itemId);
    setItemDetail(null);
    setItemLists([]);
    setIsItemDetailLoading(true);
    try {
      const [detail, lists] = await Promise.all([
        getPriceListItem(itemId),
        getItemLists(itemId),
      ]);
      setItemDetail(detail);
      setItemLists(normalizeItemLists(lists));
    } catch {
      // silently fall back — basic info already in the list row
    } finally {
      setIsItemDetailLoading(false);
    }
  }, [expandedItemId]);

  // ── Void item ─────────────────────────────────────────────────────────────
  const handleVoidItem = useCallback(async (itemId: string) => {
    const confirmed = await showConfirm({
      title: 'Void price list item?',
      message: `Item "${itemId}" will be soft-deleted from the price list.`,
      confirmLabel: 'Void',
      confirmVariant: 'danger',
    });
    if (!confirmed) return;
    try {
      await voidPriceListItem(itemId);
      showSuccess('Item voided', `"${itemId}" has been removed from the price list.`);
      setExpandedItemId(null);
      setRefreshTick((t) => t + 1);
    } catch (err) {
      showDanger('Void failed', err instanceof Error ? err.message : 'Could not void item.');
    }
  }, [showConfirm, showDanger, showSuccess]);

  // ── Expand revision: fetch detail ─────────────────────────────────────────
  const handleToggleRevision = useCallback(async (revisionId: number) => {
    if (expandedRevisionId === revisionId) {
      setExpandedRevisionId(null);
      setRevisionDetail(null);
      return;
    }
    setExpandedRevisionId(revisionId);
    setRevisionDetail(null);
    setIsRevisionDetailLoading(true);
    try {
      const detail = await getRevision(revisionId);
      setRevisionDetail(detail);
    } catch {
      // silently fall back — basic info already shown
    } finally {
      setIsRevisionDetailLoading(false);
    }
  }, [expandedRevisionId]);

  // ── Activate revision ─────────────────────────────────────────────────────
  const handleActivateRevision = useCallback(async (revision: PriceListRevision) => {
    const confirmed = await showConfirm({
      title: 'Activate revision?',
      message: `Revision #${revision.id}${revision.name ? ` "${revision.name}"` : ''} will become the active price list, replacing the current one.`,
      confirmLabel: 'Activate',
    });
    if (!confirmed) return;
    try {
      await activateRevision(revision.id);
      showSuccess('Revision activated', `Revision #${revision.id} is now the active price list.`);
      setRefreshTick((t) => t + 1);
    } catch (err) {
      showDanger('Activation failed', err instanceof Error ? err.message : 'Could not activate revision.');
    }
  }, [showConfirm, showDanger, showSuccess]);

  // ── Export CSV ────────────────────────────────────────────────────────────
  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const fileName = `price-list-${Date.now()}.csv`;
      const exportUrl = getExportCsvUrl();

      if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof document !== 'undefined') {
        const anchor = document.createElement('a');
        anchor.href = ENDPOINTS.priceList.exportCsv;
        anchor.download = fileName;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        showSuccess('Export started', 'Price list CSV download has been triggered.');
        return;
      }

      const result = await downloadAndShareCsvNative(exportUrl, fileName);
      if (result.shared) {
        showSuccess('Export ready', 'CSV downloaded and share sheet opened.');
      } else {
        showInfo('Export downloaded', `Saved to ${result.fileUri}.`);
      }
    } catch (err) {
      showDanger('Export failed', err instanceof Error ? err.message : 'Could not export price list.');
    } finally {
      setIsExporting(false);
    }
  }, [showDanger, showInfo, showSuccess]);

  // ── Import CSV ────────────────────────────────────────────────────────────
  const handleImport = useCallback(async () => {
    setIsImporting(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', '*/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const asset = result.assets[0];
      const summary = await importPriceListCsv(asset.uri, asset.name ?? 'import.csv');

      const imported = summary.imported ?? 0;
      const skipped = summary.skipped ?? 0;
      const errors = summary.errors ?? [];

      if (errors.length > 0) {
        showDanger(
          'Import completed with errors',
          `${imported} imported, ${skipped} skipped. Errors: ${errors.slice(0, 3).join('; ')}${errors.length > 3 ? '…' : ''}`
        );
      } else {
        showSuccess('Import complete', `${imported} items imported${skipped ? `, ${skipped} skipped` : ''}.`);
      }

      setRefreshTick((t) => t + 1);
    } catch (err) {
      if (err instanceof Error && err.message === 'USER_CANCELED') return;
      showDanger('Import failed', err instanceof Error ? err.message : 'Could not import price list.');
    } finally {
      setIsImporting(false);
    }
  }, [showDanger, showSuccess]);

  // ── TopBar ────────────────────────────────────────────────────────────────
  const topBarActions = useMemo<TopBarAction[]>(() => {
    const actions: TopBarAction[] = [
      buildIconTopBarAction({
        id: 'export-price-list',
        label: isExporting ? 'Exporting…' : 'Export CSV',
        onPress: () => { void handleExport(); },
        icon: DownloadIcon,
        disabled: isExporting,
      }),
    ];

    if (isAdmin) {
      actions.push(
        buildIconTopBarAction({
          id: 'import-price-list',
          label: isImporting ? 'Importing…' : 'Import CSV',
          onPress: () => { void handleImport(); },
          icon: UploadIcon,
          disabled: isImporting,
        })
      );
    }

    actions.push(
      buildIconTopBarAction({
        id: 'refresh-price-list',
        label: 'Refresh',
        onPress: () => setRefreshTick((t) => t + 1),
        icon: RefreshIcon,
        disabled: isItemsLoading || isRevisionsLoading,
      })
    );

    return actions;
  }, [handleExport, handleImport, isAdmin, isExporting, isImporting, isItemsLoading, isRevisionsLoading]);

  useScreenTopBar({ title: 'Price List', actions: topBarActions });

  if (!isStaff) return <Redirect href="/(app)/dashboard" />;

  // ── Filtered items ─────────────────────────────────────────────────────────
  const filteredItems = useMemo(() => {
    let rows = allItems;
    if (appliedFilters.category.trim()) {
      rows = rows.filter((r) =>
        r.category?.toLowerCase().includes(appliedFilters.category.trim().toLowerCase()) ?? false
      );
    }
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.trim().toLowerCase();
      rows = rows.filter(
        (r) =>
          (r.itemId?.toLowerCase().includes(q) ?? false) ||
          (r.description?.toLowerCase().includes(q) ?? false) ||
          (r.category?.toLowerCase().includes(q) ?? false)
      );
    }
    return rows;
  }, [allItems, appliedFilters.category, debouncedSearch]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <ScreenContent>
        {/* Tab bar — only shown when more than one tab is enabled */}
        {(FEATURE_FLAGS.priceListRevisions || FEATURE_FLAGS.priceListTypes) ? (
        <View style={styles.tabBar}>
          {(['items', ...(FEATURE_FLAGS.priceListRevisions ? ['revisions'] : []), ...(FEATURE_FLAGS.priceListTypes ? ['types'] : [])] as Tab[]).map((tab) => (
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
          <>
            <ListFilterHeader
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
              onFilterPress={openModal}
              hasActiveFilters={hasActiveFilters}
              placeholder="Search price list..."
            />
            {isItemsLoading ? <Text style={styles.muted}>Loading price list...</Text> : null}
            {itemsError ? <Text style={styles.error}>{itemsError}</Text> : null}
            {!isItemsLoading && !itemsError && filteredItems.length === 0 ? (
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
                      onPress={() => { void handleToggleItem(item.itemId ?? ''); }}
                      style={styles.rowBtn}
                    />
                  </View>

                  {isExpanded ? (
                    isItemDetailLoading ? (
                      <Text style={styles.muted}>Loading detail...</Text>
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
                                   lp.unitPrice != null ? `£${lp.unitPrice.toFixed(2)}` : '—'}
                                </Text>
                              </View>
                            ))}
                          </View>
                        ) : null}

                        {isAdmin ? (
                          <ThemedButton
                            label="Void Item"
                            variant="secondary"
                            onPress={() => { void handleVoidItem(item.itemId ?? ''); }}
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
        ) : null}

        {/* ── Revisions tab ── */}
        {activeTab === 'revisions' ? (
          <>
            {isRevisionsLoading ? <Text style={styles.muted}>Loading revisions...</Text> : null}
            {revisionsError ? <Text style={styles.error}>{revisionsError}</Text> : null}
            {!isRevisionsLoading && !revisionsError && revisions.length === 0 ? (
              <Text style={styles.muted}>No revisions found.</Text>
            ) : null}

            {revisions.map((rev) => {
              const isExpanded = expandedRevisionId === rev.id;
              return (
                <ThemedCard key={rev.id} style={styles.card}>
                  <View style={styles.rowHeader}>
                    <View style={styles.rowInfo}>
                      <View style={styles.revTitleRow}>
                        <Text style={styles.cardTitle}>
                          #{rev.id}{rev.name ? ` — ${rev.name}` : ''}
                        </Text>
                        <View style={[styles.statusBadge, { borderColor: statusColor(rev.status, theme) }]}>
                          <Text style={[styles.statusBadgeText, { color: statusColor(rev.status, theme) }]}>
                            {rev.status.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.cardMeta}>Created: {formatDate(rev.createdAt)}</Text>
                      {rev.activatedAt ? (
                        <Text style={styles.cardMeta}>Activated: {formatDate(rev.activatedAt)}</Text>
                      ) : null}
                    </View>
                    <ThemedButton
                      label={isExpanded ? 'Collapse' : 'View'}
                      variant="secondary"
                      onPress={() => { void handleToggleRevision(rev.id); }}
                      style={styles.rowBtn}
                    />
                  </View>

                  {isExpanded ? (
                    isRevisionDetailLoading && revisionDetail === null ? (
                      <Text style={styles.muted}>Loading revision detail...</Text>
                    ) : (
                      <>
                        {rev.notes ? <Text style={styles.cardMeta}>{rev.notes}</Text> : null}

                        {revisionDetail?.items && revisionDetail.items.length > 0 ? (
                          <View style={styles.listPricesBlock}>
                            <Text style={styles.subHeading}>
                              Items ({revisionDetail.items.length})
                            </Text>
                            <ScrollView style={styles.revisionItemsList} nestedScrollEnabled>
                              {revisionDetail.items.map((item) => (
                                <View key={item.itemId} style={styles.revisionItem}>
                                  <Text style={styles.listPriceName}>{item.itemId}</Text>
                                  <Text style={styles.listPriceValue}>{item.category ?? '—'}</Text>
                                </View>
                              ))}
                            </ScrollView>
                          </View>
                        ) : revisionDetail ? (
                          <Text style={styles.muted}>No items in this revision.</Text>
                        ) : null}

                        {isAdmin && rev.status !== 'active' ? (
                          <ThemedButton
                            label="Activate Revision"
                            onPress={() => { void handleActivateRevision(rev); }}
                            style={styles.activateBtn}
                          />
                        ) : null}
                      </>
                    )
                  ) : null}
                </ThemedCard>
              );
            })}
          </>
        ) : null}

        {/* ── List Types tab ── */}
        {activeTab === 'types' ? (
          <>
            {isTypesLoading ? <Text style={styles.muted}>Loading list types...</Text> : null}
            {typesError ? <Text style={styles.error}>{typesError}</Text> : null}
            {!isTypesLoading && !typesError && listTypes.length === 0 ? (
              <Text style={styles.muted}>No list types found.</Text>
            ) : null}

            {listTypes.map((lt) => (
              <ThemedCard key={lt.id} style={styles.card}>
                <View style={styles.rowHeader}>
                  <View style={styles.rowInfo}>
                    <Text style={styles.cardTitle}>{lt.name}</Text>
                    {lt.description ? (
                      <Text style={styles.cardMeta}>{lt.description}</Text>
                    ) : null}
                  </View>
                  {isAdmin ? (
                    <ThemedButton
                      label="Delete"
                      variant="secondary"
                      style={styles.rowBtn}
                      onPress={() => {
                        showConfirm({
                          title: 'Delete List Type',
                          message: `Are you sure you want to delete "${lt.name}"? This cannot be undone.`,
                          confirmLabel: 'Delete',
                          confirmVariant: 'danger',
                          onConfirm: async () => {
                            try {
                              await deletePriceListType(lt.id);
                              showSuccess('Deleted', `"${lt.name}" was deleted.`);
                              setListTypes((prev) => prev.filter((t) => t.id !== lt.id));
                            } catch (err) {
                              showDanger(
                                'Error',
                                err instanceof Error ? err.message : 'Failed to delete list type.',
                              );
                            }
                          },
                        });
                      }}
                    />
                  ) : null}
                </View>
              </ThemedCard>
            ))}
          </>
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
  const common = createCommonScreenStyleDefinitions(theme);

  return StyleSheet.create({
    ...common,
    tabBar: {
      flexDirection: 'row',
      marginBottom: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 10,
    },
    tabActive: {
      borderBottomWidth: 2,
      borderBottomColor: theme.colors.accent,
    },
    tabLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.textSecondary,
    },
    tabLabelActive: {
      color: theme.colors.accent,
      fontWeight: '600',
    },
    rowHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    rowInfo: { flex: 1 },
    rowBtn: { marginLeft: 8, flexShrink: 0 },
    revTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
      marginBottom: 2,
    },
    statusBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      borderWidth: 1,
    },
    statusBadgeText: { fontSize: 11, fontWeight: '600' },
    subHeading: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginBottom: 6,
      marginTop: 8,
    },
    listPricesBlock: { marginTop: 4 },
    listPriceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 3,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    listPriceName: { fontSize: 13, color: theme.colors.textPrimary },
    listPriceValue: { fontSize: 13, color: theme.colors.textSecondary },
    revisionItemsList: { maxHeight: 200 },
    revisionItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 3,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    voidBtn: { marginTop: 10, alignSelf: 'flex-start' },
    activateBtn: { marginTop: 10 },
    dangerText: { color: theme.colors.danger },
    muted: { fontSize: 14, color: theme.colors.textMuted },
    filterLabel: {
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 4,
    },
  });
}
