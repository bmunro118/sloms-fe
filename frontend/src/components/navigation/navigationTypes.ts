import { PropsWithChildren } from 'react';
import { AppShellNavItem } from '@src/features/app-shell';

export interface NavLayoutProps extends PropsWithChildren {
  items: AppShellNavItem[];
  onSignOut: () => Promise<void> | void;
}