import { PropsWithChildren, ReactNode, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import { X as CloseIcon } from 'lucide-react-native';
import { useAppTheme } from '@theme/ThemeProvider';
import { AppModalResolvedAction, AppModalType } from '@src/features/modal/types';
import { createModalPresentation } from './modal/modalPresentation';
import { createStyles } from './modal/modalStyles';
import { ModalActionButton } from './modal/ModalActionButton';

export interface ResponsiveModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children?: ReactNode;
  maxHeight?: number | `${number}%` | 'auto';
  type?: AppModalType;
  message?: string;
  actions?: AppModalResolvedAction[];
  onActionPress?: (action: AppModalResolvedAction) => void;
  dismissible?: boolean;
}

export function ResponsiveModal({
  visible,
  onClose,
  title,
  children,
  maxHeight = '85%',
  type,
  message,
  actions,
  onActionPress,
  dismissible = true,
}: PropsWithChildren<ResponsiveModalProps>) {
  const theme = useAppTheme();
  const isWeb = Platform.OS === 'web';
  const translateY = useRef(new Animated.Value(0)).current;
  const isConfirmation = type !== undefined || message !== undefined || actions !== undefined;

  useEffect(() => {
    if (isWeb) {
      return;
    }

    if (visible) {
      translateY.setValue(400);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: 400,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, isWeb, translateY]);

  const presentation = useMemo(() => createModalPresentation(type ?? 'info', theme), [type, theme]);
  const styles = useMemo(() => createStyles(theme, presentation), [theme, presentation]);
  const { Icon } = presentation;

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
          onClose();
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

  const handleBackdropPress = () => {
    if (dismissible) {
      onClose();
    }
  };

  const showCloseButton = !isConfirmation && title !== undefined && isWeb;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleBackdropPress}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        enabled={!isWeb}
      >
        <Pressable style={styles.backdrop} onPress={handleBackdropPress} />

        <Animated.View
          style={[
            styles.sheet,
            isWeb ? styles.sheetWeb : null,
            { transform: [{ translateY }], maxHeight },
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: isWeb ? theme.radii.lg : 0,
              borderTopLeftRadius: theme.radii.lg,
              borderTopRightRadius: theme.radii.lg,
              paddingHorizontal: theme.spacing.lg,
              paddingBottom: isConfirmation ? theme.spacing.lg : undefined,
              gap: isConfirmation ? theme.spacing.md : undefined,
            },
          ]}
        >
          {!isWeb ? (
            <View
              style={[styles.handle, { backgroundColor: theme.colors.border }]}
              {...panResponder.panHandlers}
            />
          ) : null}

          {isConfirmation ? (
            <>
              <View
                style={[styles.headerTop, { paddingTop: isWeb ? theme.spacing.lg : theme.spacing.sm }]}
                {...(isWeb ? {} : panResponder.panHandlers)}
              >
                <View style={styles.typeChip}>
                  <Text style={styles.typeChipText}>{presentation.chipLabel}</Text>
                </View>
                <View style={styles.iconWrap}>
                  <Icon size={20} color={presentation.accentColor} />
                </View>
              </View>

              <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{title}</Text>

              {message ? <Text style={styles.message}>{message}</Text> : null}

              <View style={styles.actionsRow}>
                {actions?.map((action) => (
                  <ModalActionButton
                    key={action.id}
                    action={action}
                    styles={styles}
                    onActionPress={onActionPress}
                  />
                ))}
              </View>
            </>
          ) : (
            <>
              {title ? (
                <View
                  style={[styles.header, { paddingTop: isWeb ? theme.spacing.lg : theme.spacing.sm }]}
                  {...(isWeb ? {} : panResponder.panHandlers)}
                >
                  <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{title}</Text>
                  {showCloseButton ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Close"
                      onPress={onClose}
                      style={({ pressed }) => [pressed && styles.closeButtonPressed]}
                      hitSlop={12}
                    >
                      <CloseIcon size={20} color={theme.colors.textMuted} />
                    </Pressable>
                  ) : null}
                </View>
              ) : null}

              {children}
            </>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
