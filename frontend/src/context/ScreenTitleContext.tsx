import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export interface TopBarActionRenderArgs {
  color: string;
  size: number;
}

export interface TopBarAction {
  id: string;
  onPress: () => void;
  renderIcon: (args: TopBarActionRenderArgs) => React.ReactNode;
  accessibilityLabel: string;
  label?: string;
  disabled?: boolean;
  hidden?: boolean;
  isClose?: boolean;
}

export interface ScreenTopBarConfig {
  title: string;
  actions?: TopBarAction[];
}

interface ScreenTitleContextValue {
  title: string;
  actions: TopBarAction[];
  setTitle: (title: string) => void;
  setTopBar: (config: ScreenTopBarConfig) => void;
  resetTopBar: () => void;
}

const ScreenTitleContext = createContext<ScreenTitleContextValue | undefined>(undefined);

function areTopBarActionsEqual(left: TopBarAction[], right: TopBarAction[]): boolean {
  if (left === right) {
    return true;
  }

  if (left.length !== right.length) {
    return false;
  }

  for (let index = 0; index < left.length; index += 1) {
    const a = left[index];
    const b = right[index];

    if (
      a.id !== b.id
      || a.label !== b.label
      || a.accessibilityLabel !== b.accessibilityLabel
      || a.disabled !== b.disabled
      || a.hidden !== b.hidden
      || a.isClose !== b.isClose
      || a.onPress !== b.onPress
      || a.renderIcon !== b.renderIcon
    ) {
      return false;
    }
  }

  return true;
}

export function ScreenTitleProvider({ children }: { children: React.ReactNode }) {
  const [title, setTitleState] = useState('');
  const [actions, setActionsState] = useState<TopBarAction[]>([]);

  const setTitle = useCallback((newTitle: string) => {
    setTitleState(newTitle);
    setActionsState([]);
  }, []);

  const setTopBar = useCallback((config: ScreenTopBarConfig) => {
    const nextActions = config.actions ?? [];

    setTitleState((currentTitle) => (currentTitle === config.title ? currentTitle : config.title));
    setActionsState((currentActions) => (areTopBarActionsEqual(currentActions, nextActions) ? currentActions : nextActions));
  }, []);

  const resetTopBar = useCallback(() => {
    setTitleState((currentTitle) => (currentTitle === '' ? currentTitle : ''));
    setActionsState((currentActions) => (currentActions.length === 0 ? currentActions : []));
  }, []);

  const value = useMemo(() => ({
    title,
    actions,
    setTitle,
    setTopBar,
    resetTopBar,
  }), [actions, resetTopBar, setTitle, setTopBar, title]);

  return <ScreenTitleContext.Provider value={value}>{children}</ScreenTitleContext.Provider>;
}

export function useScreenTitleContext(): ScreenTitleContextValue {
  const ctx = useContext(ScreenTitleContext);

  if (!ctx) {
    throw new Error('useScreenTitleContext must be used within a ScreenTitleProvider');
  }

  return ctx;
}
