import { en, fr, es, sw, pt, am } from '../locales/translations';

export type Language = 'en' | 'fr' | 'es' | 'sw' | 'pt' | 'am';

export interface Translations {
  chat: {
    title: string;
    description: string;
    placeholder: string;
    placeholderFull: string;
    send: string;
    listen: string;
    stop: string;
    speaking: string;
    listeningTip: string;
    noMessages: string;
    startConversation: string;
    hello: string;
    welcome: string;
    reportHelp: string;
    evidenceHelp: string;
    caseStatus: string;
    security: string;
    default: string;
    stats: {
      totalMessages: string;
      yourMessages: string;
      botResponses: string;
      averageRating: string;
    };
    toolbar: {
      conversation: string;
      search: string;
      export: string;
      delete: string;
    };
    actions: {
      rate: string;
      speak: string;
      search: string;
      export: string;
      delete: string;
      exportSuccess: string;
    };
  };
  navbar: {
    home: string;
    livestreams: string;
    report: string;
    explore: string;
    workspace: string;
    help: string;
    admin: string;
    assistant: string;
  };
  common: {
    loading: string;
    error: string;
    success: string;
    cancel: string;
    delete: string;
    confirm: string;
    close: string;
    language: string;
  };
}

export const LANGUAGES: { [key in Language]: string } = {
  en: 'English',
  fr: 'Français',
  es: 'Español',
  sw: 'Kiswahili',
  pt: 'Português',
  am: 'አማርኛ',
};

export const TRANSLATIONS: { [key in Language]: Translations } = {
  en,
  fr,
  es,
  sw,
  pt,
  am,
};

export class I18nService {
  private currentLanguage: Language;

  constructor() {
    const hasWindow = typeof window !== 'undefined';
    const safeStorage = hasWindow ? window.localStorage : null;
    const stored = safeStorage?.getItem('language') as Language | null;
    const browserLang = typeof navigator !== 'undefined'
      ? (navigator.language.split('-')[0].toLowerCase() as Language)
      : 'en';
    this.currentLanguage = stored || (TRANSLATIONS[browserLang] ? browserLang : 'en');
    this.setLanguage(this.currentLanguage);
  }

  setLanguage(lang: Language) {
    this.currentLanguage = lang;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('language', lang);
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  }

  getLanguage(): Language {
    return this.currentLanguage;
  }

  t(key: string): string {
    const keys = key.split('.');
    let value: unknown = TRANSLATIONS[this.currentLanguage];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in (value as Record<string, unknown>)) {
        value = (value as Record<string, unknown>)[k];
      } else {
        value = undefined;
        break;
      }
    }

    return typeof value === 'string' ? value : key;
  }

  getTranslations(): Translations {
    return TRANSLATIONS[this.currentLanguage];
  }

  getAllLanguages(): { code: Language; name: string }[] {
    return Object.entries(LANGUAGES).map(([code, name]) => ({
      code: code as Language,
      name,
    }));
  }
}

export default new I18nService();
