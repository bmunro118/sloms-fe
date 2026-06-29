import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';

interface Props {
  value: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label?: string;
}

/** Lightweight labelled checkbox used by the 2FA flows ("trust this device"). */
export function RememberDeviceToggle({
  value,
  onChange,
  disabled = false,
  label = 'Trust this device for 30 days',
}: Props) {
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={label}
      disabled={disabled}
      onPress={() => onChange(!value)}
      style={styles.row}
    >
      <View style={[styles.box, value && styles.boxChecked, disabled && styles.boxDisabled]}>
        {value ? <Check size={14} color={styles.checkColor.color} /> : null}
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 4,
    },
    box: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: theme.colors.borderStrong,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.inputBackground,
    },
    boxChecked: {
      backgroundColor: theme.colors.accent,
      borderColor: theme.colors.accent,
    },
    boxDisabled: {
      opacity: 0.5,
    },
    checkColor: {
      color: theme.colors.accentText,
    },
    label: {
      flex: 1,
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
  });
}
