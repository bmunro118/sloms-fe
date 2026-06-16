import React, { PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppModal } from '@components/ui/AppModal';
import { registerAppModalController } from '@src/features/modal/modal-controller';
import { useTooltipDismissal } from '@context/TooltipDismissalContext';
import {
  AppModalConfirmOptions,
  AppModalRequest,
  AppModalResolvedAction,
  AppModalResolvedRequest,
} from '@src/features/modal/types';

interface AppModalContextValue {
  openModal: (request: AppModalRequest) => void;
  closeModal: () => void;
  showInfo: (title: string, message?: string) => void;
  showSuccess: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
  showDanger: (title: string, message?: string) => void;
  showConfirm: (options: AppModalConfirmOptions) => Promise<boolean>;
}

const AppModalContext = createContext<AppModalContextValue | undefined>(undefined);

function buildResolvedRequest(request: AppModalRequest): AppModalResolvedRequest {
  const defaultActions: AppModalResolvedAction[] = [
    {
      id: 'ok',
      label: 'OK',
      closeOnPress: true,
      variant: 'primary',
    },
  ];

  const resolvedActions = request.actions?.length
    ? request.actions.map((action, index) => ({
      ...action,
      id: action.id ?? `action-${index}`,
      closeOnPress: action.closeOnPress ?? true,
      variant: action.variant ?? 'primary',
    }))
    : defaultActions;

  return {
    ...request,
    type: request.type ?? 'info',
    dismissible: request.dismissible ?? true,
    actions: resolvedActions,
  };
}

export function AppModalProvider({ children }: PropsWithChildren) {
  const [activeModal, setActiveModal] = useState<AppModalResolvedRequest | null>(null);
  const { dismissAllTooltips, setModalOpen } = useTooltipDismissal();

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setActiveModal((current) => {
      current?.onDismiss?.();
      return null;
    });
  }, [setModalOpen]);

  const openModal = useCallback((request: AppModalRequest) => {
    dismissAllTooltips();
    setModalOpen(true);
    setActiveModal(buildResolvedRequest(request));
  }, [dismissAllTooltips, setModalOpen]);

  const showInfo = useCallback((title: string, message?: string) => {
    openModal({ type: 'info', title, message });
  }, [openModal]);

  const showSuccess = useCallback((title: string, message?: string) => {
    openModal({ type: 'success', title, message });
  }, [openModal]);

  const showWarning = useCallback((title: string, message?: string) => {
    openModal({ type: 'warning', title, message });
  }, [openModal]);

  const showDanger = useCallback((title: string, message?: string) => {
    openModal({ type: 'danger', title, message });
  }, [openModal]);

  const showConfirm = useCallback((options: AppModalConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      let settled = false;

      const settle = (value: boolean) => {
        if (settled) {
          return;
        }

        settled = true;
        resolve(value);
      };

      openModal({
        type: 'confirm',
        title: options.title,
        message: options.message,
        dismissible: options.dismissible ?? true,
        onDismiss: () => {
          options.onDismiss?.();
          settle(false);
        },
        actions: [
          {
            id: 'cancel',
            label: options.cancelLabel ?? 'Cancel',
            variant: 'secondary',
            onPress: () => {
              options.onCancel?.();
              settle(false);
            },
          },
          {
            id: 'confirm',
            label: options.confirmLabel ?? 'Confirm',
            variant: options.confirmVariant ?? 'primary',
            onPress: () => {
              options.onConfirm?.();
              settle(true);
            },
          },
        ],
      });
    });
  }, [openModal]);

  const onActionPress = useCallback((action: AppModalResolvedAction) => {
    const execute = async () => {
      try {
        await action.onPress?.();
      } catch (error) {
        console.error('[modal] action handler failed', error);
      }

      if (action.closeOnPress) {
        closeModal();
      }
    };

    void execute();
  }, [closeModal]);

  const value = useMemo<AppModalContextValue>(() => ({
    openModal,
    closeModal,
    showInfo,
    showSuccess,
    showWarning,
    showDanger,
    showConfirm,
  }), [closeModal, openModal, showConfirm, showDanger, showInfo, showSuccess, showWarning]);

  useEffect(() => {
    registerAppModalController(value);

    return () => {
      registerAppModalController(null);
    };
  }, [value]);

  return (
    <AppModalContext.Provider value={value}>
      {children}
      <AppModal visible={activeModal !== null} request={activeModal} onClose={closeModal} onActionPress={onActionPress} />
    </AppModalContext.Provider>
  );
}

export function useAppModalContext(): AppModalContextValue {
  const context = useContext(AppModalContext);

  if (!context) {
    throw new Error('useAppModalContext must be used within AppModalProvider.');
  }

  return context;
}
