import React from 'react';
import { LucideIcon, X as CloseIcon } from 'lucide-react-native';
import { TopBarAction } from '@context/ScreenTitleContext';

interface BuildCloseTopBarActionOptions {
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
}

export function buildIconTopBarAction({
  id,
  label,
  accessibilityLabel,
  onPress,
  icon: Icon,
  disabled,
  hidden,
}: BuildIconTopBarActionOptions): TopBarAction {
  return {
    id,
    label,
    accessibilityLabel: accessibilityLabel ?? label,
    onPress,
    disabled,
    hidden,
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
