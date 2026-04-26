import { PropsWithChildren } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { X as CloseIcon } from 'lucide-react-native';
import { useAppTheme } from '@theme/ThemeProvider';
import { ThemedButton } from './ThemedButton';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: () => void;
  onClear: () => void;
  title?: string;
}

/**
 * Cross-platform filter modal.
 *  - Mobile: slides up from the bottom (bottom sheet style).
 *  - Web: centered dialog.
 */
export function FilterModal({
  visible,
  onClose,
  onApply,
  onClear,
  title = 'Filters',
  children,
}: PropsWithChildren<FilterModalProps>) {
  const { colors, radii, spacing } = useAppTheme();
  const isWeb = Platform.OS === 'web';

  return (
    <Modal
      visible={visible}
      transparent
      animationType={isWeb ? 'fade' : 'slide'}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View
          style={[
            styles.panel,
            isWeb ? styles.panelWeb : styles.panelMobile,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: isWeb ? radii.lg : 0,
              borderTopLeftRadius: radii.lg,
              borderTopRightRadius: radii.lg,
              paddingHorizontal: spacing.lg,
              paddingBottom: spacing.lg,
            },
          ]}
        >
          {/* Handle bar — mobile only */}
          {!isWeb ? (
            <View style={[styles.handleBar, { backgroundColor: colors.border }]} />
          ) : null}

          {/* Header row */}
          <View style={[styles.headerRow, { paddingTop: isWeb ? spacing.lg : spacing.sm }]}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close filters"
              style={styles.closeButton}
            >
              <CloseIcon size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Filter content */}
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

          {/* Action buttons */}
          <View style={[styles.actionsRow, { gap: spacing.sm, paddingTop: spacing.sm }]}>
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
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  panel: {
    width: '100%',
    maxHeight: '85%',
    borderWidth: 1,
  },
  panelMobile: {
    // Anchored to the bottom; borderRadius on top corners is set inline.
  },
  panelWeb: {
    maxWidth: 480,
    marginBottom: 'auto',
    marginTop: 'auto',
    alignSelf: 'center',
    borderRadius: 12,
  },
  handleBar: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    marginTop: 10,
    marginBottom: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
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
