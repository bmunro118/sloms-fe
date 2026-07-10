import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '@theme/ThemeProvider';
import { ThemedInput } from '@components/ui/ThemedInput';
import { ThemedButton } from '@components/ui/ThemedButton';
import { tokens } from '@theme/tokens';
import { useThemedStyles } from '@theme/useThemedStyles';

interface ScanCorrectionViewProps {
  photoUri: string;
  initialText: string;
  onConfirm: (text: string) => void;
  onRetake: () => void;
  onCancel: () => void;
}

export function ScanCorrectionView({
  photoUri,
  initialText,
  onConfirm,
  onRetake,
  onCancel,
}: ScanCorrectionViewProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [editText, setEditText] = useState(initialText);

  const trimmed = editText.trim();
  const canConfirm = trimmed.length > 0;

  const handleConfirm = () => {
    if (canConfirm) {
      onConfirm(trimmed);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Review & Correct</Text>

      <View style={[styles.imageContainer, { borderColor: theme.colors.border }]}>
        <Image source={{ uri: photoUri }} style={[styles.image, { backgroundColor: theme.colors.background }]} />
      </View>

      <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>
        Edit Label Text
      </Text>
      <ThemedInput
        placeholder="Enter corrected text..."
        value={editText}
        onChangeText={setEditText}
        multiline
        numberOfLines={4}
        style={[styles.input, { textAlignVertical: 'top' }]}
      />

      <View style={styles.buttonRow}>
        <ThemedButton
          variant="outline"
          onPress={onCancel}
          label="Cancel"
          style={styles.button}
        />
        <ThemedButton
          variant="outline"
          onPress={onRetake}
          label="Retake"
          style={styles.button}
        />
        <ThemedButton
          variant="solid"
          onPress={handleConfirm}
          label="Confirm"
          style={styles.button}
          disabled={!canConfirm}
        />
      </View>
    </ScrollView>
  );
}

function createStyles() {
  return StyleSheet.create({
    container: {
      flexGrow: 1,
      padding: tokens.spacing.md,
    },
    title: {
      fontSize: 20,
      fontWeight: '600' as const,
      marginBottom: tokens.spacing.lg,
    },
    imageContainer: {
      marginBottom: tokens.spacing.lg,
      borderWidth: 1,
      borderRadius: tokens.radii.md,
      overflow: 'hidden',
      aspectRatio: 16 / 9,
    },
    image: {
      width: '100%',
      height: '100%',
      resizeMode: 'contain',
    },
    sectionLabel: {
      fontSize: 14,
      fontWeight: '500' as const,
      marginBottom: tokens.spacing.sm,
    },
    input: {
      minHeight: 100,
      marginBottom: tokens.spacing.lg,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: tokens.spacing.sm,
    },
    button: {
      flex: 1,
    },
  });
}
