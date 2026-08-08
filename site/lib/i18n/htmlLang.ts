import { defaultLocale, type Locale } from "@/i18n/config";

const HTML_LANG_BY_LOCALE: Record<Locale, string> = {
  en: "en-IN",
  hi: "hi-IN",
  fr: "fr-IN",
  de: "de-IN",
  es: "es-IN",
};

export function getHtmlLang(locale: string = defaultLocale): string {
  if (locale in HTML_LANG_BY_LOCALE) {
    return HTML_LANG_BY_LOCALE[locale as Locale];
  }
  return HTML_LANG_BY_LOCALE.en;
}
