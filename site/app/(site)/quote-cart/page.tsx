"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Minus, Plus, Trash as Trash2 } from "@phosphor-icons/react";
import { HomeMarketingLayout, HomeSection, HomeSectionInner } from "@/components/home/layout";
import { MarketingCtaLink } from "@/components/ui/MarketingCtaLink";
import { useQuoteCart } from "@/lib/store/quoteCart";
import { QUOTE_CART_ROUTE_COPY } from "@/features/site/data/routeCopy";
import { normalizeAssetPath, PRODUCT_IMAGE_FALLBACK } from "@/lib/assetPaths";
import {
  gsapReducedMotion,
  GSAP_EASE_OUT,
  GSAP_REVEAL,
  registerGsapPlugins,
} from "@/lib/helpers/gsapMotion";

registerGsapPlugins();

function getCompareHref(items: Array<{ href?: string }>) {
  const keys = items
    .map((item) => {
      if (!item.href) {return "";}
      try {
        const url = new URL(item.href, "https://oando.local");
        const parts = url.pathname.split("/").filter(Boolean);
        return parts[parts.length - 1] || "";
      } catch {
        return "";
      }
    })
    .filter(Boolean);

  const uniqueKeys = Array.from(new Set(keys)).slice(0, 4);
  return uniqueKeys.length >= 2
    ? `/compare?items=${encodeURIComponent(uniqueKeys.join(","))}`
    : null;
}

export default function QuoteCartPage() {
  const headerRef = useRef<HTMLElement>(null);
  const [motionReady, setMotionReady] = useState(false);
  const items = useQuoteCart((state) => state.items);
  const totalQty = useQuoteCart((state) => state.totalQty);
  const setQty = useQuoteCart((state) => state.setQty);
  const removeItem = useQuoteCart((state) => state.removeItem);
  const clearCart = useQuoteCart((state) => state.clearCart);
  const compareHref = useMemo(() => getCompareHref(items), [items]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setMotionReady(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useGSAP(
    () => {
      if (!motionReady || gsapReducedMotion() || !headerRef.current) {
        return;
      }

      const revealTargets = headerRef.current.querySelectorAll("[data-quote-cart-reveal]");
      if (!revealTargets.length) {
        return;
      }

      const ctx = gsap.context(() => {
        gsap.from(revealTargets, {
          y: GSAP_REVEAL.y,
          opacity: GSAP_REVEAL.opacity,
          duration: GSAP_REVEAL.duration,
          stagger: GSAP_REVEAL.stagger,
          ease: GSAP_EASE_OUT,
        });
      }, headerRef);

      return () => ctx.revert();
    },
    { scope: headerRef, dependencies: [motionReady] },
  );

  return (
    <HomeMarketingLayout>
      <div className="quote-cart-page">
        <header
          ref={headerRef}
          className="quote-cart-header"
          aria-labelledby="quote-cart-heading"
        >
          <div className="home-shell-xl quote-cart-header__inner">
            <div>
              <p data-quote-cart-reveal className="typ-overline text-muted">
                {QUOTE_CART_ROUTE_COPY.kicker}
              </p>
              <h1
                id="quote-cart-heading"
                data-quote-cart-reveal
                className="home-heading quote-cart-header__title"
              >
                {QUOTE_CART_ROUTE_COPY.title}
              </h1>
              <p data-quote-cart-reveal className="page-copy quote-cart-header__copy text-muted">
                {QUOTE_CART_ROUTE_COPY.description}
              </p>
            </div>
            <div data-quote-cart-reveal className="quote-cart-header__actions">
              <MarketingCtaLink
                href="/products"
                label={QUOTE_CART_ROUTE_COPY.browseCta}
                surface="quote-cart-header"
                variant="outline"
              >
                {QUOTE_CART_ROUTE_COPY.browseCta}
              </MarketingCtaLink>
              {compareHref ? (
                <MarketingCtaLink
                  href={compareHref}
                  label={QUOTE_CART_ROUTE_COPY.compareCta}
                  surface="quote-cart-header"
                  variant="outline"
                >
                  {QUOTE_CART_ROUTE_COPY.compareCta}
                </MarketingCtaLink>
              ) : null}
              <MarketingCtaLink
                href="/downloads"
                label={QUOTE_CART_ROUTE_COPY.resourceDeskCta}
                surface="quote-cart-header"
                variant="outline"
              >
                {QUOTE_CART_ROUTE_COPY.resourceDeskCta}
              </MarketingCtaLink>
              {items.length > 0 ? (
                <button type="button" onClick={clearCart} className="btn-outline">
                  {QUOTE_CART_ROUTE_COPY.clearCta}
                </button>
              ) : null}
            </div>
          </div>
        </header>

        <div className="quote-cart-bronze-rule" aria-hidden="true">
          <div className="home-shell-xl" />
        </div>

        <HomeSection variant="soft" spacing="md" className="pb-14 border-t-0">
          <HomeSectionInner>
            {items.length === 0 ? (
              <div className="quote-cart-empty">
                <p className="typ-lead text-strong">{QUOTE_CART_ROUTE_COPY.emptyTitle}</p>
                <p className="page-copy-sm mx-auto mt-3 max-w-2xl text-muted">
                  {QUOTE_CART_ROUTE_COPY.emptyDescription}
                </p>
                <div className="quote-cart-empty__actions">
                  <MarketingCtaLink
                    href="/products"
                    label={QUOTE_CART_ROUTE_COPY.emptyPrimaryCta}
                    surface="quote-cart-empty"
                    variant="primary"
                  >
                    {QUOTE_CART_ROUTE_COPY.emptyPrimaryCta}
                  </MarketingCtaLink>
                  <MarketingCtaLink
                    href="/downloads"
                    label={QUOTE_CART_ROUTE_COPY.emptySecondaryCta}
                    surface="quote-cart-empty"
                    variant="outline"
                  >
                    {QUOTE_CART_ROUTE_COPY.emptySecondaryCta}
                  </MarketingCtaLink>
                </div>
              </div>
            ) : (
              <div className="quote-cart-layout">
                <div className="quote-cart-list">
                  {items.map((item) => (
                    <article key={item.id} className="quote-cart-item">
                      <div className="quote-cart-item__thumb">
                        <Image
                          src={normalizeAssetPath(item.image) || PRODUCT_IMAGE_FALLBACK}
                          alt={item.name}
                          fill
                          className="object-contain p-2"
                        />
                      </div>
                      <div>
                        <Link
                          href={item.href || "/products"}
                          className="typ-cta text-strong hover:text-primary"
                        >
                          {item.name}
                        </Link>
                        <div className="quote-cart-item__controls">
                          <div className="quote-cart-qty">
                            <button
                              type="button"
                              onClick={() => setQty(item.id, item.qty - 1)}
                              className="quote-cart-qty__btn"
                              aria-label={`Decrease quantity for ${item.name}`}
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="quote-cart-qty__value typ-cta">{item.qty}</span>
                            <button
                              type="button"
                              onClick={() => setQty(item.id, item.qty + 1)}
                              className="quote-cart-qty__btn"
                              aria-label={`Increase quantity for ${item.name}`}
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="typ-chip text-muted inline-flex items-center gap-1 hover:text-danger"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {QUOTE_CART_ROUTE_COPY.removeCta}
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                <aside className="quote-cart-summary h-fit">
                  <p className="typ-overline text-muted">{QUOTE_CART_ROUTE_COPY.summaryTitle}</p>
                  <p className="page-copy-sm mt-3 text-muted">
                    {QUOTE_CART_ROUTE_COPY.summaryDescription}
                  </p>
                  <p className="typ-body-sm quote-cart-summary__metric text-body">
                    {QUOTE_CART_ROUTE_COPY.summaryQuantityLabel}: <strong>{totalQty}</strong>
                  </p>
                  <p className="typ-body-sm quote-cart-summary__metric text-body">
                    {QUOTE_CART_ROUTE_COPY.summaryProductsLabel}: <strong>{items.length}</strong>
                  </p>
                  {compareHref ? (
                    <div className="quote-cart-summary__panel">
                      <p className="typ-body-sm text-strong">
                        {QUOTE_CART_ROUTE_COPY.summaryCompareHint}
                      </p>
                      <Link href={compareHref} className="typ-nav mt-3 inline-flex text-primary">
                        {QUOTE_CART_ROUTE_COPY.compareCta}
                      </Link>
                    </div>
                  ) : null}
                  <div className="quote-cart-summary__panel">
                    <p className="typ-body-sm text-strong">
                      {QUOTE_CART_ROUTE_COPY.summaryDeskHint}
                    </p>
                    <div className="quote-cart-summary__actions">
                      <MarketingCtaLink
                        href="/planning"
                        label={QUOTE_CART_ROUTE_COPY.planningCta}
                        surface="quote-cart-summary"
                        variant="outline"
                        className="justify-center"
                      >
                        {QUOTE_CART_ROUTE_COPY.planningCta}
                      </MarketingCtaLink>
                      <MarketingCtaLink
                        href="/downloads"
                        label={QUOTE_CART_ROUTE_COPY.resourceDeskCta}
                        surface="quote-cart-summary"
                        variant="outline"
                        className="justify-center"
                      >
                        {QUOTE_CART_ROUTE_COPY.resourceDeskCta}
                      </MarketingCtaLink>
                    </div>
                  </div>
                  <MarketingCtaLink
                    href="/contact?intent=quote&source=quote-cart"
                    label={QUOTE_CART_ROUTE_COPY.primaryCta}
                    surface="quote-cart-summary"
                    variant="primary"
                    className="typ-chip mt-5 w-full justify-center px-5 py-2.5"
                  >
                    {QUOTE_CART_ROUTE_COPY.primaryCta}
                  </MarketingCtaLink>
                </aside>
              </div>
            )}
          </HomeSectionInner>
        </HomeSection>
      </div>
    </HomeMarketingLayout>
  );
}
