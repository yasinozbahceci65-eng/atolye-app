import { useEffect } from 'react';
import { Platform } from 'react-native';

export function useFrameworkReady() {
  useEffect(() => {
    if (Platform.OS === 'web') {
      // @ts-expect-error - window only exists on web
      window.frameworkReady?.();
    }
  }, []);
}
