import { useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useTooltipDismissal } from '@context/TooltipDismissalContext';

const DISMISS_CLEAR_DISTANCE_PX = 5;
const POST_DISMISS_COOLDOWN_MS = 500;

interface UseTooltipDismissalGateOptions {
  onDismiss: () => void;
}

interface UseTooltipDismissalGateReturn {
  dismissedRef: React.MutableRefObject<boolean>;
  gateClearedAtRef: React.MutableRefObject<number | null>;
  hideTooltipWithSuppression: () => void;
  checkCooldown: () => boolean;
  dismiss: (triggerBounds?: { x: number; y: number; width: number; height: number }) => void;
}

export function useTooltipDismissalGate(
  options: UseTooltipDismissalGateOptions
): UseTooltipDismissalGateReturn {
  const { onDismiss } = options;
  const { registerTooltip, modalOpen } = useTooltipDismissal();

  const dismissedRef = useRef(false);
  const lastDismissPtrPos = useRef<{ x: number; y: number } | null>(null);
  const dismissTriggerBounds = useRef<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const latestPtrPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const gateClearedAtRef = useRef<number | null>(null);
  const modalOpenRef = useRef(modalOpen);

  useEffect(() => {
    modalOpenRef.current = modalOpen;
  }, [modalOpen]);

  const hideTooltipWithSuppression = useCallback(() => {
    onDismiss();

    dismissedRef.current = true;
    lastDismissPtrPos.current = {
      x: latestPtrPosRef.current.x,
      y: latestPtrPosRef.current.y,
    };

    // Note: Cooldown starts when modal closes, not here
  }, [onDismiss]);

  const dismiss = useCallback((triggerBounds?: { x: number; y: number; width: number; height: number }) => {
    onDismiss();

    dismissedRef.current = true;
    lastDismissPtrPos.current = {
      x: latestPtrPosRef.current.x,
      y: latestPtrPosRef.current.y,
    };
    dismissTriggerBounds.current = triggerBounds ?? null;

    // Note: Cooldown starts when modal closes, not here
  }, [onDismiss]);

  const checkCooldown = useCallback(() => {
    if (gateClearedAtRef.current !== null) {
      const elapsed = Date.now() - gateClearedAtRef.current;
      if (elapsed < POST_DISMISS_COOLDOWN_MS) {
        return false;
      }
      gateClearedAtRef.current = null;
    }
    return true;
  }, []);

  // Register with global tooltip dismissal
  useEffect(() => {
    const unregister = registerTooltip(hideTooltipWithSuppression);
    return unregister;
  }, [registerTooltip, hideTooltipWithSuppression]);

  // Web: document-level pointer tracker
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handlePtrMove = (e: PointerEvent) => {
      latestPtrPosRef.current = { x: e.clientX, y: e.clientY };

      if (dismissedRef.current && lastDismissPtrPos.current) {
        const dx = e.clientX - lastDismissPtrPos.current.x;
        const dy = e.clientY - lastDismissPtrPos.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist >= DISMISS_CLEAR_DISTANCE_PX) {
          const bounds = dismissTriggerBounds.current;
          const outsideTrigger =
            !bounds ||
            e.clientX < bounds.x ||
            e.clientX > bounds.x + bounds.width ||
            e.clientY < bounds.y ||
            e.clientY > bounds.y + bounds.height;

          if (outsideTrigger && !modalOpenRef.current) {
            dismissedRef.current = false;
            lastDismissPtrPos.current = null;
            dismissTriggerBounds.current = null;
            gateClearedAtRef.current = Date.now();
          }
        }
      }
    };

    document.addEventListener('pointermove', handlePtrMove);
    return () => document.removeEventListener('pointermove', handlePtrMove);
  }, []);

  // When modal closes, check if we should clear the gate
  useEffect(() => {
    if (!modalOpen && dismissedRef.current && lastDismissPtrPos.current) {
      const bounds = dismissTriggerBounds.current;
      const ptr = latestPtrPosRef.current;
      const outsideTrigger =
        !bounds ||
        ptr.x < bounds.x ||
        ptr.x > bounds.x + bounds.width ||
        ptr.y < bounds.y ||
        ptr.y > bounds.y + bounds.height;

      if (outsideTrigger) {
        dismissedRef.current = false;
        lastDismissPtrPos.current = null;
        dismissTriggerBounds.current = null;
        gateClearedAtRef.current = Date.now();
      }
    }
  }, [modalOpen]);

  return {
    dismissedRef,
    gateClearedAtRef,
    hideTooltipWithSuppression,
    checkCooldown,
    dismiss,
  };
}
