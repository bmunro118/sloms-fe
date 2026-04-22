import { useEffect } from 'react';
import { useScreenTitleContext } from '@context/ScreenTitleContext';

export function useScreenTitle(title: string): void {
  const { setTitle } = useScreenTitleContext();

  useEffect(() => {
    setTitle(title);
    return () => {
      setTitle('');
    };
  }, [title, setTitle]);
}
