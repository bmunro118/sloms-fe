import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { View, StyleSheet, Text, Platform, ViewStyle } from 'react-native';
import { tokens } from '@theme/tokens';
import { useThemedStyles } from '@theme/useThemedStyles';
import { useAppTheme } from '@theme/ThemeProvider';

export interface WebCameraViewHandle {
  takePhoto: () => Promise<{ uri: string } | null>;
}

export interface WebCameraViewProps {
  style?: ViewStyle;
}

export const WebCameraView = forwardRef<WebCameraViewHandle, WebCameraViewProps>(
  ({ style }, ref) => {
    const theme = useAppTheme();
    const styles = useThemedStyles(createStyles);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);

    useImperativeHandle(
      ref,
      () => ({
        takePhoto: async () => {
          if (!videoRef.current || !canvasRef.current) {
            return null;
          }

          try {
            // Ensure video is playing
            if (videoRef.current.readyState < 4) { // HAVE_CURRENT_DATA = 4
              return null;
            }

            const video = videoRef.current;
            const canvas = canvasRef.current;

            // Set canvas dimensions to match video stream
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Draw video frame to canvas
            const context = canvas.getContext('2d');
            if (!context) {
              return null;
            }
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Convert canvas to data URL (JPEG)
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

            return { uri: dataUrl };
          } catch {
            return null;
          }
        },
      }),
      [],
    );

    useEffect(() => {
      if (Platform.OS !== 'web') {
        return;
      }

      const setupCamera = async () => {
        try {
          // Check if getUserMedia is available
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setError('Camera not available in this browser');
            return;
          }

          // Request camera access with video only, facing the user (front) or environment (back)
          // We prefer environment (back) camera for scanning labels
          const constraints: MediaStreamConstraints = {
            video: {
              facingMode: 'environment',
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
          };

          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          mediaStreamRef.current = stream;
          setError(null);

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to access camera';
          setError(errorMessage);
          mediaStreamRef.current = null;
        }
      };

      void setupCamera();

      return () => {
        // Stop all media tracks on unmount
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }
      };
    }, []);

    if (Platform.OS !== 'web') {
      // This component should only be used on web
      // Return a placeholder on native platforms
      return (
        <View style={[styles.container, style, { backgroundColor: theme.colors.background }]}>
          <Text style={[styles.errorText, { color: theme.colors.textPrimary }]}>
            Camera view not available on this platform
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={[styles.container, style, { backgroundColor: theme.colors.background }]}>
          <Text style={[styles.errorText, { color: theme.colors.textPrimary }]}>{error}</Text>
        </View>
      );
    }

    return (
      <View style={[styles.container, style, { backgroundColor: theme.colors.background }]}>
        {typeof window !== 'undefined' && (
          <>
            <video
              ref={videoRef}
              style={styles.video}
              playsInline
              autoPlay
              muted
              onError={() => {
                setError('Failed to initialize camera feed');
              }}
            />
            <canvas ref={canvasRef} style={styles.canvas} />
          </>
        )}
      </View>
    );
  },
);

function createStyles() {
  return StyleSheet.create({
    container: {
      flex: 1,
      borderRadius: tokens.radii.md,
      overflow: 'hidden',
      justifyContent: 'center',
      alignItems: 'center',
    },
    video: {
      flex: 1,
      width: '100%',
      objectFit: 'cover',
    },
    canvas: {
      position: 'absolute',
      opacity: 0,
      pointerEvents: 'none',
    },
    errorText: {
      fontSize: 14,
      padding: tokens.spacing.md,
      textAlign: 'center',
    },
  });
}
