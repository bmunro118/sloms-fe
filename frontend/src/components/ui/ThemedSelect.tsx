import { useState } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Check as CheckIcon, ChevronDown as ChevronDownIcon } from 'lucide-react-native';
import { useAppTheme } from '@theme/ThemeProvider';

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

      <Modal
        visible={open}
        transparent
        animationType={Platform.OS === 'web' ? 'fade' : 'slide'}
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
          <View
            style={[
              styles.sheet,
              Platform.OS === 'web' ? styles.sheetWeb : null,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderTopLeftRadius: radii.lg,
                borderTopRightRadius: radii.lg,
                ...(Platform.OS === 'web' ? { borderRadius: radii.lg } : {}),
              },
            ]}
          >
            {Platform.OS !== 'web' ? (
              <View style={[styles.handle, { backgroundColor: colors.border }]} />
            ) : null}
            <FlatList
              data={allOptions}
              keyExtractor={(item) => String(item.value ?? '__null__')}
              contentContainerStyle={{ paddingVertical: spacing.sm }}
              renderItem={({ item }) => {
                const isSelected =
                  item.value === value || (item.value === null && (value === null || value === undefined));
                return (
                  <TouchableOpacity
                    onPress={() => {
                      onChange(item.value as T | null);
                      setOpen(false);
                    }}
                    style={[
                      styles.option,
                      { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
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
          </View>
        </View>
      </Modal>
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
    maxHeight: '60%',
    borderWidth: 1,
  },
  sheetWeb: {
    maxWidth: 480,
    marginBottom: 'auto' as unknown as number,
    marginTop: 'auto' as unknown as number,
    alignSelf: 'center',
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    marginTop: 10,
    marginBottom: 4,
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
