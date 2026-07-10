import { useEffect, useRef, useState } from 'react';
import { Modal, Platform, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useAppTheme } from '@theme/ThemeProvider';
import { ThemedInput } from '@components/ui/ThemedInput';
import { ThemedButton } from '@components/ui/ThemedButton';
import { tokens } from '@theme/tokens';
import { useThemedStyles } from '@theme/useThemedStyles';
import { ScanCorrectionView } from './ScanCorrectionView';
import type { ScanStep, CapturedPhoto } from '../types';

interface ScanLabelsModalProps {
  visible: boolean;
  onClose: () => void;
  onLabelScanned: (label: string) => void;
  manualText: string;
  setManualText: (text: string) => void;
  handleManualSubmit: () => void;
  // New props for correction flow
  step: ScanStep;
  capturedPhoto: CapturedPhoto | null;
  correctionText: string;
  onPhotoTaken: (photo: CapturedPhoto) => void;
  onRetake: () => void;
  onCorrectionConfirm: (text: string) => void;
}

export function ScanLabelsModal({
  visible,
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
}: ScanLabelsModalProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (visible) {
      void requestPermission();
    }
  }, [visible, requestPermission]);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const onResize = () => {
        setDimensions({ width: window.innerWidth, height: window.innerHeight });
      };
      onResize();
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }
  }, []);

  const handleScan = async () => {
    try {
      if (!cameraRef.current) return;
      const photo = await cameraRef.current.takePictureAsync();
      if (photo) {
        onPhotoTaken({ uri: photo.uri });
      }
    } catch {
      // camera error — stays on camera step
    }
  };

  if (!permission) {
    return (
      <Modal visible={visible} transparent={false} animationType="slide" onRequestClose={onClose}>
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Loading...</Text>
        </View>
      </Modal>
    );
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} transparent={false} animationType="slide" onRequestClose={onClose}>
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Camera Permission Required</Text>
          <Text style={[styles.errorText, { color: theme.colors.danger }]}>
            Please grant camera permission to use the scanner.
          </Text>
          <ThemedButton
            variant="solid"
            onPress={onClose}
            label="Close"
            style={styles.closeButton}
          />
        </View>
      </Modal>
    );
  }

  const isNarrow = Platform.OS !== 'web' || dimensions.width < 768;

  if (step === 'correction' && capturedPhoto) {
    return (
      <Modal visible={visible} transparent={false} animationType="slide" onRequestClose={onClose}>
        <ScanCorrectionView
          photoUri={capturedPhoto.uri}
          initialText={correctionText}
          onConfirm={onCorrectionConfirm}
          onRetake={onRetake}
          onCancel={onClose}
        />
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent={false} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Scan Label</Text>

        {isNarrow ? (
          // Vertical layout for narrow screens
          <View style={styles.verticalLayout}>
            <View style={[styles.cameraContainer, { borderColor: theme.colors.border }]}>
              <CameraView
                ref={cameraRef}
                style={styles.camera}
                facing="back"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>
                Or enter manually
              </Text>
              <ThemedInput
                placeholder="Label Text"
                value={manualText}
                onChangeText={setManualText}
                multiline
                numberOfLines={4}
                style={[styles.input, { textAlignVertical: 'top' }]}
              />
            </View>
            <ThemedButton
              label="Submit Label"
              variant="solid"
              onPress={handleManualSubmit}
            />
            <View style={styles.buttonRow}>
              <ThemedButton
                variant="outline"
                onPress={onClose}
                label="Cancel"
                style={styles.button}
              />
              <ThemedButton
                variant="solid"
                onPress={handleScan}
                label="Scan"
                style={styles.button}
              />
            </View>
          </View>
        ) : (
          // Horizontal layout for wide screens
          <View style={styles.horizontalLayout}>
            <View style={[styles.leftSide, { gap: tokens.spacing.md }]}>
              <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>
                Enter label text
              </Text>
              <ThemedInput
                placeholder="Label Text"
                value={manualText}
                onChangeText={setManualText}
                multiline
                numberOfLines={4}
                style={[styles.input, { textAlignVertical: 'top' }]}
              />
              <ThemedButton
                label="Submit Label"
                variant="solid"
                onPress={handleManualSubmit}
              />
              <View style={styles.buttonRow}>
                <ThemedButton
                  variant="outline"
                  onPress={onClose}
                  label="Cancel"
                  style={styles.button}
                />
                <ThemedButton
                  variant="solid"
                  onPress={handleScan}
                  label="Scan"
                  style={styles.button}
                />
              </View>
            </View>
            <View style={[styles.rightSide, { borderColor: theme.colors.border }]}>
              <CameraView
                ref={cameraRef}
                style={styles.camera}
                facing="back"
              />
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

function createStyles() {
  return StyleSheet.create({
    container: {
      flex: 1,
      padding: tokens.spacing.md,
    },
    title: {
      fontSize: 20,
      fontWeight: '600' as const,
      marginBottom: tokens.spacing.lg,
    },
    errorText: {
      fontSize: 14,
      marginVertical: tokens.spacing.md,
    },
    verticalLayout: {
      flex: 1,
      gap: tokens.spacing.md,
    },
    horizontalLayout: {
      flex: 1,
      flexDirection: 'row',
      gap: tokens.spacing.md,
    },
    leftSide: {
      flex: 1,
      minWidth: 250,
    },
    rightSide: {
      flex: 1,
      borderWidth: 1,
      borderRadius: tokens.radii.md,
      overflow: 'hidden',
    },
    cameraContainer: {
      flex: 1,
      borderWidth: 1,
      borderRadius: tokens.radii.md,
      overflow: 'hidden',
    },
    camera: {
      flex: 1,
    },
    inputContainer: {
      flexShrink: 0,
    },
    sectionLabel: {
      fontSize: 14,
      fontWeight: '500' as const,
      marginBottom: tokens.spacing.sm,
    },
    input: {
      minHeight: 100,
      textAlignVertical: 'top',
    },
    buttonRow: {
      flexDirection: 'row',
      gap: tokens.spacing.sm,
      marginTop: tokens.spacing.md,
    },
    button: {
      flex: 1,
    },
    closeButton: {
      marginTop: tokens.spacing.md,
    },
  });
}
