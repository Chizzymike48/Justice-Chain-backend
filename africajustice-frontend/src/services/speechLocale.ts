const LOCALE_BY_LANGUAGE: Record<string, string> = {
  en: 'en-US',
  fr: 'fr-FR',
  es: 'es-ES',
  sw: 'sw-KE',
  pt: 'pt-PT',
  am: 'am-ET',
  ha: 'ha-NG',
  yo: 'yo-NG',
  ig: 'ig-NG',
  pidgin: 'en-NG',
};

export const resolveSpeechLocale = (language: string): string => {
  const normalized = language?.trim().toLowerCase();
  if (!normalized) {
    return LOCALE_BY_LANGUAGE.en;
  }
  if (normalized.includes('-')) {
    return normalized;
  }
  return LOCALE_BY_LANGUAGE[normalized] || LOCALE_BY_LANGUAGE.en;
};

export default resolveSpeechLocale;
