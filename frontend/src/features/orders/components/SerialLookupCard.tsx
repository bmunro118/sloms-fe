import { Search as SearchIcon } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { ThemedCard } from '@components/ui/ThemedCard';
import { ThemedButton } from '@components/ui/ThemedButton';
import { ThemedInput } from '@components/ui/ThemedInput';
import { useAppTheme } from '@theme/ThemeProvider';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';
import { OrderItem } from '../api';

interface SerialLookupCardProps {
  serialInput: string;
  onSerialInputChange: (value: string) => void;
  onSearch: () => void;
  isSearching: boolean;
  serialResult: OrderItem | null;
  serialError: string | null;
}

export function SerialLookupCard({
  serialInput,
  onSerialInputChange,
  onSearch,
  isSearching,
  serialResult,
  serialError,
}: SerialLookupCardProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <ThemedCard style={styles.serialCard} title="Serial Number Lookup">
      <ThemedInput
        placeholder="Enter serial number..."
        value={serialInput}
        onChangeText={(v) => { onSerialInputChange(v); }}
        onSubmitEditing={() => { void onSearch(); }}
        editable={!isSearching}
        rightAccessory={
          <ThemedButton
            variant="icon"
            icon={<SearchIcon size={18} color={isSearching || !serialInput.trim() ? theme.colors.textMuted : theme.colors.navTextStrong} />}
            onPress={() => { void onSearch(); }}
            disabled={isSearching || !serialInput.trim()}
            tooltip="Look up serial number"
            hideBorder
            fillMode
          />
        }
      />
      {serialError ? <Text style={styles.error}>{serialError}</Text> : null}
      {serialResult ? (
        <View style={styles.serialResult}>
          <Text style={styles.serialResultTitle}>
            #{serialResult.serialNumber as string}
          </Text>
          {serialResult.description ? (
            <Text style={styles.meta}>{serialResult.description as string}</Text>
          ) : null}
          {serialResult.modelCode ? (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Model</Text>
              <Text style={styles.fieldValue}>{serialResult.modelCode as string}</Text>
            </View>
          ) : null}
          {(serialResult.patientInitial || serialResult.patientSurname) ? (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Patient</Text>
              <Text style={styles.fieldValue}>{
                [serialResult.patientInitial, serialResult.patientSurname].filter(Boolean).join(' ')
              }</Text>
            </View>
          ) : null}
          {serialResult.category ? (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Category</Text>
              <Text style={styles.fieldValue}>{serialResult.category as string}</Text>
            </View>
          ) : null}
          {serialResult.side ? (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Side</Text>
              <Text style={styles.fieldValue}>{serialResult.side as string}</Text>
            </View>
          ) : null}
          {serialResult.orderNumber ? (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Order</Text>
              <Text style={styles.fieldValue}>
                {serialResult.orderNumber as string}/{serialResult.orderBatch as string}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </ThemedCard>
  );
}

function createStyles(theme: AppTheme) {
  const common = createCommonScreenStyleDefinitions(theme);
  return StyleSheet.create({
    ...common,
    serialCard: { ...common.card, gap: 8 },
    serialResult: { borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 8, gap: 4 },
    serialResultTitle: { fontSize: 15, fontWeight: '600', color: theme.colors.textPrimary },
    field: { marginTop: theme.spacing.sm },
    fieldLabel: common.fieldLabel,
    fieldValue: common.fieldValue,
  });
}
