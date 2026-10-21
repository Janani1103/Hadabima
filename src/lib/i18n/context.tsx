'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations, Translations, translate } from './index';

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  tr: (text: string, fallback?: string) => string;
}

const defaultTr = (text: string, fallback?: string) => fallback || text;

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: translations.en,
  tr: defaultTr,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('hadabima_lang') as Language;
    if (saved && (saved === 'en' || saved === 'si' || saved === 'ta')) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('hadabima_lang', lang);
  };

  const tr = (text: string, fallback?: string): string => {
    if (!text) return fallback || '';
    if (language === 'en') return text;
    const res = translate(text, language);
    return res !== text ? res : (fallback || text);
  };

  const activeT = translations[language] || translations.en;
  // Also attach tr method directly on t for convenience
  (activeT as any).tr = tr;

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t: activeT,
        tr,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
