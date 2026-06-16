import { PropsWithChildren, createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

interface TooltipDismissalContextValue {
  dismissAllTooltips: () => void;
  registerTooltip: (dismissCallback: () => void) => () => void;
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
}

const TooltipDismissalContext = createContext<TooltipDismissalContextValue | undefined>(undefined);

export function TooltipDismissalProvider({ children }: PropsWithChildren) {
  const dismissCallbacks = useRef(new Set<() => void>());
  const [modalOpen, setModalOpen] = useState(false);

  const dismissAllTooltips = useCallback(() => {
    dismissCallbacks.current.forEach((callback) => callback());
  }, []);

  const registerTooltip = useCallback((dismissCallback: () => void) => {
    dismissCallbacks.current.add(dismissCallback);
    return () => {
      dismissCallbacks.current.delete(dismissCallback);
    };
  }, []);

  const value = useMemo<TooltipDismissalContextValue>(
    () => ({ dismissAllTooltips, registerTooltip, modalOpen, setModalOpen }),
    [dismissAllTooltips, registerTooltip, modalOpen],
  );

  return (
    <TooltipDismissalContext.Provider value={value}>
      {children}
    </TooltipDismissalContext.Provider>
  );
}

export function useTooltipDismissal(): TooltipDismissalContextValue {
  const context = useContext(TooltipDismissalContext);

  if (!context) {
    throw new Error('useTooltipDismissal must be used within TooltipDismissalProvider.');
  }

  return context;
}
