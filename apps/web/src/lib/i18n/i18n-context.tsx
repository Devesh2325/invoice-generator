'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import enTranslations from './locales/en.json';
import hiTranslations from './locales/hi.json';
import { startDomTranslator, type PhraseDictionary } from './dom-translator';

export type LanguageCode = 'en' | 'hi';

export interface LanguageMeta {
  code: LanguageCode;
  label: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
];

const TRANSLATIONS: Record<LanguageCode, any> = {
  en: enTranslations,
  hi: hiTranslations,
};

interface I18nContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, fallback?: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>('en');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('billcraft_lang') as LanguageCode;
      if (saved && (saved === 'en' || saved === 'hi')) {
        setLanguageState(saved);
      }
    }
  }, []);

  // The English pages need no dictionary, so it only downloads for people who choose Hindi.
  useEffect(() => {
    document.documentElement.lang = language;
    if (language === 'en') return;
    let stop: (() => void) | undefined;
    let cancelled = false;
    import('./locales/hi-phrases.json').then(({ default: phrases }) => {
      if (!cancelled) stop = startDomTranslator(document.body, phrases as PhraseDictionary);
    });
    return () => {
      cancelled = true;
      stop?.();
    };
  }, [language]);

  const setLanguage = useCallback((lang: LanguageCode) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('billcraft_lang', lang);
    }
  }, []);

  const t = useCallback(
    (path: string, fallback?: string): string => {
      const keys = path.split('.');
      let current: any = TRANSLATIONS[language];

      for (const k of keys) {
        if (current && typeof current === 'object' && k in current) {
          current = current[k];
        } else {
          current = undefined;
          break;
        }
      }

      if (typeof current === 'string') {
        return current;
      }

      // Fallback to English
      let enFallback: any = TRANSLATIONS.en;
      for (const k of keys) {
        if (enFallback && typeof enFallback === 'object' && k in enFallback) {
          enFallback = enFallback[k];
        } else {
          enFallback = undefined;
          break;
        }
      }

      if (typeof enFallback === 'string') {
        return enFallback;
      }

      return fallback !== undefined ? fallback : path;
    },
    [language]
  );

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    // Graceful fallback outside provider
    return {
      language: 'en',
      setLanguage: () => {},
      t: (key: string, fallback?: string) => fallback || key,
    };
  }
  return context;
};
