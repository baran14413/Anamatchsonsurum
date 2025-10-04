
'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'tr';

export interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Language>('en');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const storedLang = localStorage.getItem('language') as Language;
    if (storedLang && ['en', 'tr'].includes(storedLang)) {
      setLangState(storedLang);
    } else {
        const browserLang = navigator.language.split('-')[0];
        setLangState(browserLang === 'tr' ? 'tr' : 'en');
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      document.documentElement.lang = lang;
    }
  }, [lang, isMounted]);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    if(isMounted) {
        localStorage.setItem('language', newLang);
    }
  };

  const value = { lang, setLang };
  
  if (!isMounted) {
    return null; 
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
