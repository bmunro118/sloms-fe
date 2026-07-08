import { View } from 'react-native';
import { useThemedStyles } from '@theme/useThemedStyles';

/**
 * Renders two field nodes side-by-side (flex:1 each) on desktop,
 * or stacked vertically on mobile / when explicitly compact.
 *
 * Use this to wrap pairs of field=value rows in display mode.
 * Single (unpaired) fields render on their own without FieldPair.
 */
interface FieldPairProps {
  /** When true, children stack vertically. Typically `width < 768` (mobile) or during edit mode. */
  compact: boolean;
  /** First field node (renders left on desktop, top on mobile). */
  left: React.ReactNode;
  /** Second field node (renders right on desktop, below on mobile). */
  right: React.ReactNode;
}

export function FieldPair({ compact, left, right }: FieldPairProps) {
  const styles = useThemedStyles(createStyles);

  const hasLeft = left != null;
  const hasRight = right != null;

  if (!hasLeft && !hasRight) return null;

  if (compact) {
    return (
      <>
        {left}
        {right}
      </>
    );
  }

  if (!hasLeft || !hasRight) {
    return (
      <View style={styles.row}>
        {hasLeft ? left : right}
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <View style={styles.field}>{left}</View>
      <View style={styles.field}>{right}</View>
    </View>
  );
}

function createStyles(theme: { spacing: { md: number } }) {
  return {
    row: {
      flexDirection: 'row' as const,
      gap: theme.spacing.md,
    },
    field: {
      flex: 1,
    },
  };
}
