import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '@theme/ThemeProvider';
import { ThemedButton } from '@components/ui/ThemedButton';
import { LoadingSpinner } from '@components/ui/LoadingSpinner';
import { tokens } from '@theme/tokens';
import { useThemedStyles } from '@theme/useThemedStyles';
import type { AppTheme } from '@theme/types';
import type { LabelExtraction } from '../types';

interface LabelExtractionReviewProps {
  photoUri: string;
  extraction: LabelExtraction;
  isLoading: boolean;
  error: string | null;
  onConfirm: () => void;
  onRetake: () => void;
  onCancel: () => void;
}

const CONFIDENCE_THRESHOLDS = {
  high: 0.8,
  medium: 0.5,
} as const;

type ConfidenceLevel = keyof typeof CONFIDENCE_THRESHOLDS | 'low';

function getConfidenceLevel(confidence: number | null): ConfidenceLevel {
  if (confidence === null) return 'low';
  if (confidence >= CONFIDENCE_THRESHOLDS.high) return 'high';
  if (confidence >= CONFIDENCE_THRESHOLDS.medium) return 'medium';
  return 'low';
}

function getConfidenceColor(theme: AppTheme, level: ConfidenceLevel): string {
  switch (level) {
    case 'high':
      return theme.colors.statusComplete;
    case 'medium':
      return theme.colors.statusPending;
    case 'low':
      return theme.colors.danger;
    default:
      return theme.colors.danger;
  }
}

function ConfidenceBadge({ confidence, theme }: { confidence: number | null; theme: AppTheme }) {
  const level = getConfidenceLevel(confidence);
  const color = getConfidenceColor(theme, level);
  const label = confidence !== null ? `${(confidence * 100).toFixed(0)}%` : 'N/A';
  const badgeStyles = StyleSheet.create({
    confidenceBadge: {
      paddingHorizontal: tokens.spacing.xs,
      paddingVertical: 2,
      borderRadius: tokens.radii.sm,
    },
    confidenceText: {
      fontSize: 11,
      fontWeight: '600' as const,
    },
  });

  return (
    <View style={[badgeStyles.confidenceBadge, { backgroundColor: color }]}>
      <Text style={[badgeStyles.confidenceText, { color: theme.colors.textPrimary }]}>
        {label}
      </Text>
    </View>
  );
}

export function LabelExtractionReview({
  photoUri,
  extraction,
  isLoading,
  error,
  onConfirm,
  onRetake,
  onCancel,
}: LabelExtractionReviewProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <LoadingSpinner message="Processing label..." />
      </View>
    );
  }

  if (error) {
    return (
      <ScrollView
        contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Review Label</Text>
        
        <View style={[styles.errorContainer, { backgroundColor: theme.colors.dangerSurface }]}>
          <Text style={[styles.errorText, { color: theme.colors.danger }]}>{error}</Text>
        </View>

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
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Review Label</Text>

      {/* Photo Preview */}
      <View style={[styles.imageContainer, { borderColor: theme.colors.border }]}>
        <Image
          source={{ uri: photoUri }}
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      {/* Model ID */}
      <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
        Model: {extraction.modelId}
      </Text>

      {/* Mapped Fields Section */}
      <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>
        Extracted Fields
      </Text>

      {extraction.mapped.length > 0 ? (
        <View style={[styles.fieldsContainer, { borderColor: theme.colors.border }]}>
          {extraction.mapped.map((field, index) => (
            <View key={`${field.field}-${index}`} style={styles.fieldRow}>
              <View style={styles.fieldLeft}>
                <Text style={[styles.fieldName, { color: theme.colors.textPrimary }]}>
                  {field.field}
                </Text>
                <Text style={[styles.fieldValue, { color: theme.colors.textSecondary }]}>
                  {String(field.value)}
                </Text>
              </View>
              <View style={styles.fieldRight}>
                <Text style={[styles.fieldSource, { color: theme.colors.textMuted }]}>
                  from: {field.sourceKey}
                </Text>
                <ConfidenceBadge confidence={field.confidence} theme={theme} />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <Text style={[styles.noFieldsText, { color: theme.colors.textMuted }]}>
          No mapped fields found
        </Text>
      )}

      {/* Unmapped Pairs Section */}
      {extraction.unmapped.length > 0 && (
        <>
          <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }, styles.unmappedSectionLabel]}>
            Raw Key/Value Pairs
          </Text>
          <View style={[styles.unmappedContainer, { borderColor: theme.colors.border }]}>
            {extraction.unmapped.map((pair, index) => (
              <View key={`${pair.key}-${index}`} style={styles.unmappedRow}>
                <View style={styles.unmappedKeyContainer}>
                  <Text style={[styles.unmappedKey, { color: theme.colors.textPrimary }]}>
                    {pair.key}
                  </Text>
                </View>
                <Text style={[styles.unmappedSeparator, { color: theme.colors.textMuted }]}>:</Text>
                <View style={styles.unmappedValueContainer}>
                  <Text style={[styles.unmappedValue, { color: theme.colors.textSecondary }]}>
                    {pair.value}
                  </Text>
                </View>
                {pair.confidence !== null && (
                  <ConfidenceBadge confidence={pair.confidence} theme={theme} />
                )}
              </View>
            ))}
          </View>
        </>
      )}

      {/* Action Buttons */}
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
          onPress={onConfirm}
          label="Confirm"
          style={styles.button}
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
    errorContainer: {
      padding: tokens.spacing.md,
      borderRadius: tokens.radii.md,
      marginBottom: tokens.spacing.lg,
    },
    errorText: {
      fontSize: 14,
      textAlign: 'center',
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600' as const,
      marginBottom: tokens.spacing.md,
    },
    sectionLabel: {
      fontSize: 14,
      fontWeight: '500' as const,
      marginBottom: tokens.spacing.sm,
      marginTop: tokens.spacing.md,
    },
    unmappedSectionLabel: {
      marginTop: tokens.spacing.lg,
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
    },
    fieldsContainer: {
      borderWidth: 1,
      borderRadius: tokens.radii.md,
      overflow: 'hidden',
    },
    fieldRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: tokens.spacing.sm,
      borderBottomWidth: 1,
    },
    fieldLeft: {
      flex: 1,
    },
    fieldRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.spacing.sm,
    },
    fieldName: {
      fontSize: 14,
      fontWeight: '600' as const,
    },
    fieldValue: {
      fontSize: 14,
      marginTop: 2,
    },
    fieldSource: {
      fontSize: 12,
    },
    noFieldsText: {
      fontStyle: 'italic',
      textAlign: 'center',
      padding: tokens.spacing.md,
    },
    unmappedContainer: {
      borderWidth: 1,
      borderRadius: tokens.radii.md,
      overflow: 'hidden',
      marginTop: tokens.spacing.sm,
    },
    unmappedRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: tokens.spacing.sm,
      borderBottomWidth: 1,
    },
    unmappedKeyContainer: {
      flex: 1,
    },
    unmappedKey: {
      fontSize: 14,
      fontWeight: '600' as const,
    },
    unmappedSeparator: {
      fontSize: 14,
      marginHorizontal: tokens.spacing.sm,
    },
    unmappedValueContainer: {
      flex: 2,
    },
    unmappedValue: {
      fontSize: 14,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: tokens.spacing.sm,
      marginTop: tokens.spacing.lg,
    },
    button: {
      flex: 1,
    },
  });
}
