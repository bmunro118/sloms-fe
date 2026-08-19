import { useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Check as CheckIcon, ChevronDown as ChevronDownIcon } from 'lucide-react-native';
import { useAppTheme } from '@theme/ThemeProvider';
import { ResponsiveModal } from './ResponsiveModal';

export type SelectOption<T extends string | number> = {
  value: T;
  label: string;
};

type Props<T extends string | number> = {
  value: T | null;
  options: SelectOption<T>[];
  onChange: (value: T | null) => void;
  placeholder?: string;
  nullLabel?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function ThemedSelect<T extends string | number>({
  value,
  options,
  onChange,
  placeholder = 'Select…',
  nullLabel = 'None',
  disabled = false,
  style,
}: Props<T>) {
  const { colors, radii, spacing } = useAppTheme();
  const [open, setOpen] = useState(false);

  const selectedOption = value !== null ? options.find((o) => o.value === value) : null;
  const displayLabel = selectedOption?.label ?? placeholder;
  const isPlaceholder = !selectedOption;

  const allOptions: Array<{ value: T | null; label: string }> = [
    { value: null, label: nullLabel },
    ...options,
  ];

  const handleSelect = (itemValue: T | null) => {
    onChange(itemValue);
    setOpen(false);
  };

  return (
    <>
      <Pressable
        onPress={() => !disabled && setOpen(true)}
        accessibilityRole="combobox"
        accessibilityLabel={displayLabel}
        style={[
          styles.trigger,
          {
            borderColor: colors.border,
            borderRadius: radii.md,
            backgroundColor: colors.inputBackground,
            paddingHorizontal: spacing.md,
            opacity: disabled ? 0.5 : 1,
          },
          style,
        ]}
      >
        <Text
          style={[
            styles.triggerText,
            { color: isPlaceholder ? colors.inputPlaceholder : colors.textPrimary },
          ]}
          numberOfLines={1}
        >
          {displayLabel}
        </Text>
        <ChevronDownIcon size={16} color={colors.textMuted} />
      </Pressable>

      <ResponsiveModal visible={open} onClose={() => setOpen(false)} maxHeight="60%">
        <FlatList
          data={allOptions}
          keyExtractor={(item) => String(item.value ?? '__null__')}
          contentContainerStyle={{ paddingVertical: spacing.sm }}
          renderItem={({ item }) => {
            const isSelected =
              item.value === value || (item.value === null && (value === null || value === undefined));
            return (
              <TouchableOpacity
                onPress={() => handleSelect(item.value as T | null)}
                style={[
                  styles.option,
                  { paddingVertical: spacing.md },
                  isSelected ? { backgroundColor: colors.accentMuted } : null,
                ]}
                accessibilityRole="menuitem"
              >
                <Text style={[styles.optionText, { color: colors.textPrimary }]}>{item.label}</Text>
                {isSelected ? <CheckIcon size={16} color={colors.accent} /> : null}
              </TouchableOpacity>
            );
          }}
        />
      </ResponsiveModal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    borderWidth: 1,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  triggerText: {
    fontSize: 15,
    flex: 1,
    marginRight: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionText: {
    fontSize: 15,
    flex: 1,
  },
});
