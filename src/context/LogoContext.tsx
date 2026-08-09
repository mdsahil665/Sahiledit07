import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { promptStore } from '../services/promptStore';

export const DEFAULT_LOGO_URL = ''; // Empty string triggers fallback default Sparkles logo icon

interface LogoContextType {
  logoUrl: string;
  loading: boolean;
  saveLogo: (newLogoUrl: string) => Promise<void>;
  restoreDefaultLogo: () => Promise<void>;
  deleteLogo: () => Promise<void>;
}

const LogoContext = createContext<LogoContextType | undefined>(undefined);

export const LogoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Listen to settings/site doc in Firestore for real-time instant updates across all sessions
    const siteSettingsRef = doc(db, 'settings', 'site');
    const unsubscribeSite = onSnapshot(
      siteSettingsRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const url = data?.logoUrl || '';
          setLogoUrl(url);
          // Also sync to favicon dynamically if supported
          if (url) {
            updateFavicon(url);
          } else {
            resetFavicon();
          }
        } else {
          // Fallback to websiteSettings from global or default
          const globalWebLogo = promptStore.getWebsiteSettings()?.websiteLogo || '';
          setLogoUrl(globalWebLogo);
          if (globalWebLogo) updateFavicon(globalWebLogo);
        }
        setLoading(false);
      },
      (error) => {
        console.warn('LogoContext settings/site snapshot notice:', error);
        const globalWebLogo = promptStore.getWebsiteSettings()?.websiteLogo || '';
        setLogoUrl(globalWebLogo);
        setLoading(false);
      }
    );

    return () => unsubscribeSite();
  }, []);

  const updateFavicon = (url: string) => {
    try {
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = url;
    } catch (e) {
      console.warn('Favicon update error:', e);
    }
  };

  const resetFavicon = () => {
    try {
      const link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (link) {
        link.href = '/favicon.ico';
      }
    } catch (e) {
      console.warn('Favicon reset error:', e);
    }
  };

  const saveLogo = async (newLogoUrl: string) => {
    setLogoUrl(newLogoUrl);
    if (newLogoUrl) {
      updateFavicon(newLogoUrl);
    } else {
      resetFavicon();
    }

    // Write to settings/site in Firestore
    const siteSettingsRef = doc(db, 'settings', 'site');
    await setDoc(
      siteSettingsRef,
      {
        logoUrl: newLogoUrl,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    // Also update websiteSettings in promptStore for backward compatibility
    await promptStore.updateWebsiteSettings({ websiteLogo: newLogoUrl });
  };

  const restoreDefaultLogo = async () => {
    await saveLogo('');
  };

  const deleteLogo = async () => {
    await saveLogo('');
  };

  return (
    <LogoContext.Provider
      value={{
        logoUrl,
        loading,
        saveLogo,
        restoreDefaultLogo,
        deleteLogo,
      }}
    >
      {children}
    </LogoContext.Provider>
  );
};

export const useLogo = () => {
  const context = useContext(LogoContext);
  if (!context) {
    throw new Error('useLogo must be used within a LogoProvider');
  }
  return context;
};
