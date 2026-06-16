import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import { useTooltipDismissalGate } from '@hooks/useTooltipDismissalGate';
import { useAppTheme } from '@theme/ThemeProvider';
import { zIndex as zIndexScale } from '@theme/tokens';

let createPortal: any = null;
if (Platform.OS === 'web') {
  try {
    const ReactDOM = require('react-dom');
    createPortal = ReactDOM.createPortal;
  } catch {
    // react-dom unavailable — tooltips degrade to inline rendering
  }
}

const TOOLTIP_SHOW_DELAY_MS = 160;
const TOOLTIP_FADE_IN_MS = 120;
const TOOLTIP_FADE_OUT_MS = 90;
const TOOLTIP_ESTIMATED_HEIGHT = 36;
const TOOLTIP_EDGE_PADDING = 8;

interface TooltipPressableProps extends PressableProps {
  tooltip?: string;
  children: ReactNode;
  tooltipContainerStyle?: StyleProp<ViewStyle>;
  tooltipTextStyle?: StyleProp<TextStyle>;
}

export function TooltipPressable({
  tooltip,
  children,
  style,
  onHoverIn,
  onHoverOut,
  onFocus,
  onBlur,
  onPress,
  onLongPress,
  onPressOut,
  tooltipContainerStyle,
  tooltipTextStyle,
  ...pressableProps
}: TooltipPressableProps) {
  const { colors, radii } = useAppTheme();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const pressableRef = useRef<View>(null);
  const [isTooltipMounted, setTooltipMounted] = useState(false);
  const [tooltipAnchorPos, setTooltipAnchorPos] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [tooltipWidth, setTooltipWidth] = useState(0);
  const tooltipOpacity = useRef(new Animated.Value(0)).current;
  const showDelayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideRequestedRef = useRef(false);
  const isMountedRef = useRef(true);

  const clearShowDelay = useCallback(() => {
    if (showDelayTimeoutRef.current) {
      clearTimeout(showDelayTimeoutRef.current);
      showDelayTimeoutRef.current = null;
    }
  }, []);

  const hasTooltip = typeof tooltip === 'string' && tooltip.trim().length > 0;

  const animateTooltipIn = useCallback(() => {
    tooltipOpacity.stopAnimation();
    tooltipOpacity.setValue(0);
    Animated.timing(tooltipOpacity, {
      toValue: 1,
      duration: TOOLTIP_FADE_IN_MS,
      useNativeDriver: true,
    }).start();
  }, [tooltipOpacity]);

  const mountAndAnimateTooltip = useCallback(() => {
    if (!hasTooltip) return;
    hideRequestedRef.current = false;

    if (pressableRef.current) {
      pressableRef.current.measureInWindow((x, y, width, height) => {
        if (isMountedRef.current) {
          setTooltipAnchorPos({ x, y, width, height });
          setTooltipMounted(true);
          animateTooltipIn();
        }
      });
    } else {
      setTooltipAnchorPos(null);
      setTooltipMounted(true);
      animateTooltipIn();
    }
  }, [animateTooltipIn, hasTooltip]);

  const hideTooltip = useCallback(() => {
    clearShowDelay();
    hideRequestedRef.current = true;
    tooltipOpacity.stopAnimation();
    Animated.timing(tooltipOpacity, {
      toValue: 0,
      duration: TOOLTIP_FADE_OUT_MS,
      useNativeDriver: true,
    }).start(() => {
      if (hideRequestedRef.current && isMountedRef.current) {
        setTooltipMounted(false);
        setTooltipAnchorPos(null);
        setTooltipWidth(0);
      }
    });
  }, [clearShowDelay, tooltipOpacity]);

  const { dismissedRef, checkCooldown } = useTooltipDismissalGate({
    onDismiss: hideTooltip,
  });

  const showTooltip = useCallback(() => {
    if (dismissedRef.current) return;
    if (!checkCooldown()) return;

    clearShowDelay();
    showDelayTimeoutRef.current = setTimeout(() => {
      mountAndAnimateTooltip();
    }, TOOLTIP_SHOW_DELAY_MS);
  }, [clearShowDelay, mountAndAnimateTooltip, dismissedRef, checkCooldown]);

  const showTooltipImmediately = useCallback(() => {
    clearShowDelay();
    mountAndAnimateTooltip();
  }, [clearShowDelay, mountAndAnimateTooltip]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      clearShowDelay();
      tooltipOpacity.stopAnimation();
      tooltipOpacity.setValue(0);
    };
  }, [clearShowDelay, tooltipOpacity]);

  const handleHoverIn: NonNullable<PressableProps['onHoverIn']> = useCallback(
    (event) => {
      showTooltip();
      onHoverIn?.(event);
    },
    [onHoverIn, showTooltip]
  );

  const handleHoverOut: NonNullable<PressableProps['onHoverOut']> = useCallback(
    (event) => {
      hideTooltip();
      onHoverOut?.(event);
    },
    [hideTooltip, onHoverOut]
  );

  const handleFocus = useCallback((event: any) => {
    showTooltip();
    onFocus?.(event);
  }, [onFocus, showTooltip]);

  const handleBlur = useCallback((event: any) => {
    hideTooltip();
    onBlur?.(event);
  }, [hideTooltip, onBlur]);

  const handlePress: NonNullable<PressableProps['onPress']> = useCallback(
    (event) => {
      hideTooltip();
      onPress?.(event);
    },
    [hideTooltip, onPress]
  );

  const handleLongPress: NonNullable<PressableProps['onLongPress']> = useCallback(
    (event) => {
      showTooltipImmediately();
      onLongPress?.(event);
    },
    [onLongPress, showTooltipImmediately]
  );

  const handlePressOut: NonNullable<PressableProps['onPressOut']> = useCallback(
    (event) => {
      hideTooltip();
      onPressOut?.(event);
    },
    [hideTooltip, onPressOut]
  );

  const resolvePressableStyle: NonNullable<PressableProps['style']> = useCallback(
    (state: any) => {
      const incomingStyle = typeof style === 'function' ? style(state) : style;
      return [incomingStyle, styles.pressableBase];
    },
    [style]
  );

  const tooltipPlacement = useMemo(() => {
    if (!tooltipAnchorPos) {
      return { top: 0, left: 0, flipAbove: false };
    }

    const spaceBelow = windowHeight - (tooltipAnchorPos.y + tooltipAnchorPos.height);
    const flipAbove = spaceBelow < TOOLTIP_ESTIMATED_HEIGHT + TOOLTIP_EDGE_PADDING + 8;

    const top = flipAbove
      ? tooltipAnchorPos.y - TOOLTIP_ESTIMATED_HEIGHT - 8
      : tooltipAnchorPos.y + tooltipAnchorPos.height + 8;

    const centerX = tooltipAnchorPos.x + tooltipAnchorPos.width / 2;
    const halfW = tooltipWidth > 0 ? tooltipWidth / 2 : 110;
    const left = Math.max(
      TOOLTIP_EDGE_PADDING,
      Math.min(centerX - halfW, windowWidth - (tooltipWidth > 0 ? tooltipWidth : 220) - TOOLTIP_EDGE_PADDING)
    );

    return { top, left, flipAbove };
  }, [tooltipAnchorPos, windowHeight, windowWidth, tooltipWidth]);

  const tooltipAnimatedView = useMemo(
    () => (
      <Animated.View
        pointerEvents="none"
        style={[
          Platform.OS === 'web' ? styles.tooltipPortal : styles.tooltipModal,
          {
            top: tooltipPlacement.top,
            left: tooltipPlacement.left,
            opacity: tooltipOpacity,
            transform: [
              {
                translateY: tooltipOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: tooltipPlacement.flipAbove ? [3, 0] : [-3, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View
          onLayout={(e) => setTooltipWidth(e.nativeEvent.layout.width)}
          style={[
            styles.tooltip,
            {
              borderRadius: radii.sm,
              backgroundColor: colors.textPrimary,
            },
            tooltipContainerStyle,
          ]}
        >
          <Text
            style={[
              styles.tooltipText,
              { color: colors.surface },
              tooltipTextStyle,
            ]}
          >
            {tooltip}
          </Text>
        </View>
      </Animated.View>
    ),
    [
      tooltipPlacement.top,
      tooltipPlacement.left,
      tooltipPlacement.flipAbove,
      tooltipOpacity,
      tooltipWidth,
      radii.sm,
      colors.textPrimary,
      colors.surface,
      tooltipContainerStyle,
      tooltipTextStyle,
      tooltip,
    ]
  );

  return (
    <>
      <Pressable
        ref={pressableRef}
        {...pressableProps}
        style={resolvePressableStyle}
        onHoverIn={handleHoverIn}
        onHoverOut={handleHoverOut}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onPress={handlePress}
        onLongPress={handleLongPress}
        onPressOut={handlePressOut}
      >
        {children}
      </Pressable>

      {isTooltipMounted && hasTooltip
        ? Platform.OS === 'web'
          ? createPortal
            ? createPortal(tooltipAnimatedView, document.body)
            : tooltipAnimatedView
          : (
            <Modal
              animationType="none"
              transparent
              visible
              statusBarTranslucent
              onRequestClose={() => {}}
            >
              {tooltipAnimatedView}
            </Modal>
          )
        : null}
    </>
  );
}

const styles = StyleSheet.create({
  pressableBase: {
    position: 'relative',
    overflow: 'visible',
  },
  tooltipModal: {
    position: 'absolute',
    zIndex: zIndexScale.tooltip,
    elevation: zIndexScale.tooltip,
    maxWidth: 220,
    pointerEvents: 'none',
  } as any,
  tooltipPortal: {
    position: 'fixed' as const,
    zIndex: zIndexScale.tooltip,
    elevation: zIndexScale.tooltip,
    maxWidth: 220,
    pointerEvents: 'none' as const,
  } as any,
  tooltip: {
    maxWidth: 220,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  tooltipText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
