"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { PhIcon } from "@studio/components/ui/StudioPhIcon";
import {
  flattenExportSections,
  type ExportMenuItem,
  type ExportMenuSection,
} from "@studio/components/ui/studioExportMenuTypes";

export type { ExportMenuItem, ExportMenuSection } from "@studio/components/ui/studioExportMenuTypes";

type ExportMenuProps = {
  /** Flat list (single group, no heading). */
  items?: ExportMenuItem[];
  /** Grouped sections with optional headings (Plan / 3D, etc.). */
  sections?: ExportMenuSection[];
  label?: string;
  testId?: string;
  panelTestId?: string;
};

function focusItem(refs: Array<HTMLButtonElement | null>, index: number) {
  const el = refs[index];
  if (el) el.focus();
}

function resolveSections(props: ExportMenuProps): ExportMenuSection[] {
  if (props.sections && props.sections.length > 0) return props.sections;
  if (props.items && props.items.length > 0) return [{ id: "default", items: props.items }];
  return [];
}

/** Compact Export dropdown for topbar / canvas chrome (keyboard-accessible menu). */
export function ExportMenu({
  items,
  sections: sectionsProp,
  label = "Export",
  testId = "btn-export-menu",
  panelTestId = "export-menu-panel",
}: ExportMenuProps) {
  const sections = useMemo(() => resolveSections({ items, sections: sectionsProp }), [items, sectionsProp]);
  const flatItems = useMemo(() => flattenExportSections(sections), [sections]);

  const [open, setOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const menuId = useId();

  const closeMenu = useCallback(() => {
    setOpen(false);
    setFocusIndex(-1);
    triggerRef.current?.focus();
  }, []);

  const openMenu = useCallback((initialIndex = 0) => {
    setOpen(true);
    setFocusIndex(initialIndex);
  }, []);

  const selectItem = useCallback(
    (item: ExportMenuItem) => {
      closeMenu();
      item.onSelect();
    },
    [closeMenu],
  );

  useEffect(() => {
    if (!open) return;
    if (focusIndex >= 0) {
      focusItem(itemRefs.current, focusIndex);
    }
  }, [open, focusIndex]);

  useEffect(() => {
    if (!open) return;
    // Capture phase so canvas / Fabric handlers that stopPropagation still close the menu.
    const onPointerDown = (event: PointerEvent) => {
      const root = rootRef.current;
      if (!root) return;
      if (event.target instanceof Node && !root.contains(event.target)) {
        closeMenu();
      }
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    return () => window.removeEventListener("pointerdown", onPointerDown, true);
  }, [open, closeMenu]);

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    switch (event.key) {
      case "ArrowDown":
      case "Enter":
      case " ":
        event.preventDefault();
        if (!open) {
          openMenu(0);
        } else if (event.key === "ArrowDown") {
          setFocusIndex((i) => Math.min(flatItems.length - 1, Math.max(0, i) + 1));
        }
        break;
      case "ArrowUp":
        event.preventDefault();
        if (open) {
          setFocusIndex((i) => Math.max(0, (i < 0 ? 0 : i) - 1));
        }
        break;
      case "Escape":
        if (open) {
          event.preventDefault();
          closeMenu();
        }
        break;
      default:
        break;
    }
  };

  const onItemKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setFocusIndex(Math.min(flatItems.length - 1, index + 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setFocusIndex(Math.max(0, index - 1));
        break;
      case "Home":
        event.preventDefault();
        setFocusIndex(0);
        break;
      case "End":
        event.preventDefault();
        setFocusIndex(flatItems.length - 1);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        selectItem(flatItems[index]);
        break;
      case "Escape":
        event.preventDefault();
        closeMenu();
        break;
      case "Tab":
        closeMenu();
        break;
      default:
        break;
    }
  };

  let flatIndex = 0;

  return (
    <div className="export-menu" ref={rootRef} data-open={open ? "true" : "false"}>
      <button
        ref={triggerRef}
        className="btn btn--sm"
        type="button"
        data-testid={testId}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => (open ? closeMenu() : openMenu(0))}
        onKeyDown={onTriggerKeyDown}
      >
        <PhIcon name="download" size={16} />
        {label}
        <PhIcon name="caretDown" size={16} />
      </button>
      <div
        id={menuId}
        className="export-menu__panel"
        role="menu"
        data-testid={panelTestId}
        hidden={!open}
        aria-label={label}
      >
        {sections.map((section, sectionIndex) => (
          <div key={section.id} className="export-menu__section" role="none">
            {section.heading ? (
              <div className="export-menu__heading" role="presentation">
                {section.heading}
              </div>
            ) : null}
            {sectionIndex > 0 ? <div className="export-menu__sep" role="separator" aria-hidden="true" /> : null}
            {section.items.map((item) => {
              const index = flatIndex;
              flatIndex += 1;
              return (
                <button
                  key={item.id}
                  ref={(el) => {
                    itemRefs.current[index] = el;
                  }}
                  type="button"
                  role="menuitem"
                  tabIndex={open && focusIndex === index ? 0 : -1}
                  className="export-menu__item"
                  data-testid={item.testId ?? `btn-export-${item.id}`}
                  onClick={() => selectItem(item)}
                  onKeyDown={(event) => onItemKeyDown(event, index)}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ExportMenu;
