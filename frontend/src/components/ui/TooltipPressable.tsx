import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { useAppTheme } from '@theme/ThemeProvider';

const TOOLTIP_SHOW_DELAY_MS = 160;
const TOOLTIP_FADE_IN_MS = 120;
const TOOLTIP_FADE_OUT_MS = 90;
const TOOLTIP_STACK_LEVEL = 10000;

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
  const [isTooltipMounted, setTooltipMounted] = useState(false);
  const tooltipOpacity = useRef(new Animated.Value(0)).current;
  const showDelayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Tracks whether the most recent intent was to hide; prevents a stale fade-out
  // callback from unmounting the tooltip after a subsequent show has started.
  const hideRequestedRef = useRef(false);
  // Prevents state updates after the component has unmounted.
  const isMountedRef = useRef(true);

  const hasTooltip = typeof tooltip === 'string' && tooltip.trim().length > 0;

  const clearShowDelay = useCallback(() => {
    if (showDelayTimeoutRef.current) {
      clearTimeout(showDelayTimeoutRef.current);
      showDelayTimeoutRef.current = null;
    }
  }, []);

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
    if (!hasTooltip) {
      return;
    }
    // Cancel any in-flight hide so its callback does not unmount the tooltip.
    hideRequestedRef.current = false;
    setTooltipMounted(true);
    animateTooltipIn();
  }, [animateTooltipIn, hasTooltip]);

  const showTooltip = useCallback(() => {
    clearShowDelay();
    showDelayTimeoutRef.current = setTimeout(() => {
      mountAndAnimateTooltip();
    }, TOOLTIP_SHOW_DELAY_MS);
  }, [clearShowDelay, mountAndAnimateTooltip]);

  const showTooltipImmediately = useCallback(() => {
    clearShowDelay();
    mountAndAnimateTooltip();
  }, [clearShowDelay, mountAndAnimateTooltip]);

  const hideTooltip = useCallback(() => {
    clearShowDelay();
    hideRequestedRef.current = true;
    tooltipOpacity.stopAnimation();
    Animated.timing(tooltipOpacity, {
      toValue: 0,
      duration: TOOLTIP_FADE_OUT_MS,
      useNativeDriver: true,
    }).start(() => {
      // Always unmount once the fade-out settles, whether it ran to completion
      // or was stopped early — as long as a show hasn't superseded this hide.
      if (hideRequestedRef.current && isMountedRef.current) {
        setTooltipMounted(false);
      }
    });
  }, [clearShowDelay, tooltipOpacity]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      clearShowDelay();
      // Stop animation and force opacity to 0 so no visual remnant persists.
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

  const handleFocus = useCallback(() => {
    showTooltip();
    onFocus?.();
  }, [onFocus, showTooltip]);

  const handleBlur = useCallback(() => {
    hideTooltip();
    onBlur?.();
  }, [hideTooltip, onBlur]);

  const handlePress: NonNullable<PressableProps['onPress']> = useCallback(
    (event) => {
      // A press should always dismiss the tooltip immediately.
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
    (state) => {
      const incomingStyle = typeof style === 'function' ? style(state) : style;

      return [
        incomingStyle,
        styles.pressableBase,
        isTooltipMounted ? styles.pressableRaised : null,
      ];
    },
    [isTooltipMounted, style]
  );

  return (
    <Pressable
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
      {isTooltipMounted && hasTooltip ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.tooltipAnchor,
            {
              opacity: tooltipOpacity,
              transform: [
                {
                  translateY: tooltipOpacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-3, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View
            style={[
              styles.tooltip,
              {
                borderRadius: radii.sm,
                backgroundColor: colors.textPrimary,
              },
              tooltipContainerStyle,
            ]}
          >
            <Text style={[styles.tooltipText, { color: colors.surface }, tooltipTextStyle]}>{tooltip}</Text>
          </View>
        </Animated.View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressableBase: {
    position: 'relative',
    overflow: 'visible',
  },
  pressableRaised: {
    zIndex: TOOLTIP_STACK_LEVEL,
    elevation: TOOLTIP_STACK_LEVEL,
  },
  tooltipAnchor: {
    position: 'absolute',
    top: '100%',
    right: 0,
    left: 0,
    marginTop: 8,
    alignItems: 'center',
    zIndex: TOOLTIP_STACK_LEVEL + 1,
    elevation: TOOLTIP_STACK_LEVEL + 1,
  },
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
