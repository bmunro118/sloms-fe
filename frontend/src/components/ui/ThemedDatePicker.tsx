import { ChangeEvent } from 'react';
import { Platform, StyleProp, ViewStyle } from 'react-native';
import { useAppTheme } from '@theme/ThemeProvider';
import { ThemedInput } from './ThemedInput';

type Props = {
  /** Value in ISO YYYY-MM-DD form (or '' when unset). */
  value: string;
  onChange: (value: string) => void;
  /** Optional ISO bounds (YYYY-MM-DD). */
  min?: string;
  max?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Date input that uses the platform-native calendar picker on web
 * (`<input type="date">`) and degrades to a plain YYYY-MM-DD text field on
 * native. Mirrors the Access calFrom/calTo calendar popups.
 */
export function ThemedDatePicker({ value, onChange, min, max, style }: Props) {
  const { colors, radii } = useAppTheme();

  if (Platform.OS === 'web') {
    return (
      <input
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        style={{
          height: 40,
          width: '100%',
          boxSizing: 'border-box',
          border: `1px solid ${colors.border}`,
          borderRadius: radii.md,
          backgroundColor: colors.inputBackground,
          color: colors.textPrimary,
          padding: '0 12px',
          fontSize: 14,
          fontFamily: 'inherit',
        }}
      />
    );
  }

  // Native fallback — typed entry until a native picker is wired up.
  return (
    <ThemedInput
      value={value}
      onChangeText={onChange}
      placeholder="YYYY-MM-DD"
      autoCapitalize="none"
      keyboardType="numbers-and-punctuation"
      style={[{ height: 40 }, style]}
    />
  );
}
