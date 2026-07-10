import { useCallback, useState } from 'react';
import { scanLabelFromImage } from '../api';
import type { ScanStep, CapturedPhoto, LabelExtraction, ScanResult } from '../types';

export interface UseScanLabelResult {
  isModalVisible: boolean;
  openScanner: () => void;
  closeScanner: () => void;
  scannedLabel: string | null;
  manualText: string;
  setManualText: (text: string) => void;
  handleManualSubmit: () => void;
  // Camera flow state
  step: ScanStep;
  capturedPhoto: CapturedPhoto | null;
  correctionText: string;
  onPhotoTaken: (photo: CapturedPhoto) => void;
  onRetake: () => void;
  onCorrectionConfirm: (text: string) => void;
  // New extraction flow state
  extraction: LabelExtraction | null;
  isLoading: boolean;
  error: string | null;
  handleConfirmExtraction: () => void;
}

interface UseScanLabelProps {
  onLabelScanned?: (label: string) => void;
  onScanComplete?: (result: ScanResult) => void;
  orderNumber?: number;
  orderBatch?: number;
}

export function useScanLabel({ 
  onLabelScanned,
  onScanComplete,
  orderNumber,
  orderBatch,
}: UseScanLabelProps): UseScanLabelResult {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [scannedLabel, setScannedLabel] = useState<string | null>(null);
  const [manualText, setManualText] = useState('');
  const [step, setStep] = useState<ScanStep>('camera');
  const [capturedPhoto, setCapturedPhoto] = useState<CapturedPhoto | null>(null);
  const [correctionText, setCorrectionText] = useState('');
  // New extraction state
  const [extraction, setExtraction] = useState<LabelExtraction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openScanner = useCallback(() => {
    setIsModalVisible(true);
    setManualText('');
    setScannedLabel(null);
    setStep('camera');
    setCapturedPhoto(null);
    setCorrectionText('');
    setExtraction(null);
    setError(null);
    setIsLoading(false);
  }, []);

  const closeScanner = useCallback(() => {
    setIsModalVisible(false);
    setManualText('');
    setStep('camera');
    setCapturedPhoto(null);
    setCorrectionText('');
    setExtraction(null);
    setError(null);
    setIsLoading(false);
  }, []);

  const handleManualSubmit = useCallback(() => {
    const trimmedText = manualText.trim();
    if (trimmedText) {
      setScannedLabel(trimmedText);
      onLabelScanned?.(trimmedText);
      closeScanner();
    }
  }, [manualText, onLabelScanned, closeScanner]);

  const handlePhotoTaken = useCallback(async (photo: CapturedPhoto) => {
    setCapturedPhoto(photo);
    setIsLoading(true);
    setError(null);

    // If we have order context, call the backend API with dry-run
    if (orderNumber !== undefined && orderBatch !== undefined) {
      try {
        const response = await scanLabelFromImage(orderNumber, orderBatch, photo.uri, true);
        setExtraction(response.extraction);
        setStep('review');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to scan label';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Fallback: manual text entry path (no order context)
    // For now, we'll transition to correction with empty text
    // The user can then enter text manually
    setCorrectionText('');
    setStep('correction');
    setIsLoading(false);
  }, [orderNumber, orderBatch]);

  const handleRetake = useCallback(() => {
    setCapturedPhoto(null);
    setStep('camera');
    setCorrectionText('');
    setExtraction(null);
    setError(null);
    setIsLoading(false);
  }, []);

  const handleCorrectionConfirm = useCallback((text: string) => {
    onLabelScanned?.(text);
    closeScanner();
  }, [onLabelScanned, closeScanner]);

  const handleConfirmExtraction = useCallback(async () => {
    if (!capturedPhoto || orderNumber === undefined || orderBatch === undefined) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await scanLabelFromImage(orderNumber, orderBatch, capturedPhoto.uri, false);
      
      // Notify parent of successful item creation
      onScanComplete?.({
        type: 'item',
        item: response.item,
        extraction: response.extraction,
        photoUri: capturedPhoto.uri,
      });
      
      closeScanner();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create item from label';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [capturedPhoto, orderNumber, orderBatch, onScanComplete, closeScanner]);

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
    // New extraction flow
    extraction,
    isLoading,
    error,
    handleConfirmExtraction,
  };
}
