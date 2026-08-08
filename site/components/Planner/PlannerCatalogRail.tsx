"use client";
import React, { useEffect, useMemo, useState } from "react";
import { PhIcon } from "@planner/components/ui/PlannerPhIcon";
import { useCatalogStore } from "@planner/store/plannerCatalogStore";
import { fileUrl, uploadFurniture } from "@planner/lib/plannerApi";
import { usePlannerUIStore } from "@planner/store/plannerUiStore";
import type { FurnitureDimensions, FurnitureItem } from "@planner/lib/plannerTypes";
import { DEFAULT_CATALOG_FURNITURE_DIMS_MM } from "@planner/lib/plannerTokens";

const formatDims = (d: FurnitureDimensions): string => `${d.width_mm}×${d.depth_mm}×${d.height_mm} mm`;

type CatalogRailProps = {
  onDragStart?: (item: FurnitureItem) => void;
  onItemClick?: (item: FurnitureItem) => void;
};

type UploadForm = {
  name: string;
  category: string;
  width_mm: number;
  depth_mm: number;
  height_mm: number;
  tags: string;
  file: File | null;
};

const CatalogRail = ({ onDragStart, onItemClick }: CatalogRailProps) => {
  const items = useCatalogStore((s) => s.items);
  const categories = useCatalogStore((s) => s.categories);
  const refresh = useCatalogStore((s) => s.refresh);
  const showToast = usePlannerUIStore((s) => s.showToast);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [upload, setUpload] = useState<UploadForm>({
    name: "",
    category: "Custom",
    ...DEFAULT_CATALOG_FURNITURE_DIMS_MM,
    tags: "",
    file: null,
  });

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    const needle = q.toLowerCase().trim();
    return items.filter((i) => {
      if (cat !== "all" && i.category !== cat) return false;
      if (needle && !i.name.toLowerCase().includes(needle) && !(i.tags || []).join(" ").toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [items, q, cat]);

  const thumbUrl = (item: FurnitureItem): string | null | undefined =>
    item.thumbnail_url ?? item.thumb_url;

  const doUpload = async () => {
    if (!upload.file || !upload.name) {
      showToast("Name + file required", "error");
      return;
    }
    try {
      const fd = new FormData();
      fd.append("file", upload.file);
      fd.append("name", upload.name);
      fd.append("category", upload.category);
      fd.append("width_mm", String(upload.width_mm));
      fd.append("depth_mm", String(upload.depth_mm));
      fd.append("height_mm", String(upload.height_mm));
      fd.append("tags", upload.tags);
      await uploadFurniture(fd);
      showToast(`Uploaded "${upload.name}"`, "ok");
      setUploadOpen(false);
      setUpload({ name: "", category: "Custom", ...DEFAULT_CATALOG_FURNITURE_DIMS_MM, tags: "", file: null });
      refresh();
    } catch (e: unknown) {
      showToast(`Upload failed: ${e instanceof Error ? e.message : String(e)}`, "error");
    }
  };

  return (
    <>
      <div className="side-panel__section">
        <h3 className="side-panel__title">Catalog</h3>
        <div className="catalog-search-wrap" style={{ marginBottom: 10 }}>
          <span className="catalog-search-icon"><PhIcon name="search" size={16} /></span>
          <input
            className="catalog-search"
            placeholder="Search furniture…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            data-testid="catalog-search"
            aria-label="Search furniture"
          />
        </div>
        <div className="catalog-categories">
          {categories.map((c) => (
            <button key={c} className="chip" data-active={cat === c} onClick={() => setCat(c)} data-testid={`cat-${c}`}>
              {c === "all" ? "All" : c}
            </button>
          ))}
        </div>
        <button className="btn btn--sm" onClick={() => setUploadOpen(true)} data-testid="btn-upload" style={{ width: "100%", justifyContent: "center" }}>
          <PhIcon name="upload" size={16} /> Upload custom
        </button>
      </div>

      <div className="side-panel__section" style={{ flex: 1, overflow: "auto", padding: "10px 12px 20px" }}>
        <div className="catalog-grid">
          {filtered.map((item) => {
            const thumb = thumbUrl(item);
            const thumbSrc = thumb ? fileUrl(thumb) : null;
            return (
              <div
                key={item.id}
                className="catalog-item"
                role="button"
                tabIndex={0}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("application/furniture-id", item.id);
                  onDragStart?.(item);
                }}
                onClick={() => onItemClick?.(item)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onItemClick?.(item);
                  }
                }}
                data-testid={`catalog-item-${item.id}`}
                title={`${item.name} — ${formatDims(item.dimensions)}`}
                aria-label={item.name}
              >
                <div className="catalog-item__thumb">
                  {thumbSrc
                    ? <img src={thumbSrc} alt={item.name} loading="lazy" />
                    : <PhIcon name="rect" size={32} />
                  }
                </div>
                <div className="catalog-item__name">{item.name}</div>
                <div className="catalog-item__dim">{item.dimensions.width_mm}×{item.dimensions.depth_mm}</div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="empty-state" style={{ gridColumn: "1/-1" }}>No items match</div>
          )}
        </div>
      </div>

      {uploadOpen && (
        <div
          className="dialog-scrim"
          role="presentation"
          onClick={(e) => { if (e.target === e.currentTarget) setUploadOpen(false); }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setUploadOpen(false);
          }}
        >
          <div className="dialog" role="dialog" aria-label="Upload custom furniture">
            <h2 className="dialog__title">Upload custom furniture</h2>
            <div className="dialog__sub">Add a PNG or SVG symbol with its real-world dimensions.</div>
            <div className="prop-row">
              <label className="prop-row__label" htmlFor="planner-upload-name">Name</label>
              <input id="planner-upload-name" className="input" value={upload.name} onChange={(e) => setUpload({ ...upload, name: e.target.value })} placeholder="e.g. Custom Cabinet" data-testid="upload-name" />
            </div>
            <div className="prop-row">
              <label className="prop-row__label" htmlFor="planner-upload-category">Category</label>
              <select
                id="planner-upload-category"
                className="select"
                value={upload.category}
                onChange={(e) => setUpload({ ...upload, category: e.target.value })}
                aria-label="Category"
              >
                {["Seating", "Desks", "Tables", "Storage", "Workstations", "Accessories", "Openings", "Custom"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="prop-row">
              <div className="prop-row__label" id="planner-upload-dims-label">W × D × H</div>
              <div className="prop-row__inputs" role="group" aria-labelledby="planner-upload-dims-label">
                <input className="input" type="number" value={upload.width_mm} onChange={(e) => setUpload({ ...upload, width_mm: parseFloat(e.target.value) || 0 })} aria-label="Width (mm)" />
                <input className="input" type="number" value={upload.depth_mm} onChange={(e) => setUpload({ ...upload, depth_mm: parseFloat(e.target.value) || 0 })} aria-label="Depth (mm)" />
                <input className="input" type="number" value={upload.height_mm} onChange={(e) => setUpload({ ...upload, height_mm: parseFloat(e.target.value) || 0 })} aria-label="Height (mm)" />
              </div>
            </div>
            <div className="prop-row">
              <label className="prop-row__label" htmlFor="planner-upload-tags">Tags</label>
              <input id="planner-upload-tags" className="input" value={upload.tags} onChange={(e) => setUpload({ ...upload, tags: e.target.value })} placeholder="comma, separated" />
            </div>
            <div className="prop-row">
              <label className="prop-row__label" htmlFor="planner-upload-file">File</label>
              <input id="planner-upload-file" type="file" accept="image/png,image/svg+xml" onChange={(e) => setUpload({ ...upload, file: e.target.files?.[0] || null })} data-testid="upload-file" aria-label="Furniture image file" />
            </div>
            <div className="dialog__actions">
              <button className="btn btn--ghost" onClick={() => setUploadOpen(false)}>Cancel</button>
              <button className="btn btn--primary" onClick={doUpload} data-testid="upload-confirm">Upload</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CatalogRail;
