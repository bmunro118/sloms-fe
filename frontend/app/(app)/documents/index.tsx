import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const response = await apiRequest<DocumentsResponse>(DOCUMENTS_ENDPOINT, {
          method: 'GET',
          requireAuth: true,
        });
        if (mounted) {
          setDocuments(Array.isArray(response?.data) ? response.data : []);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load documents.');
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Documents</Text>
      {isLoading ? <Text style={styles.muted}>Loading documents...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!isLoading && !error && documents.length === 0 ? <Text style={styles.muted}>No documents found.</Text> : null}
      {documents.map((doc) => (
        <View key={doc.id} style={styles.card}>
          <Text style={styles.cardTitle}>{doc.type ?? 'Document'} #{doc.id}</Text>
          <Text style={styles.cardMeta}>Order ref: {doc.orderReference ?? 'N/A'}</Text>
          <Text style={styles.cardMeta}>Generated: {doc.generatedDate ?? 'N/A'}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
  },
  muted: {
    color: '#64748b',
  },
  error: {
    color: '#b91c1c',
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    padding: 12,
  },
  cardTitle: {
    fontWeight: '700',
    color: '#0f172a',
  },
  cardMeta: {
    color: '#475569',
    marginTop: 4,
  },
});
