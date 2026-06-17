import { RefreshCw as RefreshIcon } from 'lucide-react-native';
import { Redirect } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ScreenContent } from '@components/layout/ScreenContent';
import { LoadingSpinner } from '@components/ui/LoadingSpinner';
import { ThemedCard } from '@components/ui/ThemedCard';
import { FilterModal } from '@components/ui/FilterModal';
import { ListFilterHeader } from '@components/ui/ListFilterHeader';
import { TopBarAction } from '@context/ScreenTitleContext';
import { buildIconTopBarAction } from '@src/features/app-shell';
import { DocumentRow, listDocuments } from '@src/features/documents/api';
import { useListFilters } from '@src/hooks/useListFilters';
import { useScreenTopBar } from '@src/hooks/useScreenTopBar';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';
import { featureFlags } from '@utils/features';

// Documents has no structured filter params in the current API surface —
// search is passed as a single query param.
type DocumentFilters = Record<string, never>;

const INITIAL_FILTERS: DocumentFilters = {};

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
        const response = await listDocuments(
          debouncedSearch.trim() ? { search: debouncedSearch.trim() } : undefined,
          { signal: controller.signal }
        );
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
  }, [debouncedSearch, refreshTick]);

  // Feature flag guard — redirect to dashboard if disabled
  if (!featureFlags.documentsPage) {
    return <Redirect href="/(app)/dashboard" />;
  }

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

        {isLoading ? <LoadingSpinner message="Loading documents..." fullScreen /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!isLoading && !error && documents.length === 0 ? <Text style={styles.muted}>No documents found.</Text> : null}
        {!isLoading && !error && documents.map((doc) => (
          <ThemedCard key={doc.id} style={styles.card}>
            <Text style={styles.cardTitle}>{doc.type ?? 'Document'} #{doc.id}</Text>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Order Ref</Text>
              <Text style={styles.fieldValue}>{doc.orderReference ?? 'N/A'}</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Generated</Text>
              <Text style={styles.fieldValue}>{doc.generatedDate ?? 'N/A'}</Text>
            </View>
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
    field: { marginTop: theme.spacing.sm },
    fieldLabel: common.fieldLabel,
    fieldValue: common.fieldValue,
  });
}
