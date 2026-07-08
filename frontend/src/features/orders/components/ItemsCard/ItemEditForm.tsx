import { StyleSheet, Text, View } from 'react-native';
import { ThemedInput } from '@components/ui/ThemedInput';
import { ThemedSelect, SelectOption } from '@components/ui/ThemedSelect';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';

export type OrderItemEditValues = {
  description: string;
  patientInitial: string;
  patientSurname: string;
  side: string;
  price: string;
};

export type ItemEditFormField = keyof OrderItemEditValues;

interface ItemEditFormProps {
  values: OrderItemEditValues;
  isBusy?: boolean;
  onChange: (field: ItemEditFormField, value: string) => void;
}

const sideOptions: SelectOption<string>[] = [
  { value: 'L', label: 'Left' },
  { value: 'R', label: 'Right' },
];

export function ItemEditForm({ values, isBusy = false, onChange }: ItemEditFormProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <>
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Description</Text>
        <ThemedInput
          placeholder="Description"
          value={values.description}
          onChangeText={(text) => onChange('description', text)}
          editable={!isBusy}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Patient Initial</Text>
        <ThemedInput
          placeholder="Patient initial"
          value={values.patientInitial}
          onChangeText={(text) => onChange('patientInitial', text)}
          editable={!isBusy}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Patient Surname</Text>
        <ThemedInput
          placeholder="Patient surname"
          value={values.patientSurname}
          onChangeText={(text) => onChange('patientSurname', text)}
          editable={!isBusy}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Side</Text>
        <ThemedSelect<string>
          value={values.side || null}
          options={sideOptions}
          onChange={(value) => onChange('side', value ?? '')}
          placeholder="Select side"
          nullLabel="No side"
          disabled={isBusy}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Price</Text>
        <ThemedInput
          placeholder="Price"
          keyboardType="decimal-pad"
          value={values.price}
          onChangeText={(text) => onChange('price', text)}
          editable={!isBusy}
        />
      </View>
    </>
  );
}

function createStyles(theme: AppTheme) {
  const common = createCommonScreenStyleDefinitions(theme);

  return StyleSheet.create({
    field: { marginTop: theme.spacing.md },
    fieldLabel: common.fieldLabel,
  });
}
