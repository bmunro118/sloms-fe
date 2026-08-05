import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

/**
 * Context type for order detail refresh coordination.
 * Provides lightweight refresh signal management for the order detail screen.
 */
interface OrderDetailRefreshContextType {
  /** Signal counter for tracking data refresh */
  trackingRefreshSignal: number;
  /** Increment tracking refresh signal */
  triggerTrackingRefresh: () => void;
}

/**
 * Default context value with no-op functions
 */
const defaultContext: OrderDetailRefreshContextType = {
  trackingRefreshSignal: 0,
  triggerTrackingRefresh: () => {},
};

/**
 * React Context for sharing refresh signals within order detail screen
 */
export const OrderDetailRefreshContext = createContext<OrderDetailRefreshContextType>(defaultContext);

/**
 * Provider component for OrderDetailRefreshContext
 */
export function OrderDetailRefreshProvider({ children }: { children: ReactNode }) {
  const [trackingRefreshSignal, setTrackingRefreshSignal] = useState(0);

  const triggerTrackingRefresh = useCallback(() => {
    setTrackingRefreshSignal((prev) => prev + 1);
  }, []);

  const contextValue = useMemo(
    () => ({
      trackingRefreshSignal,
      triggerTrackingRefresh,
    }),
    [trackingRefreshSignal, triggerTrackingRefresh]
  );

  return (
    <OrderDetailRefreshContext.Provider value={contextValue}>
      {children}
    </OrderDetailRefreshContext.Provider>
  );
}

/**
 * Hook for accessing order detail refresh coordination utilities.
 * Returns refresh coordination utilities for order detail screen mutations.
 */
export function useOrderDetailRefresh() {
  const context = useContext(OrderDetailRefreshContext);
  return context;
}
