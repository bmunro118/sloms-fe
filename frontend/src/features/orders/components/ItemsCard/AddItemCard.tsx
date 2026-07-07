import { useCallback, useEffect, useMemo, useState } from 'react';
import { Keyboard, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { Plus as AddIcon, Loader2 as LoadingIcon } from 'lucide-react-native';
import { ThemedButton } from '@components/ui/ThemedButton';
import { ThemedCard } from '@components/ui/ThemedCard';
import { ThemedInput } from '@components/ui/ThemedInput';
import { ThemedSelect, SelectOption } from '@components/ui/ThemedSelect';
import { LoadingSpinner } from '@components/ui/LoadingSpinner';
import { PriceListItem, getItemListByName } from '@src/features/price-list/api';
import { useAppTheme } from '@theme/ThemeProvider';
import { useThemedStyles } from '@theme/useThemedStyles';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { PendingItem } from './ItemsCardTypes';

// ── Constants ────────────────────────────────────────────────────────────────────────

const DEFAULT_VAT_RATE = 20;

// ── Props ───────────────────────────────────────────────────────────────────────────

export interface AddItemCardProps {
  priceList: PriceListItem[];
  vatRate?: number | null;
  priceBand: string;
  isLoadingPriceList: boolean;
  isAddingItem: boolean;
  onAddItem: (item: PendingItem) => void;
}

// ── Styles ──────────────────────────────────────────────────────────────────────────

function createStyles(theme: AppTheme) {
  const common = createCommonScreenStyleDefinitions(theme);

  return StyleSheet.create({
    ...common,
    card: {
      marginTop: theme.spacing.md,
    },
    loader: {
      marginBottom: theme.spacing.md,
    },
    addItemForm: {
      marginTop: theme.spacing.md,
    },
    formTitle: {
      marginBottom: theme.spacing.md,
    },
    formTitleText: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    formRow: {
      flexDirection: 'row',
      marginBottom: theme.spacing.sm,
      gap: theme.spacing.md,
    },
    formField: {
      flex: 1,
    },
    formFieldHalf: {
      flex: 1,
    },
    fieldLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
      marginBottom: theme.spacing.xs,
    },
    input: {
      marginBottom: theme.spacing.xs,
    },
    inputDisabled: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      padding: theme.spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.md,
      backgroundColor: theme.colors.inputBackground,
    },
    inputDisabledText: {
      color: theme.colors.textMuted,
      fontSize: 14,
    },
    inputReadonly: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.md,
      backgroundColor: theme.colors.inputBackground,
      padding: theme.spacing.sm,
    },
    inputReadonlyText: {
      color: theme.colors.textPrimary,
      fontWeight: '600',
    },
    errorContainer: {
      marginVertical: theme.spacing.sm,
    },
    errorText: {
      color: theme.colors.danger,
      fontSize: 14,
    },
    formActions: {
      marginTop: theme.spacing.md,
      alignItems: 'flex-end',
    },
    addButton: {
      minWidth: 140,
    },
    addButtonText: {
      color: theme.colors.accentText,
      fontWeight: '700',
      marginLeft: theme.spacing.xs,
    },
  });
}

// ── Component ─────────────────────────────────────────────────────────────────────────

export function AddItemCard({
  priceList,
  vatRate,
  priceBand,
  isLoadingPriceList,
  isAddingItem,
  onAddItem,
}: AddItemCardProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const effectiveVatRate = vatRate ?? DEFAULT_VAT_RATE;

  // Local state for new item form
  const [newItemId, setNewItemId] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [newItemUnitPrice, setNewItemUnitPrice] = useState('');
  const [newItemError, setNewItemError] = useState<string | null>(null);
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);

  // Build select options from price list
  const priceListOptions = useMemo<SelectOption<string>[]>(() => {
    return priceList.map((item) => ({
      value: item.itemId,
      label: `${item.itemId}${item.description ? ` — ${item.description}` : ''}${item.price ? ` (£${item.price.toFixed(2)})` : ''}`,
    }));
  }, [priceList]);

  // Selected price list item for auto-fill
  const selectedPriceListItemForId = useMemo(() => {
    return priceList.find((item) => item.itemId === newItemId) ?? null;
  }, [newItemId, priceList]);

  // Auto-fill description and unit price when item is selected
  useEffect(() => {
    if (!newItemId) return;

    const item = selectedPriceListItemForId;

    // Always auto-fill description from local price list if available
    if (item) {
      setNewItemDescription(item.description ?? '');
    }

    if (priceBand) {
      // Fetch band-specific price regardless of whether the item is in the local list
      setIsFetchingPrice(true);
      const controller = new AbortController();
      getItemListByName(newItemId, priceBand)
        .then((result) => {
          if (controller.signal.aborted) return;
          if (result?.unitPrice != null) {
            setNewItemUnitPrice(String(result.unitPrice));
          } else if (result?.price != null) {
            setNewItemUnitPrice(String(result.price));
          } else if (item?.price != null) {
            setNewItemUnitPrice(String(item.price));
          }
        })
        .catch((err) => {
          if (controller.signal.aborted) return;
          if (__DEV__) console.error('[AddItemCard] Failed to fetch band price:', err);
          // Fall back to generic price from local list
          if (item?.price != null) {
            setNewItemUnitPrice(String(item.price));
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsFetchingPrice(false);
        });
      return () => { controller.abort(); };
    } else if (item) {
      // No band set — use generic price from local list
      setNewItemUnitPrice(item.price != null ? String(item.price) : '');
    }
  }, [newItemId, priceBand, selectedPriceListItemForId]);

  // Auto-calculate total
  const calculatedTotal = useMemo(() => {
    const qty = parseFloat(newItemQuantity) || 0;
    const price = parseFloat(newItemUnitPrice) || 0;
    return qty * price;
  }, [newItemQuantity, newItemUnitPrice]);

  // Format currency
  const formatCurrency = useCallback((value: number): string => {
    return `£${value.toFixed(2)}`;
  }, []);

  // Validate new item form
  const validateNewItem = useCallback((): boolean => {
    if (!newItemId.trim()) {
      setNewItemError('Item ID is required');
      return false;
    }
    if (!newItemQuantity.trim()) {
      setNewItemError('Quantity is required');
      return false;
    }
    const qty = parseFloat(newItemQuantity);
    if (Number.isNaN(qty) || qty <= 0) {
      setNewItemError('Quantity must be a positive number');
      return false;
    }
    if (!newItemUnitPrice.trim()) {
      setNewItemError('Unit price is required');
      return false;
    }
    const price = parseFloat(newItemUnitPrice);
    if (Number.isNaN(price) || price < 0) {
      setNewItemError('Unit price must be a valid number');
      return false;
    }
    setNewItemError(null);
    return true;
  }, [newItemId, newItemQuantity, newItemUnitPrice]);

  // Handle adding a new item
  const handleAddItem = useCallback(() => {
    if (!validateNewItem()) {
      return;
    }
    const qty = parseFloat(newItemQuantity);
    const price = parseFloat(newItemUnitPrice);
    const total = qty * price;

    const newItem: PendingItem = {
      id: `pending-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      itemId: newItemId.trim(),
      description: newItemDescription.trim() || newItemId.trim(),
      quantity: qty,
      unitPrice: price,
      total,
      vatRate: effectiveVatRate,
    };

    onAddItem(newItem);

    // Reset form
    setNewItemId('');
    setNewItemDescription('');
    setNewItemQuantity('');
    setNewItemUnitPrice('');

    // Hide keyboard on mobile
    if (Platform.OS !== 'web') {
      Keyboard.dismiss();
    }
  }, [newItemId, newItemDescription, newItemQuantity, newItemUnitPrice, validateNewItem, onAddItem, effectiveVatRate]);

  return (
    <ThemedCard style={styles.card}>
      {isLoadingPriceList ? (
        <LoadingSpinner size="small" message="Loading price list..." style={styles.loader} />
      ) : null}

      <View style={styles.addItemForm}>
        <View style={styles.formTitle}>
          <Text style={styles.formTitleText}>Add New Item</Text>
        </View>

        <View style={styles.formRow}>
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Item ID *</Text>
            {isLoadingPriceList ? (
              <View style={[styles.input, styles.inputDisabled]}>
                <LoadingIcon size={18} color={theme.colors.textMuted} />
                <Text style={styles.inputDisabledText}>Loading price list...</Text>
              </View>
            ) : (
              <ThemedSelect<string>
                value={newItemId}
                options={priceListOptions}
                onChange={(value) => setNewItemId(value ?? '')}
                placeholder="Select item or enter ID..."
                nullLabel="Enter item ID manually"
                style={styles.input}
                disabled={isAddingItem}
              />
            )}
          </View>
        </View>

        <View style={styles.formRow}>
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Description</Text>
            <ThemedInput
              placeholder="Item description (auto-filled from price list)"
              style={styles.input}
              value={newItemDescription}
              onChangeText={setNewItemDescription}
              editable={!isAddingItem}
            />
          </View>
        </View>

        <View style={styles.formRow}>
          <View style={[styles.formField, styles.formFieldHalf]}>
            <Text style={styles.fieldLabel}>Unit Price *</Text>
            {isFetchingPrice ? (
              <View style={[styles.input, styles.inputDisabled]}>
                <LoadingIcon size={18} color={theme.colors.textMuted} />
                <Text style={styles.inputDisabledText}>Fetching price...</Text>
              </View>
            ) : (
              <ThemedInput
                placeholder="0.00"
                style={styles.input}
                value={newItemUnitPrice}
                onChangeText={setNewItemUnitPrice}
                keyboardType="numeric"
                editable={!isAddingItem}
              />
            )}
          </View>
          <View style={[styles.formField, styles.formFieldHalf]}>
            <Text style={styles.fieldLabel}>Quantity *</Text>
            <ThemedInput
              placeholder="0"
              style={styles.input}
              value={newItemQuantity}
              onChangeText={setNewItemQuantity}
              keyboardType="numeric"
              editable={!isAddingItem}
            />
          </View>
        </View>

        <View style={styles.formRow}>
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Total</Text>
            <View style={[styles.input, styles.inputReadonly]}>
              <Text style={styles.inputReadonlyText}>{formatCurrency(calculatedTotal)}</Text>
            </View>
          </View>
        </View>

        {newItemError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{newItemError}</Text>
          </View>
        ) : null}

        <View style={styles.formActions}>
          <ThemedButton
            variant="outline"
            onPress={handleAddItem}
            disabled={isAddingItem || !newItemId.trim()}
            style={styles.addButton}
            label={isAddingItem ? 'Adding...' : 'Add Item'}
            icon={isAddingItem ? <LoadingSpinner size="small" /> : <AddIcon size={18} />}
          />
        </View>
      </View>
    </ThemedCard>
  );
}
