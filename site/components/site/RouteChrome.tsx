"use client";

import { SiteHeader } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/Footer";
import { FooterLogoMarquee } from "@/components/site/FooterLogoMarquee";
import { CookieConsentBar } from "@/components/site/CookieConsentBar";
import DynamicBotWrapper from "@/features/site/assistant/DynamicBotWrapper";
import { WhatsAppCTA } from "@/components/ui/WhatsAppCTA";
import { resolveRouteChromeMode } from "@/features/site/data/routeChromeRules";
import { usePathname, useSearchParams } from "next/navigation";

export function RouteChrome({
  position,
}: {
  position: "top" | "bottom";
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ?? "";
  const pathWithQuery = search ? `${pathname}?${search}` : pathname;
  const mode = resolveRouteChromeMode(pathWithQuery);

  if (position === "top") {
    if (mode.header === "hidden") {
      return null;
    }
    return <SiteHeader />;
  }

  if (mode.footer === "login-tools") {
    return (
      <>
        <DynamicBotWrapper />
        <WhatsAppCTA />
      </>
    );
  }

  if (mode.footer === "hidden") {
    return null;
  }

  return (
    <>
      <FooterLogoMarquee />
      <SiteFooter />
      <CookieConsentBar />
      <DynamicBotWrapper />
      <WhatsAppCTA />
    </>
  );
}
