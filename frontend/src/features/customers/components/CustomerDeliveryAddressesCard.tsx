import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LoadingSpinner } from '@components/ui/LoadingSpinner';
import { ThemedButton } from '@components/ui/ThemedButton';
import { ThemedCard } from '@components/ui/ThemedCard';
import { ThemedInput } from '@components/ui/ThemedInput';
import { useAppModal } from '@src/hooks/useAppModal';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';
import {
  Address,
  CreateAddressPayload,
  createAddress,
  deleteAddress,
  listAddresses,
  setDefaultAddress,
  updateAddress,
} from '../api';

const EMPTY_FORM: CreateAddressPayload = {
  siteCompanyName: '',
  delBuildingName: '',
  delAddressLn1: '',
  delAddressLn2: '',
  delTownOrCity: '',
  delCounty: '',
  delPostCode: '',
  siteContactName: '',
  siteContactEmail: '',
  siteContactPhone: '',
  siteContactMobile: '',
  defaultAddress: false,
};

type Props = {
  customerId: number;
  canMutate: boolean;
};

export function CustomerDeliveryAddressesCard({ customerId, canMutate }: Props) {
  const styles = useThemedStyles(createStyles);
  const { showConfirm, showSuccess, showDanger } = useAppModal();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Address>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<CreateAddressPayload>(EMPTY_FORM);

  const reload = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await listAddresses(customerId, { signal });
      if (!signal?.aborted) {
        setAddresses(Array.isArray(response?.data) ? response.data : []);
      }
    } catch (err) {
      if (!signal?.aborted) {
        console.warn('[CustomerDeliveryAddressesCard] Failed to load addresses:', err);
      }
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    setIsLoading(true);
    const controller = new AbortController();
    reload(controller.signal);
    return () => controller.abort();
  }, [reload]);

  // ── Edit ──────────────────────────────────────────────────────────────────────

  const startEdit = useCallback((address: Address) => {
    setEditingId(address.id);
    setEditForm({ ...address });
    setExpandedId(address.id);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditForm({});
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingId || isSaving) return;
    setIsSaving(true);
    try {
      await updateAddress(customerId, editingId, editForm);
      showSuccess('Address updated', 'The address has been saved.');
      setEditingId(null);
      setEditForm({});
      await reload();
    } catch (err) {
      showDanger('Save failed', err instanceof Error ? err.message : 'Could not save address.');
    } finally {
      setIsSaving(false);
    }
  }, [customerId, editForm, editingId, isSaving, reload, showDanger, showSuccess]);

  // ── Delete ────────────────────────────────────────────────────────────────────

  const handleDelete = useCallback(async (address: Address) => {
    const confirmed = await showConfirm({
      title: 'Delete address?',
      message: 'This address will be permanently removed from the customer.',
      confirmLabel: 'Delete',
      confirmVariant: 'danger',
    });
    if (!confirmed) return;
    try {
      await deleteAddress(customerId, address.id);
      showSuccess('Address deleted');
      if (expandedId === address.id) setExpandedId(null);
      if (editingId === address.id) { setEditingId(null); setEditForm({}); }
      await reload();
    } catch (err) {
      showDanger('Delete failed', err instanceof Error ? err.message : 'Could not delete address.');
    }
  }, [customerId, editingId, expandedId, reload, showConfirm, showDanger, showSuccess]);

  // ── Set Default ───────────────────────────────────────────────────────────────

  const handleSetDefault = useCallback(async (address: Address) => {
    const confirmed = await showConfirm({
      title: 'Set as default address?',
      message: 'This address will be used as the default delivery address.',
      confirmLabel: 'Set Default',
    });
    if (!confirmed) return;
    try {
      await setDefaultAddress(customerId, address.id);
      showSuccess('Default address updated');
      await reload();
    } catch (err) {
      showDanger('Failed', err instanceof Error ? err.message : 'Could not update default address.');
    }
  }, [customerId, reload, showConfirm, showDanger, showSuccess]);

  // ── Add ───────────────────────────────────────────────────────────────────────

  const handleAdd = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const payload: CreateAddressPayload = Object.fromEntries(
        Object.entries(addForm).filter(([, v]) => v !== '' && v !== undefined)
      ) as CreateAddressPayload;
      await createAddress(customerId, payload);
      showSuccess('Address added');
      setShowAddForm(false);
      setAddForm(EMPTY_FORM);
      await reload();
    } catch (err) {
      showDanger('Add failed', err instanceof Error ? err.message : 'Could not add address.');
    } finally {
      setIsSaving(false);
    }
  }, [addForm, customerId, isSaving, reload, showDanger, showSuccess]);

  // ── Render ────────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <ThemedCard style={styles.card}>
        <Text style={styles.sectionTitle}>Delivery Addresses</Text>
        <LoadingSpinner message="Loading addresses..." />
      </ThemedCard>
    );
  }

  return (
    <ThemedCard style={styles.card}>
      <Text style={styles.sectionTitle}>Delivery Addresses</Text>

      {addresses.length === 0 && !showAddForm ? (
        <Text style={styles.muted}>No delivery addresses on record.</Text>
      ) : null}

      {addresses.map((address, idx) => {
        const isExpanded = expandedId === address.id;
        const isEditing = editingId === address.id;
        const isLast = idx === addresses.length - 1;
        const label = address.siteCompanyName || address.delAddressLn1 || `Address ${idx + 1}`;

        return (
          <View key={address.id} style={[styles.addressBlock, isLast && !showAddForm && styles.addressBlockLast]}>
            {/* Header row: label + expand toggle */}
            <View style={styles.addressHeader}>
              <Text style={styles.addressTitle}>
                {label}
                {address.defaultAddress ? <Text style={styles.defaultBadge}> (Default)</Text> : null}
              </Text>
              <ThemedButton
                label={isExpanded ? 'Collapse' : 'View'}
                variant="secondary"
                onPress={() => {
                  setExpandedId(isExpanded ? null : address.id);
                  if (isEditing && isExpanded) cancelEdit();
                }}
                style={styles.rowBtn}
              />
            </View>

            {/* Expanded detail / edit form */}
            {isExpanded ? (
              isEditing ? (
                <AddressForm
                  form={editForm as CreateAddressPayload}
                  onChange={(patch) => setEditForm((f) => ({ ...f, ...patch }))}
                  disabled={isSaving}
                  styles={styles}
                />
              ) : (
                <AddressDetail address={address} styles={styles} />
              )
            ) : null}

            {/* Action buttons */}
            {isExpanded && canMutate ? (
              <View style={styles.actionRow}>
                {isEditing ? (
                  <>
                    <ThemedButton
                      label={isSaving ? 'Saving…' : 'Save'}
                      onPress={handleSaveEdit}
                      disabled={isSaving}
                      style={styles.actionBtn}
                    />
                    <ThemedButton
                      label="Cancel"
                      variant="secondary"
                      onPress={cancelEdit}
                      disabled={isSaving}
                      style={styles.actionBtn}
                    />
                  </>
                ) : (
                  <>
                    <ThemedButton
                      label="Edit"
                      variant="secondary"
                      onPress={() => startEdit(address)}
                      style={styles.actionBtn}
                    />
                    {!address.defaultAddress ? (
                      <ThemedButton
                        label="Set Default"
                        variant="secondary"
                        onPress={() => handleSetDefault(address)}
                        style={styles.actionBtn}
                      />
                    ) : null}
                    <ThemedButton
                      label="Delete"
                      variant="secondary"
                      onPress={() => handleDelete(address)}
                      disabled={!!address.defaultAddress}
                      style={styles.actionBtn}
                      textStyle={address.defaultAddress ? undefined : styles.dangerText}
                    />
                  </>
                )}
              </View>
            ) : null}
          </View>
        );
      })}

      {/* Add address */}
      {canMutate ? (
        showAddForm ? (
          <View style={[styles.addressBlock, styles.addressBlockLast]}>
            <Text style={styles.addressTitle}>New Address</Text>
            <AddressForm
              form={addForm}
              onChange={(patch) => setAddForm((f) => ({ ...f, ...patch }))}
              disabled={isSaving}
              styles={styles}
            />
            <View style={styles.actionRow}>
              <ThemedButton
                label={isSaving ? 'Adding…' : 'Add Address'}
                onPress={handleAdd}
                disabled={isSaving}
                style={styles.actionBtn}
              />
              <ThemedButton
                label="Cancel"
                variant="secondary"
                onPress={() => { setShowAddForm(false); setAddForm(EMPTY_FORM); }}
                disabled={isSaving}
                style={styles.actionBtn}
              />
            </View>
          </View>
        ) : (
          <View style={styles.addRow}>
            <ThemedButton
              label="+ Add Address"
              variant="secondary"
              onPress={() => setShowAddForm(true)}
              style={styles.addBtn}
            />
          </View>
        )
      ) : null}
    </ThemedCard>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

type StylesRef = ReturnType<typeof createStyles>;

function AddressDetail({ address, styles }: { address: Address; styles: StylesRef }) {
  return (
    <View style={styles.detailBlock}>
      {address.delBuildingName ? (
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Building Name</Text>
          <Text style={styles.fieldValue}>{address.delBuildingName}</Text>
        </View>
      ) : null}
      {address.delAddressLn1 ? (
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Address Line 1</Text>
          <Text style={styles.fieldValue}>{address.delAddressLn1}</Text>
        </View>
      ) : null}
      {address.delAddressLn2 ? (
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Address Line 2</Text>
          <Text style={styles.fieldValue}>{address.delAddressLn2}</Text>
        </View>
      ) : null}
      {address.delTownOrCity ? (
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Town / City</Text>
          <Text style={styles.fieldValue}>{address.delTownOrCity}</Text>
        </View>
      ) : null}
      {address.delCounty ? (
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>County</Text>
          <Text style={styles.fieldValue}>{address.delCounty}</Text>
        </View>
      ) : null}
      {address.delPostCode ? (
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Postcode</Text>
          <Text style={styles.fieldValue}>{address.delPostCode}</Text>
        </View>
      ) : null}
      {address.siteContactName ? (
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Site Contact Name</Text>
          <Text style={styles.fieldValue}>{address.siteContactName}</Text>
        </View>
      ) : null}
      {address.siteContactEmail ? (
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Site Contact Email</Text>
          <Text style={styles.fieldValue}>{address.siteContactEmail}</Text>
        </View>
      ) : null}
      {address.siteContactPhone ? (
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Site Contact Phone</Text>
          <Text style={styles.fieldValue}>{address.siteContactPhone}</Text>
        </View>
      ) : null}
      {address.siteContactMobile ? (
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Site Contact Mobile</Text>
          <Text style={styles.fieldValue}>{address.siteContactMobile}</Text>
        </View>
      ) : null}
    </View>
  );
}

const ADDRESS_FIELDS: {
  key: keyof CreateAddressPayload;
  label: string;
  placeholder: string;
  kb?: 'default' | 'email-address' | 'phone-pad';
}[] = [
  { key: 'siteCompanyName', label: 'Site Company Name', placeholder: 'Site Company Name' },
  { key: 'delBuildingName', label: 'Building Name', placeholder: 'Building Name' },
  { key: 'delAddressLn1', label: 'Address Line 1', placeholder: 'Address Line 1' },
  { key: 'delAddressLn2', label: 'Address Line 2', placeholder: 'Address Line 2' },
  { key: 'delTownOrCity', label: 'Town / City', placeholder: 'Town or City' },
  { key: 'delCounty', label: 'County', placeholder: 'County' },
  { key: 'delPostCode', label: 'Postcode', placeholder: 'Postcode' },
  { key: 'siteContactName', label: 'Site Contact Name', placeholder: 'Site Contact Name' },
  { key: 'siteContactEmail', label: 'Site Contact Email', placeholder: 'Email', kb: 'email-address' },
  { key: 'siteContactPhone', label: 'Site Contact Phone', placeholder: 'Phone', kb: 'phone-pad' },
  { key: 'siteContactMobile', label: 'Site Contact Mobile', placeholder: 'Mobile', kb: 'phone-pad' },
];

function AddressForm({
  form,
  onChange,
  disabled,
  styles,
}: {
  form: CreateAddressPayload;
  onChange: (patch: Partial<CreateAddressPayload>) => void;
  disabled: boolean;
  styles: StylesRef;
}) {
  return (
    <>
      {ADDRESS_FIELDS.map(({ key, label, placeholder, kb }) => (
        <View key={key} style={styles.formGroup}>
          <Text style={styles.label}>{label}</Text>
          <ThemedInput
            placeholder={placeholder}
            value={(form[key] as string) ?? ''}
            onChangeText={(text) => onChange({ [key]: text })}
            keyboardType={kb ?? 'default'}
            editable={!disabled}
          />
        </View>
      ))}
    </>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

function createStyles(theme: AppTheme) {
  const common = createCommonScreenStyleDefinitions(theme);
  return StyleSheet.create({
    ...common,
    card: { ...common.card, marginBottom: 16 },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.textPrimary,
      marginBottom: 12,
    },
    muted: {
      fontSize: 14,
      color: theme.colors.textMuted,
    },
    field: { marginTop: theme.spacing.sm },
    fieldLabel: common.fieldLabel,
    fieldValue: common.fieldValue,
    label: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    formGroup: { marginBottom: 12 },
    addressBlock: {
      paddingBottom: 12,
      marginBottom: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    addressBlockLast: {
      borderBottomWidth: 0,
      marginBottom: 0,
      paddingBottom: 0,
    },
    addressHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    addressTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textPrimary,
      flex: 1,
    },
    defaultBadge: {
      fontSize: 12,
      color: theme.colors.accent,
      fontWeight: '400',
    },
    detailBlock: { marginBottom: 8 },
    actionRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 8,
    },
    actionBtn: { flex: 1, minWidth: 80 },
    rowBtn: { marginLeft: 8 },
    dangerText: { color: theme.colors.danger },
    addRow: { marginTop: 12, alignItems: 'flex-start' },
    addBtn: {},
  });
}
