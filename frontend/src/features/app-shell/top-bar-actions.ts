import React from 'react';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { ArrowBigLeft as BackIcon, LucideIcon, X as CloseIcon } from 'lucide-react-native';
import { TopBarAction } from '@context/ScreenTitleContext';

interface BuildCloseTopBarActionOptions {
  onPress: () => void;
  label?: string;
  accessibilityLabel?: string;
  disabled?: boolean;
  hidden?: boolean;
}

interface BuildBackTopBarActionOptions {
  onPress: () => void;
  label?: string;
  accessibilityLabel?: string;
  disabled?: boolean;
  hidden?: boolean;
}

interface BuildIconTopBarActionOptions {
  id: string;
  label: string;
  accessibilityLabel?: string;
  onPress: () => void;
  icon: LucideIcon;
  disabled?: boolean;
  hidden?: boolean;
  primary?: boolean;
  secondary?: boolean;
}

export function buildIconTopBarAction({
  id,
  label,
  accessibilityLabel,
  onPress,
  icon: Icon,
  disabled,
  hidden,
  primary,
  secondary,
}: BuildIconTopBarActionOptions): TopBarAction {
  return {
    id,
    label,
    accessibilityLabel: accessibilityLabel ?? label,
    onPress,
    disabled,
    hidden,
    primary,
    secondary,
    renderIcon: ({ color, size }) => React.createElement(Icon, { color, size }),
  };
}

export function buildCloseTopBarAction({
  onPress,
  label = 'Close',
  accessibilityLabel,
  disabled,
  hidden,
}: BuildCloseTopBarActionOptions): TopBarAction {
  return {
    ...buildIconTopBarAction({
      id: 'close-screen',
      label,
      accessibilityLabel: accessibilityLabel ?? label,
      onPress,
      icon: CloseIcon,
      disabled,
      hidden,
    }),
    isClose: true,
  };
}

export function goBackWithBrowserFallback(): void {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.history.length > 1) {
    window.history.back();
    return;
  }
  if (router.canGoBack()) {
    router.back();
  }
}

export function buildBackTopBarAction({
  onPress,
  label = 'Back',
  accessibilityLabel,
  disabled,
  hidden,
}: BuildBackTopBarActionOptions): TopBarAction {
  return {
    ...buildIconTopBarAction({
      id: 'back-screen',
      label,
      accessibilityLabel: accessibilityLabel ?? label,
      onPress,
      icon: BackIcon,
      disabled,
      hidden,
    }),
    isBack: true,
  };
}
