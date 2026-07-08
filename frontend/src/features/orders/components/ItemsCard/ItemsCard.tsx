import { Children, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ThemedCard } from '@components/ui/ThemedCard';
import { LoadingSpinner } from '@components/ui/LoadingSpinner';
import { TopBarAction } from '@context/ScreenTitleContext';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';
import { ItemsCardMode } from './ItemsCardTypes';

export interface ItemsCardProps {
  mode: ItemsCardMode;
  title: string;
  actions?: TopBarAction[];
  isLoading?: boolean;
  emptyMessage?: string;
  addItemCard?: ReactNode;
  children: ReactNode;
}

function createStyles(theme: AppTheme) {
  const common = createCommonScreenStyleDefinitions(theme);

  return StyleSheet.create({
    ...common,
    card: {
      marginTop: theme.spacing.md,
    },
    loader: {
      marginBottom: theme.spacing.md,
    },
    emptyState: {
      padding: theme.spacing.md,
      alignItems: 'center',
    },
    emptyStateText: {
      color: theme.colors.textMuted,
      fontStyle: 'italic',
    },
    addItemCardWrapper: {
      marginBottom: theme.spacing.md,
    },
  });
}

export function ItemsCard({
  mode,
  title,
  actions,
  isLoading,
  emptyMessage,
  addItemCard,
  children,
}: ItemsCardProps) {
  const styles = useThemedStyles(createStyles);
  const isEmpty = !isLoading && Children.count(children) === 0;

  return (
    <ThemedCard title={title} actions={actions} style={styles.card}>
      {isLoading ? <LoadingSpinner message="Loading items..." style={styles.loader} /> : null}
      {mode === 'edit' && addItemCard ? (
        <View style={styles.addItemCardWrapper}>{addItemCard}</View>
      ) : null}
      {isEmpty ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>{emptyMessage ?? 'No items.'}</Text>
        </View>
      ) : null}
      {children}
    </ThemedCard>
  );
}
