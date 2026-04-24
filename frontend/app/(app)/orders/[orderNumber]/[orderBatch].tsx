import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { PressableStateCallbackType, StyleSheet, Text, View } from 'react-native';
import {
  CheckSquare2,
  Pencil as EditIcon,
  PencilOff as CancelEditIcon,
  RefreshCw,
  RotateCcw as ResetIcon,
  Save as SaveIcon,
  Send,
} from 'lucide-react-native';
import { ScreenContent } from '@components/layout/ScreenContent';
import { ThemedCard } from '@components/ui/ThemedCard';
import { ThemedInput } from '@components/ui/ThemedInput';
import { TooltipPressable } from '@components/ui/TooltipPressable';
import { useAppTheme } from '@theme/ThemeProvider';
import { useAuth } from '@context/AuthContext';
import { TopBarAction } from '@context/ScreenTitleContext';
import { buildBackTopBarAction, buildIconTopBarAction } from '@src/features/app-shell';
import { useAppModal } from '@src/hooks/useAppModal';
import { useIsMountedRef } from '@src/hooks/useIsMountedRef';
import { useScreenTopBar } from '@src/hooks/useScreenTopBar';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';
import { apiRequest } from '@utils/api';
import { ENDPOINTS } from '@utils/config';

type OrderDetails = {
  orderNumber: number;
  orderBatch: number;
  status?: string;
  customerAccount?: number;
  customerRef?: string;
  orderContact?: string;
  deliveryAddress?: number;
  priceBand?: string;
};

type OrderUpdatePayload = {
  customerRef?: string;
  orderContact?: string;
  deliveryAddress?: number;
  priceBand?: string;
};

type OrderEditForm = {
  customerRef: string;
  orderContact: string;
  deliveryAddress: string;
  priceBand: string;
};

function toOrderEditForm(order: OrderDetails | null): OrderEditForm {
  return {
    customerRef: order?.customerRef ?? '',
    orderContact: order?.orderContact ?? '',
    deliveryAddress: order?.deliveryAddress !== undefined ? String(order.deliveryAddress) : '',
    priceBand: order?.priceBand ?? '',
  };
}

export default function OrderDetailScreen() {
  const params = useLocalSearchParams<{ orderNumber: string; orderBatch: string }>();
  const { canMutate } = useAuth();
  const theme = useAppTheme();
  const router = useRouter();
  const { showConfirm, showSuccess } = useAppModal();
  const styles = useThemedStyles(createStyles);
  const isMountedRef = useIsMountedRef();
  const orderNumber = Number(params.orderNumber);
  const orderBatch = Number(params.orderBatch);

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDispatching, setIsDispatching] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<OrderEditForm>(toOrderEditForm(null));

  const canUpdate = (signal?: AbortSignal) => isMountedRef.current && !signal?.aborted;

  const reload = async (signal?: AbortSignal) => {
    if (!canUpdate(signal)) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await apiRequest<OrderDetails>(ENDPOINTS.orders.byId(orderNumber, orderBatch), {
        method: 'GET',
        requireAuth: true,
        signal,
      });
      if (canUpdate(signal)) {
        setOrder(response);
        if (!isEditing) {
          setFormData(toOrderEditForm(response));
        }
      }
    } catch (err) {
      if (canUpdate(signal)) {
        setError(err instanceof Error ? err.message : 'Failed to load order.');
      }
    } finally {
      if (canUpdate(signal)) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!Number.isFinite(orderNumber) || !Number.isFinite(orderBatch)) {
      setError('Invalid order route parameters.');
      setIsLoading(false);
      return;
    }
    const controller = new AbortController();
    reload(controller.signal);

    return () => {
      controller.abort();
    };
  }, [orderNumber, orderBatch]);

  const performSave = async () => {
    if (!canMutate || isSaving) {
      return;
    }

    const deliveryAddressRaw = formData.deliveryAddress.trim();
    const hasDeliveryAddress =
      deliveryAddressRaw.length > 0;
    const parsedDeliveryAddress = hasDeliveryAddress ? Number(deliveryAddressRaw) : undefined;

    if (hasDeliveryAddress && !Number.isFinite(parsedDeliveryAddress)) {
      setError('Delivery address must be numeric.');
      return;
    }

    const payload: OrderUpdatePayload = {
      customerRef: formData.customerRef?.trim() || undefined,
      orderContact: formData.orderContact?.trim() || undefined,
      deliveryAddress: parsedDeliveryAddress,
      priceBand: formData.priceBand?.trim() || undefined,
    };

    setIsSaving(true);
    setError(null);
    try {
      const response = await apiRequest<OrderDetails>(ENDPOINTS.orders.byId(orderNumber, orderBatch), {
        method: 'PUT',
        requireAuth: true,
        body: payload,
      });

      if (isMountedRef.current) {
        setOrder(response);
        setFormData(toOrderEditForm(response));
        setIsEditing(false);
        showSuccess(
          'Order updated',
          `Order ${orderNumber}/${orderBatch} was updated successfully.`
        );
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to save order changes.');
      }
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  };

  const handleConfirmSave = async () => {
    if (isSaving) {
      return;
    }

    const confirmed = await showConfirm({
      title: 'Save order changes?',
      message: `This will update order ${orderNumber}/${orderBatch} with your current edits.`,
      confirmLabel: 'Save',
      cancelLabel: 'Keep editing',
    });

    if (!confirmed) {
      return;
    }

    await performSave();
  };

  const handleConfirmReset = async () => {
    if (isSaving || !order) {
      return;
    }

    const confirmed = await showConfirm({
      title: 'Reset unsaved changes?',
      message: 'Your current edits will be discarded and values restored from the latest saved order.',
      confirmLabel: 'Reset',
      cancelLabel: 'Continue editing',
      confirmVariant: 'danger',
    });

    if (!confirmed) {
      return;
    }

    setFormData(toOrderEditForm(order));
  };

  const handleDispatch = async () => {
    if (!canMutate) return;

    const confirmed = await showConfirm({
      title: 'Mark Order as Dispatched',
      message: `Are you sure you want to mark order ${orderNumber}/${orderBatch} as dispatched? This action cannot be undone.`,
      confirmLabel: 'Dispatch',
      cancelLabel: 'Cancel',
    });

    if (!confirmed) return;

    setIsDispatching(true);
    setError(null);
    try {
      await apiRequest(ENDPOINTS.orders.dispatch(orderNumber, orderBatch), {
        method: 'PATCH',
        requireAuth: true,
      });
      await reload();
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to dispatch order.');
      }
    } finally {
      if (isMountedRef.current) {
        setIsDispatching(false);
      }
    }
  };

  const topBarActions = useMemo<TopBarAction[]>(() => {
    const backAction = buildBackTopBarAction({
      onPress: () => router.back(),
      label: 'Back to orders',
    });

    if (isEditing) {
      return [
        buildIconTopBarAction({
          id: 'save-order',
          label: isSaving ? 'Saving...' : 'Save changes',
          accessibilityLabel: isSaving ? 'Saving order changes' : undefined,
          onPress: () => {
            void handleConfirmSave();
          },
          icon: SaveIcon,
          disabled: isSaving,
        }),
        buildIconTopBarAction({
          id: 'reset-order-form',
          label: 'Reset changes',
          onPress: () => {
            void handleConfirmReset();
          },
          icon: ResetIcon,
          disabled: isSaving || !order,
        }),
        buildIconTopBarAction({
          id: 'cancel-order-edit',
          label: 'Cancel edit',
          onPress: () => {
            setIsEditing(false);
            if (order) {
              setFormData(toOrderEditForm(order));
            }
          },
          icon: CancelEditIcon,
          disabled: isSaving,
        }),
        backAction,
      ];
    }

    return [
      buildIconTopBarAction({
        id: 'refresh-order-details',
        label: 'Refresh order',
        onPress: () => {
          void reload();
        },
        icon: RefreshCw,
        disabled: isLoading,
      }),
      buildIconTopBarAction({
        id: 'edit-order',
        label: 'Edit order',
        onPress: () => setIsEditing(true),
        icon: EditIcon,
        disabled: isLoading || !order || !canMutate,
      }),
      backAction,
    ];
  }, [canMutate, handleConfirmReset, handleConfirmSave, isEditing, isLoading, isSaving, order, router]);

  useScreenTopBar({ title: 'Order Detail', actions: topBarActions });

  return (
    <ScreenContent gap={10}>
      <Text style={styles.meta}>Order: {orderNumber} / Batch: {orderBatch}</Text>

      {isLoading ? <Text style={styles.muted}>Loading...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!isLoading && order ? (
        <ThemedCard style={styles.card}>
          <Text style={styles.cardItem}>Status: {order.status ?? 'Unknown'}</Text>
          <Text style={styles.cardItem}>Customer: {order.customerAccount ?? 'N/A'}</Text>

          {isEditing ? (
            <>
              <Text style={styles.label}>Customer Ref</Text>
              <ThemedInput
                placeholder="Customer ref"
                value={formData.customerRef ?? ''}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, customerRef: text }))}
                editable={!isSaving}
              />

              <Text style={styles.label}>Order Contact</Text>
              <ThemedInput
                placeholder="Order contact"
                value={formData.orderContact ?? ''}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, orderContact: text }))}
                editable={!isSaving}
              />

              <Text style={styles.label}>Delivery Address</Text>
              <ThemedInput
                placeholder="Delivery address"
                keyboardType="number-pad"
                value={formData.deliveryAddress}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, deliveryAddress: text }))}
                editable={!isSaving}
              />

              <Text style={styles.label}>Price Band</Text>
              <ThemedInput
                placeholder="Price band"
                value={formData.priceBand ?? ''}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, priceBand: text }))}
                editable={!isSaving}
              />
            </>
          ) : (
            <>
              <Text style={styles.cardItem}>Ref: {order.customerRef ?? 'N/A'}</Text>
              <Text style={styles.cardItem}>Order Contact: {order.orderContact ?? 'N/A'}</Text>
              <Text style={styles.cardItem}>Delivery Address: {order.deliveryAddress ?? 'N/A'}</Text>
              <Text style={styles.cardItem}>Price Band: {order.priceBand ?? 'N/A'}</Text>
            </>
          )}
        </ThemedCard>
      ) : null}

      {canMutate && !isEditing ? (
        <View style={styles.contentActionRowRight}>
          {order?.status === 'Dispatched' ? (
            <TooltipPressable
              tooltip="Order dispatched"
              accessibilityRole="button"
              accessibilityLabel="Order dispatched"
              disabled={true}
              style={[styles.contentActionButton, styles.contentActionButtonDisabled]}
            >
              <CheckSquare2 size={20} color={theme.colors.textMuted} />
              <Text style={[styles.contentActionButtonText, styles.contentActionButtonTextDisabled]}>
                Dispatched
              </Text>
            </TooltipPressable>
          ) : (
            <TooltipPressable
              tooltip={isDispatching ? 'Dispatching order' : 'Mark order as dispatched'}
              accessibilityRole="button"
              accessibilityLabel={isDispatching ? 'Dispatching order' : 'Mark order as dispatched'}
              disabled={isDispatching}
              onPress={handleDispatch}
              style={(state) => [
                styles.contentActionButton,
                isDispatching ? styles.contentActionButtonDisabled : null,
                isHovered(state) && !isDispatching ? styles.contentActionButtonHover : null,
                state.pressed && !isDispatching ? styles.contentActionButtonPressed : null,
              ]}
            >
              <Send size={20} color={isDispatching ? theme.colors.textMuted : theme.colors.navTextStrong} />
              <Text style={[styles.contentActionButtonText, isDispatching ? styles.contentActionButtonTextDisabled : null]}>
                {isDispatching ? 'Dispatching...' : 'Mark as dispatched'}
              </Text>
            </TooltipPressable>
          )}
        </View>
      ) : null}
    </ScreenContent>
  );
}

function isHovered(state: PressableStateCallbackType) {
  return (state as PressableStateCallbackType & { hovered?: boolean }).hovered === true;
}

function createStyles(theme: AppTheme) {
  const common = createCommonScreenStyleDefinitions(theme);

  return StyleSheet.create({
    ...common,
    card: {
      ...common.card,
      gap: 6,
    },
    label: {
      ...common.meta,
      marginTop: 8,
    },
    contentActionRowRight: {
      ...common.contentActionRowRight,
      marginTop: 4,
    },
  });
}
