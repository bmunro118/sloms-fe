import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import type { Router } from 'expo-router';
import { Pencil as EditIcon, PencilOff as CancelEditIcon, RotateCcw as ResetIcon, Save as SaveIcon } from 'lucide-react-native';
import { ENDPOINTS } from '@utils/config';
import { buildIconTopBarAction } from '@src/features/app-shell';
import { downloadAndShareBreakdownPdfNative } from '@src/features/orders/breakdown-download';
import { dispatchOrder, getOrderBreakdownPdf, updateOrder, voidOrder } from '@src/features/orders/api';
import { normaliseForDirtyCheck, useUnsavedChangesGuard } from '@src/hooks/useUnsavedChangesGuard';
import type { TopBarAction } from '@context/ScreenTitleContext';
import { type OrderDetails, type OrderEditForm, type OrderUpdatePayload, resolveOrderStatus, toOrderEditForm } from '@src/features/orders/types';

export interface OrderDetailMutationCallbacks {
  onTrackingRefresh: () => void;
}

export function useOrderDetailMutations({
  orderNumber,
  orderBatch,
  order,
  canMutate,
  isMountedRef,
  routeWantsEdit,
  routeWantsDispatch,
  isLoading,
  navigation,
  router,
  showConfirm,
  showDanger,
  showSuccess,
  showInfo,
  reload,
  onTrackingRefresh,
}: {
  orderNumber: number; orderBatch: number; order: OrderDetails | null; canMutate: boolean;
  isMountedRef: React.MutableRefObject<boolean>; routeWantsEdit: boolean; routeWantsDispatch: boolean;
  isLoading: boolean; navigation: NavigationProp<ReactNavigation.RootParamList>; router: Router;
  showConfirm: (opts: { title: string; message: string; confirmLabel?: string; cancelLabel?: string; confirmVariant?: 'danger' }) => Promise<boolean>;
  showDanger: (title: string, msg: string) => void; showSuccess: (title: string, msg: string) => void;
  showInfo: (title: string, msg: string) => void; reload: (signal?: AbortSignal) => Promise<void>;
  onTrackingRefresh?: () => void;
}) {
  const [isDispatching, setIsDispatching] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<OrderEditForm>(toOrderEditForm(null));
  const [hasAppliedRouteEdit, setHasAppliedRouteEdit] = useState(false);
  const [hasHandledRouteDispatch, setHasHandledRouteDispatch] = useState(false);
  const [itemsRefreshSignal, setItemsRefreshSignal] = useState(0);
  const isEditingRef = useRef(false);

  useEffect(() => { isEditingRef.current = isEditing; }, [isEditing]);

  // Save / reset / cancel
  const performSave = useCallback(async () => {
    if (!canMutate || isSaving) return;
    const payload: OrderUpdatePayload = {
      customerRef: formData.customerRef?.trim() || undefined,
      orderContact: formData.orderContact?.trim() || undefined,
      deliveryAddress: formData.deliveryAddress ?? undefined,
      priceBand: formData.priceBand?.trim() || undefined,
    };
    setIsSaving(true);
    try {
      const response = await updateOrder(orderNumber, orderBatch, payload);
      if (isMountedRef.current) {
        setFormData(toOrderEditForm(response));
        setIsEditing(false);
        showSuccess('Order updated', `Order ${orderNumber}/${orderBatch} was updated successfully.`);
        onTrackingRefresh?.();
        await reload();
      }
    } catch (err) {
      if (isMountedRef.current) showDanger('Save failed', err instanceof Error ? err.message : 'Failed to save order changes.');
    } finally {
      if (isMountedRef.current) setIsSaving(false);
    }
  }, [canMutate, formData, isMountedRef, isSaving, onTrackingRefresh, orderBatch, orderNumber, reload, showDanger, showSuccess]);

  const handleConfirmSave = useCallback(async () => {
    if (isSaving) return;
    const confirmed = await showConfirm({
      title: 'Save order changes?',
      message: `This will update order ${orderNumber}/${orderBatch} with your current edits.`,
      confirmLabel: 'Save',
      cancelLabel: 'Keep editing',
    });
    if (!confirmed) return;
    await performSave();
  }, [isSaving, orderBatch, orderNumber, performSave, showConfirm]);

  const handleConfirmReset = useCallback(async () => {
    if (isSaving || !order) return;
    const confirmed = await showConfirm({
      title: 'Reset unsaved changes?',
      message: 'Your current edits will be discarded and values restored from the latest saved order.',
      confirmLabel: 'Reset',
      cancelLabel: 'Continue editing',
      confirmVariant: 'danger',
    });
    if (!confirmed) return;
    setFormData(toOrderEditForm(order));
  }, [isSaving, order, showConfirm]);

  // Unsaved changes guard
  const isDirty = useMemo(
    () => isEditing && !!order && JSON.stringify(normaliseForDirtyCheck(formData)) !== JSON.stringify(normaliseForDirtyCheck(toOrderEditForm(order))),
    [isEditing, formData, order],
  );

  const { guardAction } = useUnsavedChangesGuard({ isDirty });

  const handleCancelOrderEdit = useCallback(() => {
    void guardAction(() => {
      setIsEditing(false);
      if (order) setFormData(toOrderEditForm(order));
    });
  }, [guardAction, order]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!isDirty) return;
      e.preventDefault();
      void guardAction(() => navigation.dispatch(e.data.action));
    });
    return unsubscribe;
  }, [navigation, isDirty, guardAction]);

  // Dispatch / download / void
  const handleDispatch = useCallback(async () => {
    if (!canMutate) return;
    const confirmed = await showConfirm({
      title: 'Mark Order as Dispatched',
      message: `Are you sure you want to mark order ${orderNumber}/${orderBatch} as dispatched? This action cannot be undone.`,
      confirmLabel: 'Dispatch',
      cancelLabel: 'Cancel',
    });
    if (!confirmed) return;
    setIsDispatching(true);
    try {
      await dispatchOrder(orderNumber, orderBatch);
      await reload();
      onTrackingRefresh?.();
    } catch (err) {
      if (isMountedRef.current) {
        const status = typeof (err as { status?: unknown }).status === 'number'
          ? (err as { status: number }).status : undefined;
        const code = typeof (err as { code?: unknown }).code === 'string'
          ? (err as { code: string }).code.toLowerCase() : '';
        if (status === 400 && (code.includes('delivery') || code.includes('address') || !order?.deliveryAddress)) {
          showDanger('Customer has no delivery address',
            'This order cannot be dispatched because no valid delivery address is selected. Add a customer delivery address, set it on the order, then try dispatch again.');
          return;
        }
        showDanger('Dispatch failed', err instanceof Error ? err.message : 'Failed to dispatch order. Please try again.');
      }
    } finally {
      if (isMountedRef.current) setIsDispatching(false);
    }
  }, [canMutate, isMountedRef, onTrackingRefresh, order, orderBatch, orderNumber, reload, showConfirm, showDanger]);

  const handleDownloadBreakdown = useCallback(async () => {
    try {
      const fileName = `order-${orderNumber}-${orderBatch}-breakdown.pdf`;
      if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof document !== 'undefined') {
        const pdfBlob = await getOrderBreakdownPdf(orderNumber, orderBatch);
        const objectUrl = URL.createObjectURL(pdfBlob);
        const anchor = document.createElement('a');
        anchor.href = objectUrl;
        anchor.download = fileName;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(objectUrl);
        showSuccess('Breakdown downloaded', `Saved ${fileName}.`);
        return;
      }
      const nativeResult = await downloadAndShareBreakdownPdfNative(
        ENDPOINTS.orders.breakdown(orderNumber, orderBatch), fileName);
      if (nativeResult.shared) {
        showSuccess('Breakdown ready', 'Download complete and share sheet opened.');
      } else {
        showInfo('Breakdown downloaded', `Saved ${fileName} to ${nativeResult.fileUri}.`);
      }
    } catch (err) {
      showDanger('Unable to download breakdown', err instanceof Error ? err.message : 'Breakdown download failed.');
    }
  }, [orderBatch, orderNumber, showDanger, showInfo, showSuccess]);

  const handleVoidOrder = useCallback(async () => {
    if (!canMutate) return;
    const confirmed = await showConfirm({
      title: 'Void this order?',
      message: `Order ${orderNumber}/${orderBatch} will be marked as voided. Continue?`,
      confirmLabel: 'Void order',
      cancelLabel: 'Cancel',
      confirmVariant: 'danger',
    });
    if (!confirmed) return;
    try {
      await voidOrder(orderNumber, orderBatch);
      onTrackingRefresh?.();
      showSuccess('Order voided', `Order ${orderNumber}/${orderBatch} was voided.`);
      router.replace('/(app)/orders');
    } catch (err) {
      showDanger('Unable to void order', err instanceof Error ? err.message : 'Void order request failed.');
    }
  }, [canMutate, onTrackingRefresh, orderBatch, orderNumber, router, showConfirm, showDanger, showSuccess]);

  // Route-driven actions
  useEffect(() => {
    if (!routeWantsEdit || hasAppliedRouteEdit || !order) return;
    setFormData(toOrderEditForm(order));
    setIsEditing(true);
    setHasAppliedRouteEdit(true);
  }, [hasAppliedRouteEdit, order, routeWantsEdit]);

  useEffect(() => {
    if (!routeWantsDispatch || hasHandledRouteDispatch) return;
    if (isLoading || !order || isDispatching) return;
    if (resolveOrderStatus(order)?.trim().toLowerCase() === 'dispatched') {
      setHasHandledRouteDispatch(true);
      return;
    }
    setHasHandledRouteDispatch(true);
    void handleDispatch();
  }, [handleDispatch, hasHandledRouteDispatch, isDispatching, isLoading, order, routeWantsDispatch]);

  // Card-level actions (edit/save/cancel for OrderDetailCard)
  const orderCardActions = useMemo<TopBarAction[]>(() => {
    if (!canMutate || !order) return [];
    if (isEditing) {
      return [
        buildIconTopBarAction({ id: 'save-order', label: isSaving ? 'Saving...' : 'Save changes', onPress: () => { void handleConfirmSave(); }, icon: SaveIcon, disabled: isSaving }),
        buildIconTopBarAction({ id: 'reset-order-form', label: 'Reset changes', onPress: () => { void handleConfirmReset(); }, icon: ResetIcon, disabled: isSaving || !order }),
        buildIconTopBarAction({ id: 'cancel-order-edit', label: 'Cancel edit', onPress: handleCancelOrderEdit, icon: CancelEditIcon, disabled: isSaving }),
      ];
    }
    return [
      buildIconTopBarAction({ id: 'edit-order', label: 'Edit order', onPress: () => setIsEditing(true), icon: EditIcon, disabled: isLoading || isSaving }),
    ];
  }, [canMutate, handleCancelOrderEdit, handleConfirmReset, handleConfirmSave, isEditing, isLoading, isSaving, order]);

  return {
    isDispatching,
    isEditing,
    setIsEditing,
    isSaving,
    formData,
    setFormData,
    hasAppliedRouteEdit,
    hasHandledRouteDispatch,
    itemsRefreshSignal,
    setItemsRefreshSignal,
    isDirty,
    guardAction,
    performSave,
    handleConfirmSave,
    handleConfirmReset,
    handleDispatch,
    handleDownloadBreakdown,
    handleVoidOrder,
    handleCancelOrderEdit,
    orderCardActions,
  };
}
