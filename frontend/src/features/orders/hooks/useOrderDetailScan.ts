import { useCallback, useState } from 'react';
import { useScanLabel } from '@features/scan-labels';
import type { UseScanLabelResult } from '@features/scan-labels/hooks/useScanLabel';
import type { ScanResult } from '@features/scan-labels/types';

export interface UseOrderDetailScanParams {
  orderNumber: number;
  orderBatch: number;
  onTrackingRefresh?: () => void;
}

export interface UseOrderDetailScanResult extends UseScanLabelResult {
  lastCreatedItem: unknown | null;
  refreshSignal: number;
  resetLastCreatedItem: () => void;
}

/**
 * Hook for managing label scanning on the order detail page.
 * Handles the scan-to-add-item flow and exposes state for the page to react to.
 */
export function useOrderDetailScan(
  orderNumber: number,
  orderBatch: number,
  onTrackingRefresh?: () => void,
): UseOrderDetailScanResult {
  const [lastCreatedItem, setLastCreatedItem] = useState<unknown | null>(null);
  const [refreshSignal, setRefreshSignal] = useState(0);

  const handleScanComplete = useCallback((result: ScanResult) => {
    if (result.type === 'item') {
      setLastCreatedItem(result.item);
      // Increment refresh signal to trigger items list reload
      setRefreshSignal((prev) => prev + 1);
      // Trigger tracking refresh to update timeline
      onTrackingRefresh?.();
    }
  }, [onTrackingRefresh]);

  const resetLastCreatedItem = useCallback(() => {
    setLastCreatedItem(null);
  }, []);

  const scanLabelResult = useScanLabel({
    orderNumber,
    orderBatch,
    onScanComplete: handleScanComplete,
  });

  return {
    ...scanLabelResult,
    lastCreatedItem,
    refreshSignal,
    resetLastCreatedItem,
  };
}
