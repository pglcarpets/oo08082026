export type NavSearchResult = {
  id: string;
  title: string;
  href: string;
  type: "product" | "category" | "page";
  source: "ai" | "local";
};

export type NavSearchMode = "ai" | "local" | "static-fallback";

export async function resolveSearchDestination(
  query: string,
  context: "header" | "mobile",
  currentResults: NavSearchResult[],
) {
  if (currentResults[0]?.href) {
    return currentResults[0].href;
  }

  if (query.length < 2) {
    return "/products";
  }

  try {
    const response = await fetch(
      `/api/nav-search/?q=${encodeURIComponent(query)}&limit=1&context=${context}`,
    );
    if (!response.ok) {
      return "/products";
    }
    const payload = (await response.json()) as { results?: NavSearchResult[] };
    return payload.results?.[0]?.href || "/products";
  } catch {
    return "/products";
  }
}

export const headerSearchShellClass = "shell-glass-panel shell-search-shell";
export const headerSearchPanelClass = "shell-glass-panel shell-search-panel";
export const headerSearchMetaClass = "shell-search-meta mb-2 flex items-center justify-between";
export const headerSearchBadgeClass = "shell-search-badge px-2 py-0.5";
export const headerSearchKindClass = "shell-search-kind";
