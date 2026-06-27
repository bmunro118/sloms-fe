import {
  BarChart3,
  CircleUser,
  FileText,
  LayoutDashboard,
  Package,
  Percent,
  Settings,
  Tags,
  UserCog,
  Users,
} from 'lucide-react-native';
import { AppShellNavIcon } from '@src/features/app-shell';

type NavItemIconProps = {
  icon: AppShellNavIcon;
  color: string;
  size?: number;
};

export function NavItemIcon({ icon, color, size = 18 }: NavItemIconProps) {
  switch (icon) {
    case 'layout-dashboard':
      return <LayoutDashboard color={color} size={size} />;
    case 'bar-chart':
      return <BarChart3 color={color} size={size} />;
    case 'package':
      return <Package color={color} size={size} />;
    case 'users':
      return <Users color={color} size={size} />;
    case 'user-cog':
      return <UserCog color={color} size={size} />;
    case 'file-text':
      return <FileText color={color} size={size} />;
    case 'tags':
      return <Tags color={color} size={size} />;
    case 'settings':
      return <Settings color={color} size={size} />;
    case 'percent':
      return <Percent color={color} size={size} />;
    case 'circle-user':
      return <CircleUser color={color} size={size} />;
    default:
      return <CircleUser color={color} size={size} />;
  }
}
