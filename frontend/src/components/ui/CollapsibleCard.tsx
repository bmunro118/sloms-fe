import { ChevronDown } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, LayoutChangeEvent, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { ThemedButton } from '@components/ui/ThemedButton';
import { ThemedCard } from '@components/ui/ThemedCard';
import { useAppTheme } from '@theme/ThemeProvider';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';

type CollapsibleCardProps = {
  title: string;
  expanded: boolean;
  onToggleExpanded: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  tooltip?: string;
};

/**
 * Reusable collapsible card with animated expand/collapse transitions.
 * Wraps ThemedCard and provides a header with title + chevron toggle button
 * and an animated content area that expands/collapses smoothly.
 *
 * Animation pattern mirrors NavLayout sidebar — 250ms duration,
 * cubic easing, parallel height + opacity + chevron rotation.
 */
export function CollapsibleCard({
  title,
  expanded,
  onToggleExpanded,
  children,
  style,
  tooltip,
}: CollapsibleCardProps) {
  const styles = useThemedStyles(createStyles);
  const theme = useAppTheme();

  // Animated values for smooth expand/collapse transitions
  const animatedHeight = useRef(new Animated.Value(expanded ? 1 : 0)).current;
  const animatedOpacity = useRef(new Animated.Value(expanded ? 1 : 0)).current;
  const chevronRotation = useRef(new Animated.Value(expanded ? 1 : 0)).current;
  const [contentHeight, setContentHeight] = useState(0);

  // Interpolated chevron rotation (0deg collapsed → 180deg expanded)
  const chevronRotate = chevronRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
    extrapolate: 'clamp',
  });

  // Interpolated content height
  const heightInterpolated = animatedHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, contentHeight],
    extrapolate: 'clamp',
  });

  // Animate card expand/collapse
  const animateCardExpansion = useCallback(
    (isExpanded: boolean) => {
      animatedHeight.stopAnimation();
      animatedOpacity.stopAnimation();
      chevronRotation.stopAnimation();

      Animated.parallel([
        Animated.timing(animatedHeight, {
          toValue: isExpanded ? 1 : 0,
          duration: 250,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(animatedOpacity, {
          toValue: isExpanded ? 1 : 0,
          duration: 250,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(chevronRotation, {
          toValue: isExpanded ? 1 : 0,
          duration: 250,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    },
    [animatedHeight, animatedOpacity, chevronRotation]
  );

  useEffect(() => {
    animateCardExpansion(expanded);
  }, [animateCardExpansion, expanded]);

  const handleContentLayout = useCallback((event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height;
    setContentHeight((prev) => (prev === height ? prev : height));
  }, []);

  const toggleTooltip = tooltip ?? (expanded ? 'Collapse' : 'Expand');

  return (
    <ThemedCard style={[styles.card, style]}>
      {/* Header row: title left, chevron toggle right */}
      <View style={[styles.cardHeader, !expanded && styles.cardHeaderCollapsed]}>
        <Text style={styles.cardTitle}>{title}</Text>
        <ThemedButton
          variant="icon"
          icon={
            <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
              <ChevronDown size={16} color={theme.colors.navTextStrong} />
            </Animated.View>
          }
          onPress={onToggleExpanded}
          tooltip={toggleTooltip}
          style={styles.toggleButton}
        />
      </View>

      {/* Animated content container */}
      <Animated.View
        style={[
          styles.contentContainer,
          {
            height: heightInterpolated,
            opacity: animatedOpacity,
          },
        ]}
      >
        <View onLayout={handleContentLayout} style={styles.contentInner}>
          {children}
        </View>
      </Animated.View>
    </ThemedCard>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    card: {
      marginBottom: theme.spacing.md,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.md,
    },
    cardHeaderCollapsed: {
      marginBottom: 0,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    toggleButton: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: theme.colors.navBackground,
      borderWidth: 1,
      borderColor: theme.colors.navBorder,
    },
    contentContainer: {
      overflow: 'hidden',
    },
    contentInner: {
      paddingBottom: theme.spacing.xs,
    },
  });
}
