import type { Metadata } from "next";
import { ciscoSans, helveticaNeue } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "One&Only",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
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
