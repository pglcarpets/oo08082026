"use client";

import Link from "next/link";
import type { GroupedCategory } from "@/lib/navigation";
import { cn } from "@/lib/utils";

const OTHERS_SUBCATEGORY_NAMES = new Set(["Cafe chairs", "Cafe Tables"]);
const OTHERS_SUBCATEGORY_ORDER = ["Cafe Tables", "Cafe chairs"] as const;

function megaMenuParentMatchesGroup(itemName: string, groupLabel: string) {
  return itemName.trim().toLowerCase() === groupLabel.trim().toLowerCase();
}

export function buildMegaMenuGroups(groupedCategories: GroupedCategory[]) {
  return groupedCategories.map((group) => ({
    ...group,
    items: group.items.map((item) => ({
      ...item,
      subcategories: Array.isArray(item.subcategories)
        ? item.subcategories.filter(
            (subcategory) => !OTHERS_SUBCATEGORY_NAMES.has(subcategory.name),
          )
        : [],
    })),
  }));
}

export function buildMegaMenuOthers(groupedCategories: GroupedCategory[]) {
  const extracted = new Map<
    string,
    { id: string; name: string; href: string; count?: number }
  >();

  for (const group of groupedCategories) {
    for (const item of group.items) {
      if (!Array.isArray(item.subcategories)) {
        continue;
      }
      for (const subcategory of item.subcategories) {
        if (!OTHERS_SUBCATEGORY_NAMES.has(subcategory.name)) {
          continue;
        }
        extracted.set(subcategory.name, {
          id: subcategory.id,
          name: subcategory.name,
          href: subcategory.href,
          count: subcategory.count,
        });
      }
    }
  }

  const values = Array.from(extracted.values());
  values.sort((a, b) => {
    const aIndex = OTHERS_SUBCATEGORY_ORDER.indexOf(
      a.name as (typeof OTHERS_SUBCATEGORY_ORDER)[number],
    );
    const bIndex = OTHERS_SUBCATEGORY_ORDER.indexOf(
      b.name as (typeof OTHERS_SUBCATEGORY_ORDER)[number],
    );
    const ai = aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex;
    const bi = bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex;
    return ai - bi;
  });

  return values;
}

type HeaderProductsMegaMenuProps = {
  open: boolean;
  megaMenuGroups: ReturnType<typeof buildMegaMenuGroups>;
  megaMenuOthers: ReturnType<typeof buildMegaMenuOthers>;
  onOpen: () => void;
  onScheduleClose: () => void;
  onClose: () => void;
  isMegaPointerTarget: (target: EventTarget | null) => boolean;
};

export function HeaderProductsMegaMenu({
  open,
  megaMenuGroups,
  megaMenuOthers,
  onOpen,
  onScheduleClose,
  onClose,
  isMegaPointerTarget,
}: HeaderProductsMegaMenuProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      id="products-mega-menu"
      onMouseEnter={onOpen}
      onMouseLeave={(event) => {
        if (isMegaPointerTarget(event.relatedTarget)) {
          return;
        }
        onScheduleClose();
      }}
      className="mega-menu-panel site-header-flyout hidden lg:block border-t border-soft bg-panel shadow-theme-soft animate-in fade-in slide-in-from-top-2 duration-300"
    >
      <div className="home-shell-xl py-5">
        <div
          className={cn(
            "grid gap-x-3 gap-y-4",
            megaMenuOthers.length > 0 ? "grid-cols-7" : "grid-cols-6",
          )}
        >
          {megaMenuGroups.map((group) => {
            const primaryItem = group.items[0];
            const hideParentRow = primaryItem
              ? megaMenuParentMatchesGroup(primaryItem.name, group.groupLabel)
              : false;

            return (
              <div key={group.groupId} className="min-w-0">
                <Link
                  href={primaryItem?.href || `/products/${group.groupId}`}
                  onClick={onClose}
                  className="typ-overline mb-2 inline-flex text-strong transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {group.groupLabel}
                </Link>
                <ul className="space-y-1">
                  {group.items.map((item) => (
                    <li key={item.id}>
                      {!megaMenuParentMatchesGroup(item.name, group.groupLabel) ? (
                        <Link
                          href={item.href}
                          onClick={onClose}
                          className="shell-list-link shell-list-link--mega block rounded-lg px-1.5 py-1 text-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          {item.name}
                        </Link>
                      ) : null}

                      {Array.isArray(item.subcategories) && item.subcategories.length > 0 ? (
                        <ul className={cn("space-y-0.5", hideParentRow ? "" : "mt-1")}>
                          {item.subcategories.map((subcategory) => (
                            <li key={`${item.id}-${subcategory.id}`}>
                              <Link
                                href={subcategory.href}
                                onClick={onClose}
                                className="shell-list-link shell-list-link--mega-sub block rounded-md px-1.5 py-0.5 text-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                              >
                                {subcategory.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}

          {megaMenuOthers.length > 0 ? (
            <div className="min-w-0">
              <Link
                href="/products"
                onClick={onClose}
                className="typ-overline inline-flex mb-2 text-strong transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Others
              </Link>
              <ul className="space-y-1">
                {megaMenuOthers.map((subcategory) => (
                  <li key={subcategory.name}>
                    <Link
                      href={subcategory.href}
                      onClick={onClose}
                      className="shell-list-link shell-list-link--mega block rounded-lg px-1.5 py-1 text-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {subcategory.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        <div className="mt-3 border-t border-soft pt-2.5">
          <Link
            href="/products"
            onClick={onClose}
            className="inline-flex items-center rounded-lg px-3 py-2 typ-body font-semibold text-primary hover:bg-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            All Products &gt;
          </Link>
        </div>
      </div>
    </div>
  );
}
