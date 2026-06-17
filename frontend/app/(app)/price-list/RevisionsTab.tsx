import { Text, View, ScrollView } from 'react-native';

import { LoadingSpinner } from '@components/ui/LoadingSpinner';
import { ThemedButton } from '@components/ui/ThemedButton';
import { ThemedCard } from '@components/ui/ThemedCard';
import { useAppTheme } from '@theme/ThemeProvider';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';

import { statusColor, formatDate } from './helpers';
import { RevisionsTabProps } from './types';

export function RevisionsTab({
  revisions,
  isLoading,
  error,
  expandedRevisionId,
  revisionDetail,
  isRevisionDetailLoading,
  isAdmin,
  onToggleRevision,
  onActivateRevision,
}: RevisionsTabProps) {
  const styles = useThemedStyles(createStyles);
  const theme = useAppTheme();

  return (
    <>
      {isLoading ? <LoadingSpinner message="Loading revisions..." fullScreen /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!isLoading && !error && revisions.length === 0 ? (
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
                    #{rev.id}{rev.name ? ` \u2014 ${rev.name}` : ''}
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
                onPress={() => { void onToggleRevision(rev.id); }}
                style={styles.rowBtn}
              />
            </View>

            {isExpanded ? (
              isRevisionDetailLoading && revisionDetail === null ? (
                <LoadingSpinner message="Loading revision detail..." />
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
                            <Text style={styles.listPriceValue}>{item.category ?? '\u2014'}</Text>
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
                      onPress={() => { void onActivateRevision(rev); }}
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
    revTitleRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 8,
      flexWrap: 'wrap' as const,
      marginBottom: 2,
    },
    statusBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      borderWidth: 1,
    },
    statusBadgeText: { fontSize: 11, fontWeight: '600' as const },
    subHeading: {
      fontSize: 13,
      fontWeight: '600' as const,
      color: theme.colors.textSecondary,
      marginBottom: 6,
      marginTop: 8,
    },
    listPricesBlock: { marginTop: 4 },
    listPriceName: { fontSize: 13, color: theme.colors.textPrimary },
    listPriceValue: { fontSize: 13, color: theme.colors.textSecondary },
    revisionItemsList: { maxHeight: 200 },
    revisionItem: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      paddingVertical: 3,
      borderBottomWidth: 1 as const,
      borderBottomColor: theme.colors.border,
    },
    activateBtn: { marginTop: 10 },
  };
}
