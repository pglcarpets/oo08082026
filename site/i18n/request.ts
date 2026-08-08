import {getRequestConfig} from 'next-intl/server';
import {cookies, headers} from 'next/headers';
import {defaultLocale, locales, type Locale} from './config';

/**
 * Message catalogs live under site/i18n/messages/{locale}.json.
 *
 * Until every locale file is present, keep a static import map that only
 * requires files that exist on disk (webpack cannot resolve missing globs).
 */
const messageLoaders: Record<Locale, () => Promise<{ default: Record<string, unknown> }>> = {
  en: () => import("./messages/en.json"),
  hi: () => import("./messages/hi.json"),
  fr: () => import("./messages/fr.json"),
  de: () => import("./messages/de.json"),
  es: () => import("./messages/es.json"),
};

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const nextLocale = cookieStore.get('NEXT_LOCALE')?.value;
  
  let locale: Locale = defaultLocale;
  
  if (nextLocale && (locales as readonly string[]).includes(nextLocale)) {
    locale = nextLocale as Locale;
  } else {
    const headersList = await headers();
    const acceptLanguage = headersList.get('accept-language');
    if (acceptLanguage) {
      const preferred = acceptLanguage.split(',')[0].split('-')[0];
      if ((locales as readonly string[]).includes(preferred)) {
        locale = preferred as Locale;
      }
    }
  }

  const messages = (await messageLoaders[locale]()).default;

  return {
    locale,
    messages
  };
});
