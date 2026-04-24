export type AppModalType = 'info' | 'success' | 'warning' | 'danger' | 'confirm';

export type AppModalActionVariant = 'primary' | 'secondary' | 'danger';

export interface AppModalAction {
  id?: string;
  label: string;
  onPress?: () => void | Promise<void>;
  closeOnPress?: boolean;
  variant?: AppModalActionVariant;
  disabled?: boolean;
}

export interface AppModalRequest {
  type?: AppModalType;
  title: string;
  message?: string;
  actions?: AppModalAction[];
  dismissible?: boolean;
  onDismiss?: () => void;
}

export interface AppModalResolvedAction extends Omit<AppModalAction, 'id' | 'closeOnPress' | 'variant'> {
  id: string;
  closeOnPress: boolean;
  variant: AppModalActionVariant;
}

export interface AppModalResolvedRequest extends Omit<AppModalRequest, 'type' | 'actions' | 'dismissible'> {
  type: AppModalType;
  actions: AppModalResolvedAction[];
  dismissible: boolean;
}

export interface AppModalConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: AppModalActionVariant;
  dismissible?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
  onDismiss?: () => void;
}
