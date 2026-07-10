import { ScanLabelsModal } from '@features/scan-labels';
import type { CapturedPhoto, ScanStep, LabelExtraction } from '@features/scan-labels';

interface OrderScanSectionProps {
  scanLabelsEnabled: boolean;
  isModalVisible: boolean;
  onClose: () => void;
  onLabelScanned: () => void;
  manualText: string;
  setManualText: (text: string) => void;
  handleManualSubmit: () => void;
  step: ScanStep;
  capturedPhoto: CapturedPhoto | null;
  correctionText: string;
  onPhotoTaken: (photo: CapturedPhoto) => void;
  onRetake: () => void;
  onCorrectionConfirm: (text: string) => void;
  extraction: LabelExtraction | null;
  isLoading: boolean;
  error: string | null;
  onConfirmExtraction: () => void;
}

export function OrderScanSection({
  scanLabelsEnabled,
  isModalVisible,
  onClose,
  onLabelScanned,
  manualText,
  setManualText,
  handleManualSubmit,
  step,
  capturedPhoto,
  correctionText,
  onPhotoTaken,
  onRetake,
  onCorrectionConfirm,
  extraction,
  isLoading,
  error,
  onConfirmExtraction,
}: OrderScanSectionProps) {
  if (!scanLabelsEnabled) {
    return null;
  }

  return (
    <ScanLabelsModal
      visible={isModalVisible}
      onClose={onClose}
      onLabelScanned={onLabelScanned}
      manualText={manualText}
      setManualText={setManualText}
      handleManualSubmit={handleManualSubmit}
      step={step}
      capturedPhoto={capturedPhoto}
      correctionText={correctionText}
      onPhotoTaken={onPhotoTaken}
      onRetake={onRetake}
      onCorrectionConfirm={onCorrectionConfirm}
      extraction={extraction}
      isLoading={isLoading}
      error={error}
      onConfirmExtraction={onConfirmExtraction}
    />
  );
}
