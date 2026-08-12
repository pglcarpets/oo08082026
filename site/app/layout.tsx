import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { ciscoSans, helveticaNeue } from "@/lib/fonts";
import { getHtmlLang } from "@/lib/i18n/htmlLang";
import { defaultLocale } from "@/i18n/config";

export const metadata: Metadata = {
  title: "One&Only",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Resolve the active locale from next-intl (defaults to en outside the
  // localized (site) tree) so <html lang> reflects the rendered language
  // (TST-S23 / AUDIT-I18N-01). Admin/Planner/Studio fall back to en.
  let locale: string = defaultLocale;
  try {
    locale = await getLocale();
  } catch {
    // next-intl request context absent (e.g. non-localized routes) — keep default.
  }

  return (
    <html
      lang={getHtmlLang(locale)}
      className={`${ciscoSans.variable} ${helveticaNeue.variable} scroll-smooth`}
      suppressHydrationWarning
    >
      <body
        /* helveticaNeue.className applies the body face directly; CSS vars still
           drive --font-sans / --font-display for utilities + marketing type. */
        className={`${helveticaNeue.className} scheme-page antialiased selection:bg-primary selection:text-inverse`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
