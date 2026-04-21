import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { ScreenContent } from '@components/layout/ScreenContent';
import { ThemedCard } from '@components/ui/ThemedCard';
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

const DOCUMENTS_ENDPOINT = `${API_BASE_URL}/api/documents`;

export default function DocumentsScreen() {
  const styles = useThemedStyles(createStyles);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
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
  }, []);

  return (
    <ScreenContent>
      <Text style={styles.title}>Documents</Text>
      {isLoading ? <Text style={styles.muted}>Loading documents...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!isLoading && !error && documents.length === 0 ? <Text style={styles.muted}>No documents found.</Text> : null}
      {documents.map((doc) => (
        <ThemedCard key={doc.id} style={styles.card}>
          <Text style={styles.cardTitle}>{doc.type ?? 'Document'} #{doc.id}</Text>
          <Text style={styles.cardMeta}>Order ref: {doc.orderReference ?? 'N/A'}</Text>
          <Text style={styles.cardMeta}>Generated: {doc.generatedDate ?? 'N/A'}</Text>
        </ThemedCard>
      ))}
    </ScreenContent>
  );
}

function createStyles(theme: AppTheme) {
  const common = createCommonScreenStyleDefinitions(theme);

  return StyleSheet.create({
    ...common,
  });
}
