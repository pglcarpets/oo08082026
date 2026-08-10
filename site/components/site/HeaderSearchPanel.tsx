"use client";

import Link from "next/link";
import { MagnifyingGlass, Sparkle } from "@phosphor-icons/react";
import type { RefObject } from "react";

import {
  headerSearchBadgeClass,
  headerSearchKindClass,
  headerSearchMetaClass,
  headerSearchPanelClass,
  headerSearchShellClass,
  type NavSearchMode,
  type NavSearchResult,
} from "@/components/site/headerSearchTypes";

type HeaderSearchPanelProps = {
  searchPanelRef: RefObject<HTMLDivElement | null>;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  showSearchPanel: boolean;
  onShowSearchPanel: (open: boolean) => void;
  searchResults: NavSearchResult[];
  searchLoading: boolean;
  searchSource: NavSearchMode | null;
  searchSectionTitle: string;
  searchStatusAnnouncement: string;
  onSearchResultClick: () => void;
  onSubmitSearch: () => void;
  onMouseEnter: () => void;
};

export function HeaderSearchPanel({
  searchPanelRef,
  searchQuery,
  onSearchQueryChange,
  showSearchPanel,
  onShowSearchPanel,
  searchResults,
  searchLoading,
  searchSource,
  searchSectionTitle,
  searchStatusAnnouncement,
  onSearchResultClick,
  onSubmitSearch,
  onMouseEnter,
}: HeaderSearchPanelProps) {
  return (
    <div
      ref={searchPanelRef}
      className="site-header__search relative min-w-0"
      onMouseEnter={onMouseEnter}
    >
      <form
        className={headerSearchShellClass}
        role="search"
        aria-label="Site product search"
        suppressHydrationWarning
        toolname="searchProducts"
        tooldescription="Search the One&Only product catalog by keyword (chairs, workstations, tables, storage)."
        toolautosubmit
        onSubmit={(event) => {
          event.preventDefault();
          onSubmitSearch();
        }}
      >
        <label htmlFor="site-header-search" className="sr-only">
          Search products
        </label>
        <MagnifyingGlass size={16} weight="bold" className="text-muted" aria-hidden="true" />
        <input
          id="site-header-search"
          name="search"
          type="search"
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          onFocus={() => onShowSearchPanel(true)}
          placeholder="Search products..."
          className="min-w-0 flex-1 w-40 bg-transparent typ-body outline-none placeholder:text-subtle sm:w-48 lg:w-56 xl:w-64"
          autoComplete="off"
          aria-label="Search products"
          aria-describedby="site-header-search-status"
          aria-controls={showSearchPanel ? "site-header-search-panel" : undefined}
          toolparamdescription="Product search keywords, for example ergonomic chair or modular workstation."
        />
        <Sparkle size={16} weight="duotone" className="text-contrast-accent" aria-hidden="true" />
        <button type="submit" className="sr-only">
          Submit header search
        </button>
      </form>
      <p id="site-header-search-status" className="sr-only" role="status" aria-live="polite">
        {searchStatusAnnouncement}
      </p>

      {showSearchPanel ? (
        <div
          id="site-header-search-panel"
          className={`${headerSearchPanelClass} site-header-flyout animate-in fade-in slide-in-from-top-2 duration-300`}
        >
          <div className={headerSearchMetaClass}>
            <span>{searchSectionTitle}</span>
            {searchSource ? (
              <span className={headerSearchBadgeClass}>
                {searchSource === "ai"
                  ? "AI ranked"
                  : searchSource === "static-fallback"
                    ? "Static fallback"
                    : "Local search"}
              </span>
            ) : null}
          </div>
          {searchLoading ? (
            <p className="py-6 typ-body text-muted">Searching...</p>
          ) : searchResults.length > 0 ? (
            <ul className="space-y-1">
              {searchResults.map((result) => (
                <li key={result.id}>
                  <Link
                    href={result.href}
                    onClick={onSearchResultClick}
                    className="shell-list-link flex items-center justify-between rounded-xl px-3 py-2.5 typ-body"
                  >
                    <span>{result.title}</span>
                    <span className={headerSearchKindClass}>{result.type}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="space-y-1 py-2">
              <Link
                href="/products"
                onClick={onSearchResultClick}
                className="shell-list-link flex items-center justify-between rounded-xl px-3 py-2 typ-body"
              >
                All Products
              </Link>
              <Link
                href="/solutions"
                onClick={onSearchResultClick}
                className="shell-list-link flex items-center justify-between rounded-xl px-3 py-2 typ-body"
              >
                Solutions
              </Link>
              <Link
                href="/clients"
                onClick={onSearchResultClick}
                className="shell-list-link flex items-center justify-between rounded-xl px-3 py-2 typ-body"
              >
                Portfolio
              </Link>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
