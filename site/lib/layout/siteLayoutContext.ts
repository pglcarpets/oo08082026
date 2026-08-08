import { getLocale, getMessages } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { getHtmlLang } from "@/lib/i18n/htmlLang";

export async function getSiteLayoutContext() {
  const [messages, locale] = await Promise.all([getMessages(), getLocale()]);
  return { messages, locale: locale as Locale, lang: getHtmlLang(locale) };
}
