import { RefreshCw as RefreshIcon } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { ScreenContent } from '@components/layout/ScreenContent';
import { ThemedCard } from '@components/ui/ThemedCard';
import { FilterModal } from '@components/ui/FilterModal';
import { ListFilterHeader } from '@components/ui/ListFilterHeader';
import { TopBarAction } from '@context/ScreenTitleContext';
import { buildIconTopBarAction } from '@src/features/app-shell';
import { useListFilters } from '@src/hooks/useListFilters';
import { useScreenTopBar } from '@src/hooks/useScreenTopBar';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';
import { apiRequest } from '@utils/api';
import { API_BASE_URL } from '@utils/config';

type DocumentRow = {
  id: number;
  type?: string;
  generatedDate?: string;
  orderReference?: string;
};

type DocumentsResponse = {
  data?: DocumentRow[];
};

// Documents has no structured filter params in the current API surface —
// search is passed as a single query param.
type DocumentFilters = Record<string, never>;

const INITIAL_FILTERS: DocumentFilters = {};
const DOCUMENTS_ENDPOINT = `${API_BASE_URL}/api/documents`;

export default function DocumentsScreen() {
  const styles = useThemedStyles(createStyles);
  const [refreshTick, setRefreshTick] = useState(0);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    searchQuery,
    debouncedSearch,
    hasActiveFilters,
    setSearchQuery,
    openModal,
    closeModal,
    applyFilters,
    clearFilters,
    isModalOpen,
  } = useListFilters<DocumentFilters>(INITIAL_FILTERS);

  const topBarActions = useMemo<TopBarAction[]>(() => {
    return [
      buildIconTopBarAction({
        id: 'refresh-documents',
        label: 'Refresh documents',
        onPress: () => setRefreshTick((value) => value + 1),
        icon: RefreshIcon,
        disabled: isLoading,
      }),
    ];
  }, [isLoading]);

  useScreenTopBar({ title: 'Documents', actions: topBarActions });

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    (async () => {
      try {
        const response = await apiRequest<DocumentsResponse>(DOCUMENTS_ENDPOINT, {
          method: 'GET',
          requireAuth: true,
          signal: controller.signal,
        });
        if (!controller.signal.aborted) {
          setDocuments(Array.isArray(response?.data) ? response.data : []);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Failed to load documents.');
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    })();
    return () => {
      controller.abort();
    };
  }, [refreshTick]);

  const filteredDocuments = debouncedSearch.trim()
    ? documents.filter((d) => {
        const q = debouncedSearch.trim().toLowerCase();
        return (
          (d.type?.toLowerCase().includes(q) ?? false) ||
          (d.orderReference?.toLowerCase().includes(q) ?? false) ||
          String(d.id).includes(q)
        );
      })
    : documents;

  return (
    <>
      <ScreenContent>
        <ListFilterHeader
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          onFilterPress={openModal}
          hasActiveFilters={hasActiveFilters}
          placeholder="Search documents..."
          showFilterButton={false}
        />

        {isLoading ? <Text style={styles.muted}>Loading documents...</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!isLoading && !error && filteredDocuments.length === 0 ? <Text style={styles.muted}>No documents found.</Text> : null}
        {filteredDocuments.map((doc) => (
          <ThemedCard key={doc.id} style={styles.card}>
            <Text style={styles.cardTitle}>{doc.type ?? 'Document'} #{doc.id}</Text>
            <Text style={styles.cardMeta}>Order ref: {doc.orderReference ?? 'N/A'}</Text>
            <Text style={styles.cardMeta}>Generated: {doc.generatedDate ?? 'N/A'}</Text>
          </ThemedCard>
        ))}
      </ScreenContent>

      <FilterModal
        visible={isModalOpen}
        onClose={closeModal}
        onApply={applyFilters}
        onClear={clearFilters}
        title="Filter Documents"
      />
    </>
  );
}

function createStyles(theme: AppTheme) {
  const common = createCommonScreenStyleDefinitions(theme);

  return StyleSheet.create({
    ...common,
  });
}
