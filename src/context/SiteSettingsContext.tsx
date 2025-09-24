import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { SiteSettings } from '../types';
import { db } from '../utils/firebase';

interface SiteSettingsContextType {
  settings: Partial<SiteSettings>;
  loading: boolean;
}

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined);

export const SiteSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Partial<SiteSettings>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        const settingsRef = db.ref('site_settings');
        const snapshot = await settingsRef.get();
        
        if (snapshot.exists()) {
          setSettings(snapshot.val());
        }
      } catch (err) {
          console.error("Could not load site settings:", err);
      } finally {
          setLoading(false);
      }
    };

    loadSettings();
  }, []);

  return (
    <SiteSettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SiteSettingsContext.Provider>
  );
};

export const useSiteSettings = () => {
  const context = useContext(SiteSettingsContext);
  if (context === undefined) {
    throw new Error('useSiteSettings must be used within a SiteSettingsProvider');
  }
  return context;
};
