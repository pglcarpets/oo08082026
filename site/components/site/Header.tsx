"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CaretDown, List, X } from "@phosphor-icons/react";
import { OneAndOnlyLogo } from "@/components/ui/Logo";
import { PlannerLaunchLink } from "@/components/ui/PlannerLaunchLink";
import { TrackedLink } from "@/components/ui/TrackedLink";
import {
  NAV_CATEGORY_GROUP_ORDER,
  NAV_CATEGORY_GROUPS,
  groupCategories,
  type GroupedCategory,
} from "@/lib/navigation";
import { SITE_HEADER_MORE_LINKS, SITE_HEADER_PRIMARY_LINKS, SITE_AUTH_LINK } from "@/features/site/data/navigation";
import { MobileNavDrawer } from "@/components/site/MobileNavDrawer";
import { LanguageSwitcher } from "@/components/site/LanguageSwitcher";
import {
  buildMegaMenuGroups,
  buildMegaMenuOthers,
  HeaderProductsMegaMenu,
} from "@/components/site/HeaderProductsMegaMenu";
import { HeaderSearchPanel } from "@/components/site/HeaderSearchPanel";
import {
  resolveSearchDestination,
  type NavSearchMode,
  type NavSearchResult,
} from "@/components/site/headerSearchTypes";
import { isPlannerEntryHref } from "@/lib/analytics/plannerEntry";
import { trackSiteSearchSubmitted } from "@/lib/analytics/siteEvents";
import { cn } from "@/lib/utils";

/** Frozen at module load so SSR and client hydration always see the same nav order. */
const HEADER_PRIMARY_LINKS = [...SITE_HEADER_PRIMARY_LINKS];
const HEADER_MORE_LINKS = [...SITE_HEADER_MORE_LINKS];

interface NavCategoriesPayload {
  groups?: GroupedCategory[];
  categories?: Array<{ id: string; name: string; count?: number }>;
}

/** Shared in-flight/resolved fetch — Strict Mode remounts must not double-hit the catalog API. */
let navCategoriesPromise: Promise<NavCategoriesPayload> | null = null;

function loadNavCategories(): Promise<NavCategoriesPayload> {
  if (!navCategoriesPromise) {
    navCategoriesPromise = fetch("/api/nav-categories/")
      .then((res) => res.json() as Promise<NavCategoriesPayload>)
      .catch(() => {
        navCategoriesPromise = null;
        return {} as NavCategoriesPayload;
      });
  }
  return navCategoriesPromise;
}

/** Test-only: clear module cache between Header unit cases. */
export function __resetNavCategoriesLoadForTests(): void {
  navCategoriesPromise = null;
}

function prettify(id: string): string {
  return id
    .split("-")
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

const FALLBACK_CATEGORY_GROUPS: GroupedCategory[] = NAV_CATEGORY_GROUP_ORDER.map((groupId) => ({
  groupId,
  groupLabel: NAV_CATEGORY_GROUPS[groupId].label,
  items: NAV_CATEGORY_GROUPS[groupId].ids.map((id) => ({
    id,
    name: prettify(id),
    count: undefined,
    href: `/products/${id}`,
  })),
}));

const siteHeaderBaseClass =
  "fixed top-0 left-0 z-50 w-full border-b border-soft transition-shadow [background-color:var(--surface-glass-strong)] [transition-duration:var(--motion-fast)] [transition-timing-function:var(--ease-standard)]";
const siteHeaderScrolledClass = "[box-shadow:var(--shadow-panel)]";

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeMega, setActiveMega] = useState<string | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [groupedCategories, setGroupedCategories] = useState<GroupedCategory[]>(
    FALLBACK_CATEGORY_GROUPS,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NavSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchSource, setSearchSource] = useState<NavSearchMode | null>(null);
  const [showSearchPanel, setShowSearchPanel] = useState(false);

  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const searchPanelRef = useRef<HTMLDivElement>(null);
  const megaCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearMegaCloseTimer = () => {
    if (megaCloseTimerRef.current) {
      clearTimeout(megaCloseTimerRef.current);
      megaCloseTimerRef.current = null;
    }
  };

  const closeMegaMenu = () => {
    clearMegaCloseTimer();
    setActiveMega(null);
    setMoreOpen(false);
  };

  const openMegaMenu = (label: string) => {
    clearMegaCloseTimer();
    setMoreOpen(false);
    setActiveMega(label);
  };

  const openMoreMenu = () => {
    clearMegaCloseTimer();
    setActiveMega(null);
    setMoreOpen(true);
  };

  const scheduleMegaClose = () => {
    clearMegaCloseTimer();
    megaCloseTimerRef.current = setTimeout(() => {
      setActiveMega(null);
      setMoreOpen(false);
      megaCloseTimerRef.current = null;
    }, 320);
  };

  const isMegaPointerTarget = (target: EventTarget | null) => {
    if (!(target instanceof Element)) {return false;}
    return (
      target.closest("[data-mega-zone]") !== null ||
      target.closest("#products-mega-menu") !== null ||
      target.closest("#header-more-menu") !== null
    );
  };

  // Fetch real product categories for mega menu
  useEffect(() => {
    let cancelled = false;
    loadNavCategories().then((payload) => {
      if (cancelled) {
        return;
      }
      if (Array.isArray(payload.groups) && payload.groups.length > 0) {
        setGroupedCategories(payload.groups);
        return;
      }
      if (Array.isArray(payload.categories) && payload.categories.length > 0) {
        setGroupedCategories(groupCategories(payload.categories));
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Scroll shadow — do not close mega menu on scroll (users need time to reach the panel)
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 16);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => () => clearMegaCloseTimer(), []);

  // Close mobile drawer once desktop primary nav is visible (xl = 80rem / 1280px)
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1280) {setMobileOpen(false);}
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Esc closes mega / more / search panels
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveMega(null);
        setMoreOpen(false);
        setShowSearchPanel(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!searchPanelRef.current) {return;}
      if (!searchPanelRef.current.contains(event.target as Node)) {
        setShowSearchPanel(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  useEffect(() => {
    function resetState() {
      setShowSearchPanel(false);
      setActiveMega(null);
      setMoreOpen(false);
    }
    resetState();
  }, [pathname]);

  useEffect(() => {
    const query = searchQuery.trim();

    function clearSearch() {
      setSearchResults([]);
      setSearchSource(null);
      setSearchLoading(false);
    }

    if (query.length < 2) {
      clearSearch();
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const response = await fetch("/api/nav-search/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, limit: 8, context: "header" }),
          signal: controller.signal,
        });
        const payload = (await response.json()) as {
          results?: NavSearchResult[];
          fallbackUsed?: boolean;
          rankingMode?: NavSearchMode;
        };

        if (!response.ok) {
          setSearchResults([]);
          setSearchSource(null);
          return;
        }

        const results = Array.isArray(payload.results) ? payload.results : [];
        setSearchResults(results);
        setSearchSource(payload.rankingMode || null);
      } catch {
        setSearchResults([]);
        setSearchSource(null);
      } finally {
        setSearchLoading(false);
      }
    }, 260);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const searchSectionTitle = !searchQuery.trim()
    ? "Quick links"
    : searchLoading
      ? "Searching"
      : searchResults.length > 0
        ? "Results"
        : "No results";

  const searchStatusAnnouncement = !searchQuery.trim()
    ? "Search products. Type at least two characters."
    : searchLoading
      ? "Searching products."
      : searchResults.length > 0
        ? `${searchResults.length} search result${searchResults.length === 1 ? "" : "s"} available.`
        : "No search results.";

  const onSearchResultClick = () => {
    setShowSearchPanel(false);
    setSearchQuery("");
  };

  const submitSearch = async () => {
    const query = searchQuery.trim();
    const destination = await resolveSearchDestination(query, "header", searchResults);
    trackSiteSearchSubmitted({
      pathname: pathname || "",
      surface: "header",
      queryLength: query.length,
      destination,
    });
    router.push(destination);
    setShowSearchPanel(false);
    setSearchQuery("");
  };

  const megaMenuGroups = useMemo(
    () => buildMegaMenuGroups(groupedCategories),
    [groupedCategories],
  );

  const megaMenuOthers = useMemo(
    () => buildMegaMenuOthers(groupedCategories),
    [groupedCategories],
  );

  return (
    <>
      <header className={cn(siteHeaderBaseClass, scrolled ? siteHeaderScrolledClass : "shadow-none")} suppressHydrationWarning>
        {/* home-shell-xl: same max + gutters as marketing body/footer (not shell-container-wide). */}
        <div className="home-shell-xl min-w-0" suppressHydrationWarning>
          <div className="flex h-16 min-w-0 items-center justify-between gap-2 sm:gap-3">

            {/* Logo */}
            <Link
              href="/"
              aria-label="One&Only - home"
              className="inline-flex h-full min-w-0 shrink-0 items-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <OneAndOnlyLogo className="h-7.5 max-w-[9.5rem] md:h-8.5 md:max-w-none xl:h-9" variant="orange" />
            </Link>

            {/* Center nav — desktop only */}
            <nav
              className="site-header__desktop-nav"
              aria-label="Primary navigation"
              suppressHydrationWarning
            >
              {HEADER_PRIMARY_LINKS.map((link) => {
                const isActive = pathname === link.href || pathname.startsWith(`${link.href  }/`);
                const hasMega = "hasMega" in link && link.hasMega;

                if (hasMega) {
                  return (
                    <div
                      key={link.label}
                      data-mega-zone
                      className="relative flex h-full items-stretch"
                      onMouseEnter={() => openMegaMenu(link.label)}
                      onMouseLeave={(event) => {
                        if (isMegaPointerTarget(event.relatedTarget)) {return;}
                        scheduleMegaClose();
                      }}
                    >
                      <button
                        type="button"
                        data-mega-trigger
                        aria-expanded={activeMega === link.label}
                        aria-controls="products-mega-menu"
                        aria-haspopup="true"
                        onFocus={() => openMegaMenu(link.label)}
                        onClick={() => {
                          setActiveMega((prev) => (prev === link.label ? null : link.label));
                        }}
                        className={cn(
                          "typ-nav shell-nav-link shell-nav-link--desktop relative inline-flex items-center gap-1 whitespace-nowrap px-1.5 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary 2xl:px-2.5",
                          isActive
                            ? "shell-nav-link-current"
                            : activeMega === link.label
                              ? "text-primary"
                              : "",
                        )}
                      >
                        {link.label}
                        <CaretDown
                          size={16}
                          weight="bold"
                          aria-hidden="true"
                          className={cn(
                            "transition-transform duration-300 ease-out",
                            activeMega === link.label && "rotate-180",
                          )}
                        />
                      </button>
                    </div>
                  );
                }

                const navClassName = cn(
                  "typ-nav shell-nav-link shell-nav-link--desktop relative whitespace-nowrap px-1.5 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary 2xl:px-2.5",
                  isActive ? "shell-nav-link-current" : "",
                );

                if (isPlannerEntryHref(link.href)) {
                  return (
                    <PlannerLaunchLink
                      key={link.label}
                      href={link.href}
                      surface="header-nav"
                      label={link.label}
                      onMouseEnter={closeMegaMenu}
                      className={navClassName}
                    >
                      {link.label}
                    </PlannerLaunchLink>
                  );
                }

                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    onMouseEnter={closeMegaMenu}
                    className={navClassName}
                  >
                    {link.label}
                  </Link>
                );
              })}

              {HEADER_MORE_LINKS.length > 0 ? (
                <div
                  data-mega-zone
                  className="relative flex h-full items-stretch"
                  onMouseEnter={openMoreMenu}
                  onMouseLeave={(event) => {
                    if (isMegaPointerTarget(event.relatedTarget)) {return;}
                    scheduleMegaClose();
                  }}
                >
                  <button
                    type="button"
                    data-mega-trigger
                    aria-expanded={moreOpen}
                    aria-controls="header-more-menu"
                    aria-haspopup="menu"
                    onFocus={openMoreMenu}
                    className={cn(
                      "typ-nav shell-nav-link shell-nav-link--desktop relative inline-flex items-center gap-1 whitespace-nowrap px-1.5 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary 2xl:px-2.5",
                      moreOpen ||
                        HEADER_MORE_LINKS.some(
                          (link) =>
                            pathname === link.href || pathname.startsWith(`${link.href}/`),
                        )
                        ? "shell-nav-link-current"
                        : "",
                    )}
                  >
                    More
                    <CaretDown
                      size={16}
                      weight="bold"
                      aria-hidden="true"
                      className={cn(
                        "transition-transform duration-300 ease-out",
                        moreOpen && "rotate-180",
                      )}
                    />
                  </button>

                  {moreOpen ? (
                    <div
                      id="header-more-menu"
                      role="menu"
                      tabIndex={0}
                      aria-label="More site pages"
                      className="absolute left-0 top-full z-50 mt-0 min-w-[12rem] rounded-b-xl border border-soft bg-panel py-2 shadow-theme-soft animate-in fade-in slide-in-from-top-1 duration-200"
                      onMouseEnter={openMoreMenu}
                      onMouseLeave={(event) => {
                        if (isMegaPointerTarget(event.relatedTarget)) {return;}
                        scheduleMegaClose();
                      }}
                    >
                      {HEADER_MORE_LINKS.map((link) => {
                        const isActive =
                          pathname === link.href || pathname.startsWith(`${link.href}/`);
                        return (
                          <Link
                            key={link.label}
                            href={link.href}
                            role="menuitem"
                            onClick={() => setMoreOpen(false)}
                            className={cn(
                              "shell-list-link block whitespace-nowrap px-4 py-2.5 typ-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                              isActive ? "shell-nav-link-current text-primary" : "text-strong",
                            )}
                          >
                            {link.label}
                          </Link>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </nav>

            {/* Right CTAs */}
            <div className="flex h-full min-w-0 shrink-0 items-center gap-1 sm:gap-1.5">
              <HeaderSearchPanel
                searchPanelRef={searchPanelRef}
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
                showSearchPanel={showSearchPanel}
                onShowSearchPanel={setShowSearchPanel}
                searchResults={searchResults}
                searchLoading={searchLoading}
                searchSource={searchSource}
                searchSectionTitle={searchSectionTitle}
                searchStatusAnnouncement={searchStatusAnnouncement}
                onSearchResultClick={onSearchResultClick}
                onSubmitSearch={() => {
                  void submitSearch();
                }}
                onMouseEnter={closeMegaMenu}
              />

              {/* Site-wide i18n: en · hi · fr · de · es (NEXT_LOCALE cookie) */}
              <div className="site-header__utilities hidden min-w-0 items-center gap-2 lg:flex">
                <TrackedLink
                  href={SITE_AUTH_LINK.href}
                  label={SITE_AUTH_LINK.label}
                  surface="header-nav"
                  className="typ-nav shell-nav-link shell-nav-link--desktop whitespace-nowrap px-2 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {SITE_AUTH_LINK.label}
                </TrackedLink>
              </div>
              <LanguageSwitcher variant="header" className="hidden min-w-0 lg:block" />

              {/* Hamburger — mobile only; toggles clear open/close affordance */}
              <button
                ref={hamburgerRef}
                type="button"
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
                aria-controls="mobile-nav-drawer"
                aria-haspopup="dialog"
                onMouseDown={(event) => {
                  if (!mobileOpen) {
                    event.preventDefault();
                  }
                }}
                onClick={() => {
                  if (mobileOpen) {
                    setMobileOpen(false);
                    return;
                  }
                  flushSync(() => {
                    setMobileOpen(true);
                  });
                }}
                className="site-header__hamburger shell-icon-button h-11 w-11 min-h-11 min-w-11 shrink-0 items-center justify-center touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary xl:hidden"
              >
                {mobileOpen ? (
                  <X size={20} weight="bold" aria-hidden="true" />
                ) : (
                  <List size={20} weight="bold" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        <HeaderProductsMegaMenu
          open={activeMega === "Products"}
          megaMenuGroups={megaMenuGroups}
          megaMenuOthers={megaMenuOthers}
          onOpen={() => openMegaMenu("Products")}
          onScheduleClose={scheduleMegaClose}
          onClose={() => setActiveMega(null)}
          isMegaPointerTarget={isMegaPointerTarget}
        />
      </header>

      {/* Mobile drawer — rendered outside header to avoid z-index conflicts */}
      <MobileNavDrawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        closeButtonRef={hamburgerRef}
        groupedCategories={groupedCategories}
      />
    </>
  );
}
