import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { LoadingSpinner } from '@components/ui/LoadingSpinner';
import { ThemedButton } from '@components/ui/ThemedButton';
import { ThemedCard } from '@components/ui/ThemedCard';
import { useAppModal } from '@src/hooks/useAppModal';
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
import { AddressDetail } from './AddressDetail';
import { AddressForm } from './AddressForm';
import { createStyles } from './addresses-styles';

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
