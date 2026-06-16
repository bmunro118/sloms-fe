import {
  Ban as VoidIcon,
  CheckCircle2,
  CheckSquare2 as CheckedOutIcon,
  Clock3,
  PencilOff as CancelEditIcon,
  Pencil as EditIcon,
  Plus as AddIcon,
  Save as SaveIcon,
  Search as SearchIcon,
  Square as MarkCheckoutIcon,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { ThemedButton } from '@components/ui/ThemedButton';
import { ThemedCard } from '@components/ui/ThemedCard';
import { ThemedInput } from '@components/ui/ThemedInput';
import { LoadingSpinner } from '@components/ui/LoadingSpinner';
import { TopBarAction } from '@context/ScreenTitleContext';
import { buildIconTopBarAction } from '@src/features/app-shell';
import { useAppModal } from '@src/hooks/useAppModal';
import { useIsMountedRef } from '@src/hooks/useIsMountedRef';
import { useAppTheme } from '@theme/ThemeProvider';
import { useThemedStyles } from '@theme/useThemedStyles';
import { createItemsStyles } from './orderItemsCardStyles';
import {
  addOrderItem,
  checkoutOrderItem,
  listOrderItems,
  uncheckedOutOrderItem,
  updateOrderItem,
  voidOrderItem,
} from '../api';
import { isItemCheckedOut, toItemEditForm } from '../types';
import type { OrderItemCardData, OrderItemEditValues } from './OrderItemCard';

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatPatient(item: OrderItemCardData): string {
  const initial = typeof item.patientInitial === 'string' ? item.patientInitial.trim() : '';
  const surname = typeof item.patientSurname === 'string' ? item.patientSurname.trim() : '';
  if (!initial && !surname) return 'N/A';
  return [initial, surname].filter(Boolean).join(' ');
}

function deriveItemStatus(item: OrderItemCardData): 'Active' | 'CheckedOut' | 'Voided' {
  if (item.void) return 'Voided';
  if (isItemCheckedOut(item)) return 'CheckedOut';
  return 'Active';
}

// ── Component ──────────────────────────────────────────────────────────────────

interface OrderItemsCardProps {
  orderNumber: number;
  orderBatch: number;
  canMutate: boolean;
  refreshSignal?: number;
}

export function OrderItemsCard({
  orderNumber,
  orderBatch,
  canMutate,
  refreshSignal,
}: OrderItemsCardProps) {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const isCompact = width < 768;
  const styles = useThemedStyles(createItemsStyles);
  const isMountedRef = useIsMountedRef();
  const { showConfirm, showDanger, showSuccess, showWarning } = useAppModal();

  // ── State ──────────────────────────────────────────────────────────────────
  const [items, setItems] = useState<OrderItemCardData[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [itemError, setItemError] = useState<string | null>(null);
  const [isMutatingItems, setIsMutatingItems] = useState(false);
  const [newItemSerialNumber, setNewItemSerialNumber] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [editingItemSerial, setEditingItemSerial] = useState<string | null>(null);
  const [itemFormData, setItemFormData] = useState<OrderItemEditValues>(toItemEditForm(null));

  // ── Data loading ────────────────────────────────────────────────────────────
  const loadItems = useCallback(async (signal?: AbortSignal) => {
    if (!Number.isFinite(orderNumber) || !Number.isFinite(orderBatch)) return;
    setIsLoadingItems(true);
    setItemError(null);
    try {
      const response = await listOrderItems<OrderItemCardData>(orderNumber, orderBatch, undefined, { signal });
      const nextItems = Array.isArray(response)
        ? response
        : Array.isArray(response?.data) ? response.data : [];
      if (isMountedRef.current && !signal?.aborted) setItems(nextItems);
    } catch (err) {
      if (isMountedRef.current && !signal?.aborted)
        setItemError(err instanceof Error ? err.message : 'Failed to load order items.');
    } finally {
      if (isMountedRef.current && !signal?.aborted) setIsLoadingItems(false);
    }
  }, [isMountedRef, orderBatch, orderNumber]);

  useEffect(() => {
    const controller = new AbortController();
    void loadItems(controller.signal);
    return () => { controller.abort(); };
  }, [loadItems, refreshSignal]);

  // ── Add item ────────────────────────────────────────────────────────────────
  const handleAddItem = useCallback(async () => {
    if (!canMutate || isMutatingItems) return;
    const serialNumber = newItemSerialNumber.trim();
    if (!serialNumber) { setItemError('Serial number is required to add an item.'); return; }
    const confirmed = await showConfirm({
      title: 'Add item to order?',
      message: `Item ${serialNumber} will be added to order ${orderNumber}/${orderBatch}.`,
      confirmLabel: 'Add item',
      cancelLabel: 'Cancel',
    });
    if (!confirmed) return;
    setIsMutatingItems(true);
    setItemError(null);
    try {
      await addOrderItem(orderNumber, orderBatch, { serialNumber, description: newItemDescription.trim() || undefined });
      setNewItemSerialNumber('');
      setNewItemDescription('');
      await loadItems();
      showSuccess('Item added', `Item ${serialNumber} was added to this order.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add item.';
      setItemError(message);
      showDanger('Unable to add item', message);
    } finally {
      if (isMountedRef.current) setIsMutatingItems(false);
    }
  }, [canMutate, isMountedRef, isMutatingItems, loadItems, newItemDescription, newItemSerialNumber, orderBatch, orderNumber, showConfirm, showDanger, showSuccess]);

  // ── Edit item ───────────────────────────────────────────────────────────────
  const handleBeginEditItem = useCallback((item: OrderItemCardData) => {
    setEditingItemSerial(item.serialNumber);
    setItemFormData(toItemEditForm(item));
  }, []);

  const handleCancelItemEdit = useCallback(() => {
    setEditingItemSerial(null);
    setItemFormData(toItemEditForm(null));
  }, []);

  const handleSaveItemEdit = useCallback(async () => {
    if (!editingItemSerial || isMutatingItems) return;
    const trimmedPrice = itemFormData.price.trim();
    const parsedPrice = trimmedPrice ? Number(trimmedPrice) : undefined;
    if (trimmedPrice && !Number.isFinite(parsedPrice)) { setItemError('Price must be numeric.'); return; }
    const confirmed = await showConfirm({
      title: 'Save item changes?',
      message: `Item ${editingItemSerial} will be updated with your edits.`,
      confirmLabel: 'Save item',
      cancelLabel: 'Keep editing',
    });
    if (!confirmed) return;
    setIsMutatingItems(true);
    setItemError(null);
    try {
      await updateOrderItem(orderNumber, orderBatch, editingItemSerial, {
        description: itemFormData.description.trim() || undefined,
        patientInitial: itemFormData.patientInitial.trim() || undefined,
        patientSurname: itemFormData.patientSurname.trim() || undefined,
        orientation: itemFormData.side.trim() || undefined,
        price: parsedPrice,
      });
      setEditingItemSerial(null);
      setItemFormData(toItemEditForm(null));
      await loadItems();
      showSuccess('Item updated', `Item ${editingItemSerial} was updated.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update item.';
      setItemError(message);
      showDanger('Unable to update item', message);
    } finally {
      if (isMountedRef.current) setIsMutatingItems(false);
    }
  }, [editingItemSerial, isMountedRef, isMutatingItems, itemFormData, loadItems, orderBatch, orderNumber, showConfirm, showDanger, showSuccess]);

  // ── Toggle checkout ─────────────────────────────────────────────────────────
  const handleToggleCheckout = useCallback(async (item: OrderItemCardData, checkedOut: boolean) => {
    if (!canMutate || isMutatingItems) return;
    const actionLabel = checkedOut ? 'Undo checkout' : 'Mark checked out';
    const confirmed = await showConfirm({
      title: `${actionLabel}?`,
      message: `${actionLabel} for item ${item.serialNumber}.`,
      confirmLabel: actionLabel,
      cancelLabel: 'Cancel',
    });
    if (!confirmed) return;
    setIsMutatingItems(true);
    setItemError(null);
    try {
      if (checkedOut) {
        await uncheckedOutOrderItem(orderNumber, orderBatch, item.serialNumber);
      } else {
        await checkoutOrderItem(orderNumber, orderBatch, item.serialNumber);
      }
      await loadItems();
      showSuccess('Item status updated', `Item ${item.serialNumber} was updated.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update checkout state.';
      setItemError(message);
      showDanger('Unable to update item', message);
    } finally {
      if (isMountedRef.current) setIsMutatingItems(false);
    }
  }, [canMutate, isMountedRef, isMutatingItems, loadItems, orderBatch, orderNumber, showConfirm, showDanger, showSuccess]);

  // ── Void item ───────────────────────────────────────────────────────────────
  const handleVoidItem = useCallback(async (item: OrderItemCardData) => {
    if (!canMutate || isMutatingItems) return;
    const confirmed = await showConfirm({
      title: 'Void this item?',
      message: `Item ${item.serialNumber} will be marked as voided. Continue?`,
      confirmLabel: 'Void item',
      cancelLabel: 'Cancel',
      confirmVariant: 'danger',
    });
    if (!confirmed) return;
    setIsMutatingItems(true);
    setItemError(null);
    try {
      await voidOrderItem(orderNumber, orderBatch, item.serialNumber);
      await loadItems();
      showWarning('Item voided', `Item ${item.serialNumber} was voided.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to void item.';
      setItemError(message);
      showDanger('Unable to void item', message);
    } finally {
      if (isMountedRef.current) setIsMutatingItems(false);
    }
  }, [canMutate, isMountedRef, isMutatingItems, loadItems, orderBatch, orderNumber, showConfirm, showDanger, showWarning]);

  // ── Per-item card actions (for read mode) ───────────────────────────────────
  function buildItemActions(item: OrderItemCardData, checkedOut: boolean): TopBarAction[] {
    if (!canMutate) return [];
    return [
      buildIconTopBarAction({ id: `checkout-item-${item.serialNumber}`, label: checkedOut ? 'Undo checkout' : 'Mark checked out', onPress: () => { void handleToggleCheckout(item, checkedOut); }, icon: checkedOut ? CheckedOutIcon : MarkCheckoutIcon, disabled: isMutatingItems }),
      buildIconTopBarAction({ id: `void-item-${item.serialNumber}`, label: 'Void item', onPress: () => { void handleVoidItem(item); }, icon: VoidIcon, disabled: isMutatingItems }),
      buildIconTopBarAction({ id: `edit-item-${item.serialNumber}`, label: 'Edit item', onPress: () => handleBeginEditItem(item), icon: EditIcon, disabled: isMutatingItems }),
    ];
  }

  function buildItemEditActions(item: OrderItemCardData): TopBarAction[] {
    return [
      buildIconTopBarAction({ id: `save-item-${item.serialNumber}`, label: 'Save item', onPress: () => { void handleSaveItemEdit(); }, icon: SaveIcon, disabled: isMutatingItems }),
      buildIconTopBarAction({ id: `cancel-item-edit-${item.serialNumber}`, label: 'Cancel edit', onPress: handleCancelItemEdit, icon: CancelEditIcon, disabled: isMutatingItems }),
    ];
  }

  // ── Status helpers ──────────────────────────────────────────────────────────
  const statusBadgeStyle = useMemo(() => ({
    Active: styles.badgeActive,
    CheckedOut: styles.badgeComplete,
    Voided: styles.badgeVoided,
  }), [styles]);

  const statusTextStyle = useMemo(() => ({
    Active: styles.badgeTextActive,
    CheckedOut: styles.badgeTextComplete,
    Voided: styles.badgeTextVoided,
  }), [styles]);

  const statusLabel = useMemo(() => ({
    Active: 'Active',
    CheckedOut: 'Checked out',
    Voided: 'Voided',
  }), []);

  function getStatusIcon(status: 'Active' | 'CheckedOut' | 'Voided') {
    switch (status) {
      case 'CheckedOut': return CheckCircle2;
      case 'Voided': return VoidIcon;
      default: return Clock3;
    }
  }

  const isEditingItem = (serial: string) => editingItemSerial === serial;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <ThemedCard style={styles.card} title="Items">
      {isLoadingItems ? <LoadingSpinner message="Loading items..." /> : null}
      {itemError ? <Text style={styles.error}>{itemError}</Text> : null}

      {/* Add New Item (staff only) */}
      {canMutate ? (
        <View style={styles.addSection}>
          <Text style={styles.sectionLabel}>Add New Item</Text>
          <ThemedInput
            placeholder="Serial number"
            value={newItemSerialNumber}
            onChangeText={setNewItemSerialNumber}
            editable={!isMutatingItems}
            onSubmitEditing={() => { void handleAddItem(); }}
            rightAccessory={
              <ThemedButton
                variant="icon"
                icon={<SearchIcon size={18} color={isMutatingItems ? theme.colors.textMuted : theme.colors.navTextStrong} />}
                onPress={() => { void handleAddItem(); }}
                disabled={isMutatingItems}
                tooltip="Look up serial number"
                style={{ backgroundColor: 'transparent', borderWidth: 0 }}
              />
            }
          />
          <ThemedInput
            placeholder="Description (optional)"
            value={newItemDescription}
            onChangeText={setNewItemDescription}
            editable={!isMutatingItems}
          />
          <ThemedButton
            variant="outline"
            label={isMutatingItems ? 'Adding...' : 'Add item'}
            icon={<AddIcon size={16} color={isMutatingItems ? theme.colors.textMuted : theme.colors.navTextStrong} />}
            onPress={() => { void handleAddItem(); }}
            disabled={isMutatingItems}
            style={styles.addButton}
            tooltip={isMutatingItems ? 'Adding item' : 'Add item to order'}
          />
        </View>
      ) : null}

      {/* Empty state */}
      {!isLoadingItems && items.length === 0 ? (
        <Text style={styles.muted}>No items found for this order.</Text>
      ) : null}

      {/* Item rows */}
      {items.map((item) => {
        const checkedOut = isItemCheckedOut(item);
        const derivedStatus = deriveItemStatus(item);
        const StatusIcon = getStatusIcon(derivedStatus);
        const editing = isEditingItem(item.serialNumber);

        return (
          <ThemedCard
            key={item.serialNumber}
            title={`Item ${item.serialNumber}`}
            actions={editing ? buildItemEditActions(item) : buildItemActions(item, checkedOut)}
            style={styles.itemCard}
          >
            {/* Status badge (tracking-style visual) */}
            <View style={styles.itemHeader}>
              <View style={[styles.statusBadge, statusBadgeStyle[derivedStatus]]}>
                <StatusIcon size={14} color={statusTextStyle[derivedStatus].color} />
                <Text style={[styles.statusText, statusTextStyle[derivedStatus]]}>
                  {statusLabel[derivedStatus]}
                </Text>
              </View>
            </View>

            {editing ? (
              /* ── EDIT MODE ── */
              <>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Description</Text>
                  <ThemedInput
                    placeholder="Description"
                    value={itemFormData.description}
                    onChangeText={(text) => setItemFormData((prev) => ({ ...prev, description: text }))}
                    editable={!isMutatingItems}
                  />
                </View>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Patient Initial</Text>
                  <ThemedInput
                    placeholder="Patient initial"
                    value={itemFormData.patientInitial}
                    onChangeText={(text) => setItemFormData((prev) => ({ ...prev, patientInitial: text }))}
                    editable={!isMutatingItems}
                  />
                </View>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Patient Surname</Text>
                  <ThemedInput
                    placeholder="Patient surname"
                    value={itemFormData.patientSurname}
                    onChangeText={(text) => setItemFormData((prev) => ({ ...prev, patientSurname: text }))}
                    editable={!isMutatingItems}
                  />
                </View>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Side</Text>
                  <ThemedInput
                    placeholder="L or R"
                    value={itemFormData.side}
                    onChangeText={(text) => setItemFormData((prev) => ({ ...prev, side: text }))}
                    editable={!isMutatingItems}
                  />
                </View>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Price</Text>
                  <ThemedInput
                    placeholder="Price"
                    keyboardType="decimal-pad"
                    value={itemFormData.price}
                    onChangeText={(text) => setItemFormData((prev) => ({ ...prev, price: text }))}
                    editable={!isMutatingItems}
                  />
                </View>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Checkout</Text>
                  <Text style={styles.fieldValue}>{checkedOut ? 'Checked out' : 'Not checked out'}</Text>
                </View>
              </>
            ) : (
              /* ── READ MODE ── */
              isCompact ? (
                <>
                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Description</Text>
                    <Text style={styles.fieldValue}>
                      {typeof item.description === 'string' && item.description.trim() ? item.description : 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Patient</Text>
                    <Text style={styles.fieldValue}>{formatPatient(item)}</Text>
                  </View>
                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Side</Text>
                    <Text style={styles.fieldValue}>
                      {typeof item.orientation === 'string' && item.orientation.trim()
                        ? item.orientation
                        : (typeof item.side === 'string' && item.side.trim() ? item.side : 'N/A')}
                    </Text>
                  </View>
                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Price</Text>
                    <Text style={styles.fieldValue}>
                      {typeof item.price === 'number' ? `$${item.price.toFixed(2)}` : 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Checkout</Text>
                    <Text style={styles.fieldValue}>{checkedOut ? 'Checked out' : 'Not checked out'}</Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.twoColumnRow}>
                    <View style={styles.twoColumnField}>
                      <Text style={styles.fieldLabel}>Description</Text>
                      <Text style={styles.fieldValue}>
                        {typeof item.description === 'string' && item.description.trim() ? item.description : 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.twoColumnField}>
                      <Text style={styles.fieldLabel}>Patient</Text>
                      <Text style={styles.fieldValue}>{formatPatient(item)}</Text>
                    </View>
                  </View>
                  <View style={styles.twoColumnRow}>
                    <View style={styles.twoColumnField}>
                      <Text style={styles.fieldLabel}>Side</Text>
                      <Text style={styles.fieldValue}>
                        {typeof item.orientation === 'string' && item.orientation.trim()
                          ? item.orientation
                          : (typeof item.side === 'string' && item.side.trim() ? item.side : 'N/A')}
                      </Text>
                    </View>
                    <View style={styles.twoColumnField}>
                      <Text style={styles.fieldLabel}>Price</Text>
                      <Text style={styles.fieldValue}>
                        {typeof item.price === 'number' ? `$${item.price.toFixed(2)}` : 'N/A'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Checkout</Text>
                    <Text style={styles.fieldValue}>{checkedOut ? 'Checked out' : 'Not checked out'}</Text>
                  </View>
                </>
              )
            )}
          </ThemedCard>
        );
      })}
    </ThemedCard>
  );
}

