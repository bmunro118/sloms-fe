import { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useAppTheme } from '@theme/ThemeProvider';
import { ResponsiveModal } from './ResponsiveModal';
import { ThemedButton } from './ThemedButton';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: () => void;
  onClear: () => void;
  title?: string;
}

export function FilterModal({
  visible,
  onClose,
  onApply,
  onClear,
  title = 'Filters',
  children,
}: PropsWithChildren<FilterModalProps>) {
  const { spacing } = useAppTheme();

  return (
    <ResponsiveModal visible={visible} onClose={onClose} title={title}>
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={{
          gap: spacing.md,
          paddingTop: spacing.sm,
          paddingBottom: spacing.sm,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>

      <View style={[styles.actionsRow, { gap: spacing.sm, paddingTop: spacing.sm, paddingBottom: spacing.lg }]}>
        <ThemedButton
          label="Clear"
          onPress={onClear}
          variant="secondary"
          style={styles.actionButton}
        />
        <ThemedButton
          label="Apply"
          onPress={onApply}
          variant="primary"
          style={styles.actionButton}
        />
      </View>
    </ResponsiveModal>
  );
}

const styles = StyleSheet.create({
  scrollArea: {
    flexGrow: 0,
  },
  actionsRow: {
    flexDirection: 'row',
  },
  actionButton: {
    flex: 1,
  },
});
