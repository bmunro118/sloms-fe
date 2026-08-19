import { AppModalResolvedAction, AppModalResolvedRequest } from '@src/features/modal/types';
import { ResponsiveModal } from './ResponsiveModal';

interface AppModalProps {
  visible: boolean;
  request: AppModalResolvedRequest | null;
  onClose: () => void;
  onActionPress: (action: AppModalResolvedAction) => void;
}

export function AppModal({ visible, request, onClose, onActionPress }: AppModalProps) {
  if (!request) {
    return null;
  }

  return (
    <ResponsiveModal
      visible={visible}
      onClose={onClose}
      type={request.type}
      title={request.title}
      message={request.message}
      actions={request.actions}
      onActionPress={onActionPress}
      dismissible={request.dismissible}
    />
  );
}
