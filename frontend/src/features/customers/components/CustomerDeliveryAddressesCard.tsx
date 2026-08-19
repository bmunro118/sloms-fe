import { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { Building as BuildingIcon, User as UserIcon } from 'lucide-react-native';
import { LoadingSpinner } from '@components/ui/LoadingSpinner';
import { ThemedButton } from '@components/ui/ThemedButton';
import { ThemedCard } from '@components/ui/ThemedCard';
import { TopBarAction } from '@context/ScreenTitleContext';
import { buildIconTopBarAction } from '@src/features/app-shell';
import { useAppModal } from '@src/hooks/useAppModal';
import { useUnsavedChangesGuard } from '@src/hooks/useUnsavedChangesGuard';
import { useThemedStyles } from '@theme/useThemedStyles';
import {
  Address,
  CreateAddressPayload,
  CreateCustomerPayload,
  createAddress,
  deleteAddress,
  listAddresses,
  setDefaultAddress,
  updateAddress,
} from '../api';
import { CustomerFormMode } from '../types';
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

type Props =
  | {
      mode: Exclude<CustomerFormMode, 'create'>;
      customerId: number;
      canMutate: boolean;
      pendingAddresses?: never;
      onPendingAddressesChange?: never;
      formData?: never;
    }
  | {
      mode: 'create';
      customerId?: never;
      canMutate: boolean;
      pendingAddresses: CreateAddressPayload[];
      onPendingAddressesChange: (addresses: CreateAddressPayload[]) => void;
      formData: CreateCustomerPayload;
    };

export function CustomerDeliveryAddressesCard(props: Props) {
  const { mode, canMutate } = props;
  const isCreateMode = mode === 'create';
  const customerId = isCreateMode ? undefined : (props as Extract<Props, { mode: Exclude<CustomerFormMode, 'create'> }>).customerId;
  const pendingAddresses = isCreateMode ? (props as Extract<Props, { mode: 'create' }>).pendingAddresses : undefined;
  const onPendingAddressesChange = isCreateMode ? (props as Extract<Props, { mode: 'create' }>).onPendingAddressesChange : undefined;
  const formData = isCreateMode ? (props as Extract<Props, { mode: 'create' }>).formData : undefined;
  const { width } = useWindowDimensions();
  const isCompact = useMemo(() => width < 768, [width]);
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

  // In create mode, map pending addresses to Address-like objects with temp negative IDs
  // so the render tree remains the same for both modes
  const effectiveAddresses: Address[] = useMemo(() => {
    if (isCreateMode && pendingAddresses) {
      return pendingAddresses.map((addr, idx) => ({
        addressId: -(idx + 1),
        ...addr,
      }));
    }
    return addresses;
  }, [isCreateMode, pendingAddresses, addresses]);

  const reload = useCallback(async (signal?: AbortSignal) => {
    if (isCreateMode) return;
    if (customerId === undefined) return;
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
  }, [customerId, isCreateMode]);

  useEffect(() => {
    if (isCreateMode) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const controller = new AbortController();
    reload(controller.signal);
    return () => controller.abort();
  }, [reload, isCreateMode]);

  // ── Edit ──────────────────────────────────────────────────────────────────────

  const startEdit = useCallback((address: Address) => {
    setEditingId(address.addressId);
    setEditForm({ ...address });
    setExpandedId(address.addressId);
  }, []);

  const { guardAction: guardCancelEdit } = useUnsavedChangesGuard({
    isDirty: editingId !== null && JSON.stringify(editForm) !== JSON.stringify(
      effectiveAddresses.find((a) => a.addressId === editingId) ?? {}
    ),
  });

  const cancelEdit = useCallback(() => {
    void guardCancelEdit(() => {
      setEditingId(null);
      setEditForm({});
    });
  }, [guardCancelEdit]);

  const handleSaveEdit = useCallback(async () => {
    if (!editingId || isSaving) return;
    if (isCreateMode && pendingAddresses && onPendingAddressesChange) {
      const idx = effectiveAddresses.findIndex((a) => a.addressId === editingId);
      if (idx === -1) return;
      const updated = [...pendingAddresses];
      updated[idx] = { ...updated[idx], ...editForm };
      onPendingAddressesChange(updated);
      setEditingId(null);
      setEditForm({});
      return;
    }
    setIsSaving(true);
    try {
      await updateAddress(customerId!, editingId, editForm);
      showSuccess('Address updated', 'The address has been saved.');
      setEditingId(null);
      setEditForm({});
      await reload();
    } catch (err) {
      showDanger('Save failed', err instanceof Error ? err.message : 'Could not save address.');
    } finally {
      setIsSaving(false);
    }
  }, [customerId, editForm, editingId, isCreateMode, isSaving, onPendingAddressesChange, pendingAddresses, effectiveAddresses, reload, showDanger, showSuccess]);

  // ── Delete ────────────────────────────────────────────────────────────────────

  const handleDelete = useCallback(async (address: Address) => {
    if (isCreateMode && pendingAddresses && onPendingAddressesChange) {
      const idx = pendingAddresses.findIndex((_, i) => -(i + 1) === address.addressId);
      if (idx === -1) return;
      onPendingAddressesChange(pendingAddresses.filter((_, i) => i !== idx));
      if (expandedId === address.addressId) setExpandedId(null);
      if (editingId === address.addressId) { setEditingId(null); setEditForm({}); }
      return;
    }
    const confirmed = await showConfirm({
      title: 'Delete address?',
      message: 'This address will be permanently removed from the customer.',
      confirmLabel: 'Delete',
      confirmVariant: 'danger',
    });
    if (!confirmed) return;
    try {
      await deleteAddress(customerId!, address.addressId);
      showSuccess('Address deleted');
      if (expandedId === address.addressId) setExpandedId(null);
      if (editingId === address.addressId) { setEditingId(null); setEditForm({}); }
      await reload();
    } catch (err) {
      showDanger('Delete failed', err instanceof Error ? err.message : 'Could not delete address.');
    }
  }, [customerId, editingId, expandedId, isCreateMode, onPendingAddressesChange, pendingAddresses, reload, showConfirm, showDanger, showSuccess]);

  // ── Set Default ───────────────────────────────────────────────────────────────

  const handleSetDefault = useCallback(async (address: Address) => {
    if (isCreateMode && pendingAddresses && onPendingAddressesChange) {
      const updated = pendingAddresses.map((addr, i) => ({
        ...addr,
        defaultAddress: -(i + 1) === address.addressId,
      }));
      onPendingAddressesChange(updated);
      return;
    }
    const confirmed = await showConfirm({
      title: 'Set as default address?',
      message: 'This address will be used as the default delivery address.',
      confirmLabel: 'Set Default',
    });
    if (!confirmed) return;
    try {
      await setDefaultAddress(customerId!, address.addressId);
      showSuccess('Default address updated');
      await reload();
    } catch (err) {
      showDanger('Failed', err instanceof Error ? err.message : 'Could not update default address.');
    }
  }, [customerId, isCreateMode, onPendingAddressesChange, pendingAddresses, reload, showConfirm, showDanger, showSuccess]);

  // ── Add ───────────────────────────────────────────────────────────────────────

  const handleAdd = useCallback(async () => {
    if (isSaving) return;
    if (isCreateMode && pendingAddresses && onPendingAddressesChange) {
      const payload: CreateAddressPayload = Object.fromEntries(
        Object.entries(addForm).filter(([, v]) => v !== '' && v !== undefined)
      ) as CreateAddressPayload;
      onPendingAddressesChange([...pendingAddresses, payload]);
      setShowAddForm(false);
      setAddForm(EMPTY_FORM);
      return;
    }
    setIsSaving(true);
    try {
      const payload: CreateAddressPayload = Object.fromEntries(
        Object.entries(addForm).filter(([, v]) => v !== '' && v !== undefined)
      ) as CreateAddressPayload;
      await createAddress(customerId!, payload);
      showSuccess('Address added');
      setShowAddForm(false);
      setAddForm(EMPTY_FORM);
      await reload();
    } catch (err) {
      showDanger('Add failed', err instanceof Error ? err.message : 'Could not add address.');
    } finally {
      setIsSaving(false);
    }
  }, [addForm, customerId, isCreateMode, isSaving, onPendingAddressesChange, pendingAddresses, reload, showDanger, showSuccess]);

  // ── Card actions for new address form ───────────────────────────────────────────

  const hasPrimaryAddress = useMemo(() => Boolean(
    formData?.invBuildingName?.trim() ||
    formData?.invAddressLn1?.trim() ||
    formData?.invAddressLn2?.trim() ||
    formData?.invTownOrCity?.trim() ||
    formData?.invCounty?.trim() ||
    formData?.invPostCode?.trim()
  ), [formData]);

  const hasPrimaryContact = useMemo(() => Boolean(
    formData?.contactName?.trim() ||
    formData?.contactEmail?.trim() ||
    formData?.contactPhone?.trim() ||
    formData?.contactMobile?.trim()
  ), [formData]);

  const handlePopulateFromPrimaryAddress = useCallback(() => {
    if (!formData) return;
    setAddForm((prev) => ({
      ...prev,
      delBuildingName: formData.invBuildingName?.trim() ?? '',
      delAddressLn1: formData.invAddressLn1?.trim() ?? '',
      delAddressLn2: formData.invAddressLn2?.trim() ?? '',
      delTownOrCity: formData.invTownOrCity?.trim() ?? '',
      delCounty: formData.invCounty?.trim() ?? '',
      delPostCode: formData.invPostCode?.trim() ?? '',
    }));
  }, [formData]);

  const handlePopulateFromPrimaryContact = useCallback(() => {
    if (!formData) return;
    setAddForm((prev) => ({
      ...prev,
      siteContactName: formData.contactName?.trim() ?? '',
      siteContactEmail: formData.contactEmail?.trim() ?? '',
      siteContactPhone: formData.contactPhone?.trim() ?? '',
      siteContactMobile: formData.contactMobile?.trim() ?? '',
    }));
  }, [formData]);

  const cardActions = useMemo<TopBarAction[]>(() => {
    if (!isCreateMode || !showAddForm || !formData) return [];
    return [
      buildIconTopBarAction({
        id: 'populate-delivery-address',
        label: 'Populate with Primary Address',
        accessibilityLabel: 'Populate delivery address with primary address',
        onPress: handlePopulateFromPrimaryAddress,
        icon: BuildingIcon,
        disabled: !hasPrimaryAddress,
      }),
      buildIconTopBarAction({
        id: 'populate-delivery-contact',
        label: 'Populate with Primary Contact',
        accessibilityLabel: 'Populate delivery contact with primary contact',
        onPress: handlePopulateFromPrimaryContact,
        icon: UserIcon,
        disabled: !hasPrimaryContact,
      }),
    ];
  }, [formData, handlePopulateFromPrimaryAddress, handlePopulateFromPrimaryContact, hasPrimaryAddress, hasPrimaryContact, isCreateMode, showAddForm]);

  // ── Render ────────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <ThemedCard style={styles.card} titleNode={<Text style={styles.sectionTitle}>Delivery Addresses</Text>}>
        <LoadingSpinner message="Loading addresses..." />
      </ThemedCard>
    );
  }

  return (
    <ThemedCard style={styles.card} titleNode={<Text style={styles.sectionTitle}>Delivery Addresses</Text>} actions={cardActions}>

      {effectiveAddresses.length === 0 && !showAddForm ? (
        <Text style={styles.muted}>No delivery addresses on record.</Text>
      ) : null}

      {effectiveAddresses.map((address, idx) => {
        const isExpanded = expandedId === address.addressId;
        const isEditing = editingId === address.addressId;
        const isLast = idx === effectiveAddresses.length - 1;
        const label = address.siteCompanyName || address.delAddressLn1 || `Address ${idx + 1}`;

        return (
          <View key={address.addressId} style={[styles.addressBlock, isLast && !showAddForm && styles.addressBlockLast]}>
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
                  setExpandedId(isExpanded ? null : address.addressId);
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
                <AddressDetail address={address} styles={styles} compact={isCompact} />
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
