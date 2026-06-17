import * as DocumentPicker from 'expo-document-picker';
import {
  Download as DownloadIcon,
  RefreshCw as RefreshIcon,
  Upload as UploadIcon,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

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
import { ENDPOINTS } from '@utils/config';
import { featureFlags } from '@utils/features';

import { PriceListFilters, Tab } from './types';
import {
  normalizeItemLists,
  normalizePriceListItems,
  normalizeRevisions,
} from './helpers';

const INITIAL_FILTERS: PriceListFilters = { category: '' };

export function usePriceList() {
  const { isStaff, isAdmin } = useAuth();
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
    if (!isStaff || !featureFlags.priceListRevisions) return;
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
    if (!isStaff || !featureFlags.priceListTypes) return;
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

  // ── Toggle item detail ─────────────────────────────────────────────────────
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

  // ── Delete list type ───────────────────────────────────────────────────────
  const handleDeleteType = useCallback(async (type: PriceListType) => {
    const confirmed = await showConfirm({
      title: 'Delete List Type',
      message: `Are you sure you want to delete "${type.name}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      confirmVariant: 'danger',
    });
    if (!confirmed) return;
    try {
      await deletePriceListType(type.id);
      showSuccess('Deleted', `"${type.name}" was deleted.`);
      setListTypes((prev) => prev.filter((t) => t.id !== type.id));
    } catch (err) {
      showDanger('Error', err instanceof Error ? err.message : 'Failed to delete list type.');
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
          `${imported} imported, ${skipped} skipped. Errors: ${errors.slice(0, 3).join('; ')}${errors.length > 3 ? '\u2026' : ''}`
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

  // ── TopBar actions ──────────────────────────────────────────────────────────
  const topBarActions = useMemo<TopBarAction[]>(() => {
    const actions: TopBarAction[] = [
      buildIconTopBarAction({
        id: 'export-price-list',
        label: isExporting ? 'Exporting\u2026' : 'Export CSV',
        onPress: () => { void handleExport(); },
        icon: DownloadIcon,
        disabled: isExporting,
      }),
    ];

    if (isAdmin) {
      actions.push(
        buildIconTopBarAction({
          id: 'import-price-list',
          label: isImporting ? 'Importing\u2026' : 'Import CSV',
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

  return {
    // Identity
    isStaff,
    isAdmin,

    // Tab
    activeTab,
    setActiveTab,

    // Items
    allItems,
    filteredItems,
    isItemsLoading,
    itemsError,
    expandedItemId,
    itemDetail,
    itemLists,
    isItemDetailLoading,

    // Revisions
    revisions,
    isRevisionsLoading,
    revisionsError,
    expandedRevisionId,
    revisionDetail,
    isRevisionDetailLoading,

    // Types
    listTypes,
    isTypesLoading,
    typesError,

    // Refresh
    refreshTick,
    setRefreshTick,

    // Filters
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

    // Handlers
    handleToggleItem,
    handleVoidItem,
    handleToggleRevision,
    handleActivateRevision,
    handleDeleteType,
    handleExport,
    handleImport,

    // TopBar
    topBarActions,
  };
}
