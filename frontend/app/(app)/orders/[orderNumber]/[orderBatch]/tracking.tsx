import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { LoadingSpinner } from '@components/ui/LoadingSpinner';

/**
 * Redirect screen — preserves deep links to the old /tracking route
 * by redirecting to the unified Order Detail screen which now
 * contains all tracking data inline.
 */
export default function OrderTrackingRedirectScreen() {
  const params = useLocalSearchParams<{ orderNumber: string; orderBatch: string }>();
  const router = useRouter();
  const orderNumber = Number(params.orderNumber);
  const orderBatch = Number(params.orderBatch);

  useEffect(() => {
    if (Number.isFinite(orderNumber) && Number.isFinite(orderBatch)) {
      router.replace(`/(app)/orders/${orderNumber}/${orderBatch}` as never);
    } else {
      router.replace('/(app)/orders');
    }
  }, [orderBatch, orderNumber, router]);

  return <LoadingSpinner message="Redirecting..." fullScreen />;
}
