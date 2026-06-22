import { useCallback, useEffect, useState } from 'react';
import type { Settings } from '@/types';
import { DEFAULT_SETTINGS, getStorageItem, initializeStorage, setStorageItem, subscribeStorage } from '@/storage';

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeStorage().then(async () => {
      const stored = await getStorageItem('settings');
      setSettings(stored ?? DEFAULT_SETTINGS);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    return subscribeStorage((changes) => {
      if (changes.settings) {
        setSettings(changes.settings);
      }
    });
  }, []);

  const updateSettings = useCallback(async (updates: Partial<Settings>) => {
    const current = (await getStorageItem('settings')) ?? DEFAULT_SETTINGS;
    const updated = { ...current, ...updates };
    await setStorageItem('settings', updated);
    setSettings(updated);
    return updated;
  }, []);

  return { settings, loading, updateSettings };
}
