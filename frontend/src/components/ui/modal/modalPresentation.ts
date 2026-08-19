import {
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
  CircleHelp,
  LucideIcon,
  OctagonAlert,
} from 'lucide-react-native';
import { AppTheme } from '@theme/types';
import { AppModalType } from '@src/features/modal/types';

export interface ModalPresentation {
  Icon: LucideIcon;
  accentColor: string;
  chipColor: string;
  chipLabel: string;
}

export function createModalPresentation(type: AppModalType, theme: AppTheme): ModalPresentation {
  const successColor = theme.mode === 'dark' ? '#4ade80' : '#166534';
  const warningColor = theme.mode === 'dark' ? '#fbbf24' : '#b45309';

  switch (type) {
    case 'success':
      return {
        Icon: CheckCircle2,
        accentColor: successColor,
        chipColor: withAlpha(successColor, theme.isDark ? 0.22 : 0.16),
        chipLabel: 'Success',
      };
    case 'warning':
      return {
        Icon: AlertTriangle,
        accentColor: warningColor,
        chipColor: withAlpha(warningColor, theme.isDark ? 0.24 : 0.16),
        chipLabel: 'Warning',
      };
    case 'danger':
      return {
        Icon: OctagonAlert,
        accentColor: theme.colors.danger,
        chipColor: theme.colors.dangerSurface,
        chipLabel: 'Danger',
      };
    case 'confirm':
      return {
        Icon: CircleHelp,
        accentColor: theme.colors.accentMuted,
        chipColor: withAlpha(theme.colors.accentMuted, theme.isDark ? 0.24 : 0.14),
        chipLabel: 'Confirm',
      };
    case 'info':
    default:
      return {
        Icon: CircleAlert,
        accentColor: theme.colors.accent,
        chipColor: withAlpha(theme.colors.accent, theme.isDark ? 0.24 : 0.14),
        chipLabel: 'Info',
      };
  }
}

export function withAlpha(hexColor: string, alpha: number): string {
  if (!hexColor.startsWith('#') || (hexColor.length !== 7 && hexColor.length !== 4)) {
    return hexColor;
  }

  const normalized = hexColor.length === 4
    ? `#${hexColor[1]}${hexColor[1]}${hexColor[2]}${hexColor[2]}${hexColor[3]}${hexColor[3]}`
    : hexColor;
  const channel = Math.max(0, Math.min(255, Math.round(alpha * 255))).toString(16).padStart(2, '0');

  return `${normalized}${channel}`;
}
