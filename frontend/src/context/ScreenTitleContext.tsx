import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

interface ScreenTitleContextValue {
  title: string;
  setTitle: (title: string) => void;
}

const ScreenTitleContext = createContext<ScreenTitleContextValue | undefined>(undefined);

export function ScreenTitleProvider({ children }: { children: React.ReactNode }) {
  const [title, setTitleState] = useState('');

  const setTitle = useCallback((newTitle: string) => {
    setTitleState(newTitle);
  }, []);

  const value = useMemo(() => ({ title, setTitle }), [title, setTitle]);

  return <ScreenTitleContext.Provider value={value}>{children}</ScreenTitleContext.Provider>;
}

export function useScreenTitleContext(): ScreenTitleContextValue {
  const ctx = useContext(ScreenTitleContext);

  if (!ctx) {
    throw new Error('useScreenTitleContext must be used within a ScreenTitleProvider');
  }

  return ctx;
}
