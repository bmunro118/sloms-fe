import React from 'react';
import { LucideIcon } from 'lucide-react-native';
import { TopBarAction } from '@context/ScreenTitleContext';

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