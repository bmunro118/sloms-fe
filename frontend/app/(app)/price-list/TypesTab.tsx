import { Text, View } from 'react-native';

import { LoadingSpinner } from '@components/ui/LoadingSpinner';
import { ThemedButton } from '@components/ui/ThemedButton';
import { ThemedCard } from '@components/ui/ThemedCard';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';

import { TypesTabProps } from './types';

export function TypesTab({
  listTypes,
  isLoading,
  error,
  isAdmin,
  onDeleteType,
}: TypesTabProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <>
      {isLoading ? <LoadingSpinner message="Loading list types..." fullScreen /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!isLoading && !error && listTypes.length === 0 ? (
        <Text style={styles.muted}>No list types found.</Text>
      ) : null}

      {listTypes.map((lt) => (
        <ThemedCard key={lt.id} style={styles.card}>
          <View style={styles.rowHeader}>
            <View style={styles.rowInfo}>
              <Text style={styles.cardTitle}>{lt.name}</Text>
              {lt.displayName ? (
                <Text style={styles.cardMeta}>{lt.displayName}</Text>
              ) : null}
            </View>
            {isAdmin ? (
              <ThemedButton
                label="Delete"
                variant="secondary"
                style={styles.rowBtn}
                onPress={() => onDeleteType(lt)}
              />
            ) : null}
          </View>
        </ThemedCard>
      ))}
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
  };
}
