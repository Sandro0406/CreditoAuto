import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { getSettings } from '../lib/api/settings';
import { DEFAULT_CONFIG, type AppConfig } from '../lib/types';
import { useAuth } from './AuthContext';

interface SettingsContextValue {
  settings: AppConfig;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [settings, setSettings] = useState<AppConfig>({ ...DEFAULT_CONFIG });

  const refreshSettings = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setSettings(await getSettings());
    } catch {
      setSettings({ ...DEFAULT_CONFIG });
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  return (
    <SettingsContext.Provider value={{ settings, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useAppSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useAppSettings debe usarse dentro de SettingsProvider');
  return ctx;
}
