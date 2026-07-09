import { useState } from 'react';

export interface UseScanLabelResult {
  isModalVisible: boolean;
  openScanner: () => void;
  closeScanner: () => void;
  scannedLabel: string | null;
  manualText: string;
  setManualText: (text: string) => void;
  handleManualSubmit: () => void;
}

interface UseScanLabelProps {
  onLabelScanned: (label: string) => void;
}

export function useScanLabel({ onLabelScanned }: UseScanLabelProps): UseScanLabelResult {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [scannedLabel, setScannedLabel] = useState<string | null>(null);
  const [manualText, setManualText] = useState('');

  const openScanner = () => {
    setIsModalVisible(true);
    setManualText('');
    setScannedLabel(null);
  };

  const closeScanner = () => {
    setIsModalVisible(false);
    setManualText('');
  };

  const handleManualSubmit = () => {
    const trimmedText = manualText.trim();
    if (trimmedText) {
      setScannedLabel(trimmedText);
      onLabelScanned(trimmedText);
      closeScanner();
    }
  };

  return {
    isModalVisible,
    openScanner,
    closeScanner,
    scannedLabel,
    manualText,
    setManualText,
    handleManualSubmit,
  };
}
