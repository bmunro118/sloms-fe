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

export function ScreenTitleProvider({ children }: { children: React.ReactNode }) {
  const [title, setTitleState] = useState('');
  const [actions, setActionsState] = useState<TopBarAction[]>([]);

  const setTitle = useCallback((newTitle: string) => {
    setTitleState(newTitle);
    setActionsState([]);
  }, []);

  const setTopBar = useCallback((config: ScreenTopBarConfig) => {
    setTitleState(config.title);
    setActionsState(config.actions ?? []);
  }, []);

  const resetTopBar = useCallback(() => {
    setTitleState('');
    setActionsState([]);
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
