"use client";
import React, { useEffect, useMemo, useState } from "react";
import { PhIcon } from "@planner/components/ui/PlannerPhIcon";
import { useCatalogStore } from "@planner/store/plannerCatalogStore";
import { fileUrl } from "@planner/lib/plannerApi";
import { OoButton } from "@planner/components/ui/PlannerOoButton";
import { OoInput } from "@planner/components/ui/PlannerOoInput";
import { OoDialog } from "@planner/components/ui/PlannerOoDialog";
import type { FurnitureItem, PlannerSheet } from "@planner/lib/plannerTypes";

type AutoArrangeDialogProps = {
  open?: boolean;
  onClose?: () => void;
  sheet: PlannerSheet;
  onArrange: (opts: { items: FurnitureItem[]; gap_mm: number; margin_mm: number }) => void | Promise<void>;
};

export const AutoArrangeDialog = ({ open, onClose, sheet, onArrange }: AutoArrangeDialogProps) => {
  const items = useCatalogStore((s) => s.items);
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [gap, setGap] = useState(300);
  const [margin, setMargin] = useState(500);
  const [category, setCategory] = useState("all");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) setSelected({});
  }, [open]);

  const catList = useMemo(() => {
    const cats = new Set(items.map((i) => i.category).filter(Boolean));
    return ["all", ...Array.from(cats).sort()];
  }, [items]);

  const visible = useMemo(
    () => items.filter((i) => category === "all" || i.category === category),
    [items, category],
  );

  const totalCount = Object.values(selected).reduce((a, b) => a + (b || 0), 0);
  const totalArea = useMemo(() => {
    let area = 0;
    for (const [id, count] of Object.entries(selected)) {
      if (!count) continue;
      const it = items.find((x) => x.id === id);
      if (it) area += it.dimensions.width_mm * it.dimensions.depth_mm * count;
    }
    return area;
  }, [selected, items]);

  const roomArea = sheet.width_mm * sheet.height_mm;
  const roughUsage = roomArea > 0 ? totalArea / roomArea : 0;

  const bump = (id: string, delta: number) => {
    setSelected((s) => {
      const next = { ...s, [id]: Math.max(0, (s[id] || 0) + delta) };
      if (next[id] === 0) delete next[id];
      return next;
    });
  };

  const doArrange = async () => {
    setBusy(true);
    try {
      const list: FurnitureItem[] = [];
      for (const [id, count] of Object.entries(selected)) {
        if (!count) continue;
        const it = items.find((x) => x.id === id);
        if (it) list.push({ ...it, count });
      }
      await onArrange({ items: list, gap_mm: Number(gap) || 0, margin_mm: Number(margin) || 0 });
      onClose?.();
    } finally {
      setBusy(false);
    }
  };

  const thumbUrl = (it: FurnitureItem): string | null | undefined =>
    it.thumbnail_url ?? it.thumb_url;

  return (
    <OoDialog
      open={!!open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose?.();
      }}
      title="Auto-arrange room"
      className="dialog"
    >
      <div data-testid="auto-arrange-dialog" style={{ maxWidth: 720 }}>
        <div className="dialog__sub">
          Pick items and quantities. They’ll be laid out in a non-overlapping grid inside your{" "}
          {Math.round((sheet.width_mm / 1000) * 10) / 10}×{Math.round((sheet.height_mm / 1000) * 10) / 10}m
          room.
        </div>

        <div className="prop-row" style={{ gridTemplateColumns: "90px 1fr 1fr", gap: 8 }}>
          <div className="prop-row__label" id="aa-spacing-label">Spacing</div>
          <div className="prop-row__inputs">
            <OoInput
              type="number"
              value={String(margin)}
              onChange={(e) => setMargin(parseFloat(e.target.value) || 0)}
              data-testid="aa-margin"
              aria-label="Spacing margin in millimeters"
            />
            <div style={{ fontSize: 11, color: "var(--text-subtle)", alignSelf: "center", minWidth: 42 }}>
              margin mm
            </div>
          </div>
          <div className="prop-row__inputs">
            <OoInput
              type="number"
              value={String(gap)}
              onChange={(e) => setGap(parseFloat(e.target.value) || 0)}
              data-testid="aa-gap"
              aria-label="Spacing gap in millimeters"
            />
            <div style={{ fontSize: 11, color: "var(--text-subtle)", alignSelf: "center", minWidth: 42 }}>
              gap mm
            </div>
          </div>
        </div>

        <div className="catalog-categories" style={{ margin: "12px 0 8px" }}>
          {catList.map((c) => (
            <OoButton
              key={c}
              plain
              className="chip"
              data-active={category === c}
              onPress={() => setCategory(c)}
              data-testid={`aa-cat-${c}`}
            >
              {c === "all" ? "All" : c}
            </OoButton>
          ))}
        </div>

        <div
          style={{
            maxHeight: 340,
            overflow: "auto",
            border: "1px solid var(--border-soft)",
            borderRadius: 10,
            padding: 8,
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 8 }}>
            {visible.map((it) => {
              const n = selected[it.id] || 0;
              const thumb = thumbUrl(it);
              const thumbSrc = thumb ? fileUrl(thumb) : null;
              return (
                <div key={it.id} className="catalog-item" style={{ cursor: "default" }} data-testid={`aa-item-${it.id}`}>
                  <div className="catalog-item__thumb" style={{ height: 80 }}>
                    {thumbSrc ? (
                      <img src={thumbSrc} alt={it.name} />
                    ) : (
                      <PhIcon name="rect" size={24} />
                    )}
                  </div>
                  <div className="catalog-item__name">{it.name}</div>
                  <div className="catalog-item__dim">
                    {it.dimensions.width_mm}×{it.dimensions.depth_mm}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6 }}>
                    <OoButton
                      variant={["sm", "ghost"]}
                      onPress={() => bump(it.id, -1)}
                      isDisabled={!n}
                      data-testid={`aa-minus-${it.id}`}
                    >
                      –
                    </OoButton>
                    <div
                      className="input input--sm"
                      style={{
                        flex: 1,
                        textAlign: "center",
                        padding: "4px 0",
                        background: "var(--surface-muted)",
                        border: "1px solid var(--border-soft)",
                      }}
                      data-testid={`aa-count-${it.id}`}
                    >
                      {n}
                    </div>
                    <OoButton
                      variant={["sm", "ghost"]}
                      onPress={() => bump(it.id, +1)}
                      data-testid={`aa-plus-${it.id}`}
                    >
                      +
                    </OoButton>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div
          style={{
            marginTop: 12,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 12,
            color: "var(--text-muted)",
            fontFamily: "var(--font-mono)",
          }}
        >
          <div>
            {totalCount} items · rough coverage {(roughUsage * 100).toFixed(0)}%
          </div>
          {roughUsage > 1 && (
            <div style={{ color: "var(--color-error)" }}>
              Selection larger than room — excess will overflow.
            </div>
          )}
        </div>

        <div className="dialog__actions">
          <OoButton variant="ghost" onPress={() => onClose?.()} data-testid="aa-cancel">
            Cancel
          </OoButton>
          <OoButton
            variant="primary"
            onPress={doArrange}
            isDisabled={busy || totalCount === 0}
            data-testid="aa-arrange"
          >
            {busy ? "Arranging…" : `Arrange ${totalCount} item${totalCount === 1 ? "" : "s"}`}
          </OoButton>
        </div>
      </div>
    </OoDialog>
  );
};

export default AutoArrangeDialog;
