import React, { createContext, useContext, useState, useCallback } from 'react';
import i18nService, { Language, Translations } from '../services/i18nService';

interface I18nContextType {
  language: Language;
  translations: Translations;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  languages: { code: Language; name: string }[];
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(i18nService.getLanguage());
  const [translations, setTranslations] = useState<Translations>(i18nService.getTranslations());

  const setLanguage = useCallback((lang: Language) => {
    i18nService.setLanguage(lang);
    setLanguageState(lang);
    setTranslations(i18nService.getTranslations());
    // Dispatch event for other listeners
    window.dispatchEvent(new CustomEvent('languageChange', { detail: { language: lang } }));
  }, []);

  const t = useCallback((key: string) => i18nService.t(key), []);

  const languages = i18nService.getAllLanguages();

  const value: I18nContextType = {
    language,
    translations,
    setLanguage,
    t,
    languages,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
};
