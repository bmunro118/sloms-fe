import { PropsWithChildren, useEffect, useRef } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { X as CloseIcon } from 'lucide-react-native';
import { useAppTheme } from '@theme/ThemeProvider';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  maxHeight?: number | `${number}%` | 'auto';
}

/**
 * Shared bottom sheet container.
 *  - Native: slides up from the bottom with a drag handle and optional header.
 *            Dismiss by swiping down on the handle or the header.
 *  - Web: centered fade-in dialog.
 */
export function BottomSheet({
  visible,
  onClose,
  title,
  maxHeight = '85%',
  children,
}: PropsWithChildren<BottomSheetProps>) {
  const { colors, radii, spacing } = useAppTheme();
  const isWeb = Platform.OS === 'web';
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
    }
  }, [visible, translateY]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isWeb,
      onMoveShouldSetPanResponder: (_, gestureState) => !isWeb && gestureState.dy > 0,
      onPanResponderGrant: () => {
        translateY.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const threshold = 80;

        if (gestureState.dy > threshold) {
          Animated.timing(translateY, {
            toValue: 400,
            duration: 200,
            useNativeDriver: true,
          }).start(onClose);
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            friction: 8,
          }).start();
        }
      },
    }),
  ).current;

  return (
    <Modal
      visible={visible}
      transparent
      animationType={isWeb ? 'fade' : 'slide'}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        enabled={!isWeb}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />

        <Animated.View
          style={[
            styles.sheet,
            isWeb ? styles.sheetWeb : null,
            { transform: [{ translateY }], maxHeight },
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: isWeb ? radii.lg : 0,
              borderTopLeftRadius: radii.lg,
              borderTopRightRadius: radii.lg,
              paddingHorizontal: spacing.lg,
            },
          ]}
        >
          {!isWeb ? (
            <View
              style={[styles.handle, { backgroundColor: colors.border }]}
              {...panResponder.panHandlers}
            />
          ) : null}

          {title ? (
            <View
              style={[styles.header, { paddingTop: isWeb ? spacing.lg : spacing.sm }]}
              {...(isWeb ? {} : panResponder.panHandlers)}
            >
              <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={onClose}
                style={({ pressed }) => [pressed && styles.closeButtonPressed]}
                hitSlop={12}
              >
                <CloseIcon size={20} color={colors.textMuted} />
              </Pressable>
            </View>
          ) : null}

          {children}
        </Animated.View>
      </KeyboardAvoidingView>
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
  sheet: {
    width: '100%',
    borderWidth: 1,
  },
  sheetWeb: {
    maxWidth: 480,
    marginBottom: 'auto',
    marginTop: 'auto',
    alignSelf: 'center',
    borderRadius: 12,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  closeButtonPressed: {
    opacity: 0.7,
  },
});
