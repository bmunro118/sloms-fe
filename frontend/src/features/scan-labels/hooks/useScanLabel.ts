import { useState } from 'react';
import { scanLabelsApi } from '../api';
import type { ScanStep, CapturedPhoto } from '../types';

export interface UseScanLabelResult {
  isModalVisible: boolean;
  openScanner: () => void;
  closeScanner: () => void;
  scannedLabel: string | null;
  manualText: string;
  setManualText: (text: string) => void;
  handleManualSubmit: () => void;
  // New state and handlers for correction flow
  step: ScanStep;
  capturedPhoto: CapturedPhoto | null;
  correctionText: string;
  onPhotoTaken: (photo: CapturedPhoto) => void;
  onRetake: () => void;
  onCorrectionConfirm: (text: string) => void;
}

interface UseScanLabelProps {
  onLabelScanned: (label: string) => void;
}

export function useScanLabel({ onLabelScanned }: UseScanLabelProps): UseScanLabelResult {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [scannedLabel, setScannedLabel] = useState<string | null>(null);
  const [manualText, setManualText] = useState('');
  const [step, setStep] = useState<ScanStep>('camera');
  const [capturedPhoto, setCapturedPhoto] = useState<CapturedPhoto | null>(null);
  const [correctionText, setCorrectionText] = useState('');

  const openScanner = () => {
    setIsModalVisible(true);
    setManualText('');
    setScannedLabel(null);
    setStep('camera');
    setCapturedPhoto(null);
    setCorrectionText('');
  };

  const closeScanner = () => {
    setIsModalVisible(false);
    setManualText('');
    setStep('camera');
    setCapturedPhoto(null);
    setCorrectionText('');
  };

  const handleManualSubmit = () => {
    const trimmedText = manualText.trim();
    if (trimmedText) {
      setScannedLabel(trimmedText);
      onLabelScanned(trimmedText);
      closeScanner();
    }
  };

  const handlePhotoTaken = async (photo: CapturedPhoto) => {
    setCapturedPhoto(photo);
    const ocrResult = await scanLabelsApi();
    setCorrectionText(ocrResult.text);
    setStep('correction');
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    setStep('camera');
    setCorrectionText('');
  };

  const handleCorrectionConfirm = (text: string) => {
    onLabelScanned(text);
    closeScanner();
  };

  return {
    isModalVisible,
    openScanner,
    closeScanner,
    scannedLabel,
    manualText,
    setManualText,
    handleManualSubmit,
    step,
    capturedPhoto,
    correctionText,
    onPhotoTaken: handlePhotoTaken,
    onRetake: handleRetake,
    onCorrectionConfirm: handleCorrectionConfirm,
  };
}
