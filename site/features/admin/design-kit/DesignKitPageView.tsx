"use client";

import Link from "next/link";
import {
  ArrowRight,
  Cursor,
  Info,
  Sparkle,
  WarningCircle,
} from "@phosphor-icons/react";

import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { Switch } from "@/components/ui/switch";
import { AdminAlert } from "@/features/admin/ui/AdminAlert";
import { AdminCheckbox } from "@/features/admin/ui/AdminFormFields";

/** Site (marketing) — homepage benchmark. Scheme classes + home-* */
const SITE_MATERIALS = [
  {
    id: "scheme-page",
    label: "Scheme page paper",
    hex: "#FAFAF8 → #F3F2EF",
    detail: "+ ocean #EDF4FA at 18–22%",
    token: "scheme-page",
    use: "Light homepage sections — ecru gradient with cool mist",
  },
  {
    id: "accent-dark",
    label: "Accent dark band",
    hex: "#070D12",
    detail: "top rule #9D876C",
    token: "--surface-inverse",
    use: "Workspace planning block — midnight + bronze wash",
  },
  {
    id: "bronze-accent",
    label: "Bronze accent",
    hex: "#9D876C",
    detail: "hover #7F6A52",
    token: "--color-bronze-400",
    use: '"workspace" word, FLAGSHIP badge, launch links',
  },
  {
    id: "bronze-stat",
    label: "Bronze KPI glow",
    hex: "#BEAF9A",
    detail: "glow #9D876C @ 35%",
    token: "--color-bronze-300",
    use: "Proof KPI band numbers",
  },
  {
    id: "dark-glass",
    label: "Dark glass card",
    hex: "#FFFFFF @ 6%",
    detail: "border #FFFFFF @ 14%",
    token: ".home-tool-card--dark",
    use: "Planner CTA card on dark band",
  },
  {
    id: "inverse-text",
    label: "Inverse headline",
    hex: "#F8FAFC",
    detail: "muted #E2E8F0",
    token: "--text-inverse",
    use: "White copy on accent-dark sections",
  },
] as const;

/** Product (admin) — ecru chrome + FOCSS / React Aria controls. */
const PRODUCT_MATERIALS = [
  {
    id: "ecru-page",
    label: "Ecru page",
    hex: "#F3F2EF",
    token: "--color-ecru-100",
    use: "Admin & planner shell background",
  },
  {
    id: "ecru-card",
    label: "Ecru card",
    hex: "#FAFAF8",
    token: "--color-ecru-50",
    use: "Panels and inspector rails",
  },
  {
    id: "studio",
    label: "Studio thumb well",
    hex: "#FFFFFF → #EEF2F7 → #E6ECF3",
    token: "--surface-studio-field",
    use: "Catalog thumbs only — never page chrome",
  },
  {
    id: "cad",
    label: "CAD canvas",
    hex: "#EEF2F6",
    detail: "grid #D2DCE7 / #B9C8D8",
    token: "--color-white-200",
    use: "Drawing surface — cool gridded paper",
  },
  {
    id: "primary",
    label: "Midnight primary",
    hex: "#1F3653",
    token: "--color-dark-midnight-blue-500",
    use: "Primary CTAs, admin chrome",
  },
  {
    id: "bronze",
    label: "Bronze accent",
    hex: "#9D876C",
    token: "--color-bronze-400",
    use: "Status chips, sparing emphasis",
  },
] as const;

const BUTTON_VARIANTS = [
  "default",
  "primary",
  "outline",
  "secondary",
  "ghost",
  "destructive",
  "link",
] as const;

const BUTTON_SIZES = ["xs", "sm", "default", "lg"] as const;

export default function DesignKitPageView() {
  return (
    <div className="design-kit" data-testid="design-kit-page">
      <header className="design-kit-hero">
        <p className="design-kit-eyebrow">Two design systems</p>
        <h1 className="design-kit-title">Oando design kit</h1>
        <p className="design-kit-lede">
          <strong>Site</strong> follows the homepage — dark accent bands, bronze highlights,
          scheme-page gradients. Marketing uses FOCSS utilities only.
          <strong> Product</strong> (admin) uses ecru chrome and FOCSS + React Aria controls.
          No shadcn. No Radix.
        </p>
        <nav className="design-kit-nav" aria-label="Design kit sections">
          <a href="#site">Site benchmark</a>
          <a href="#site-surfaces">Site surfaces</a>
          <a href="#product">Product materials</a>
          <a href="#product-forms">Product forms</a>
          <a href="#product-surfaces">Product surfaces</a>
          <a href="#product-density">Density</a>
          <a href="#product-states">States</a>
        </nav>
      </header>

      <section
        id="site"
        className="design-kit-section design-kit-section--site"
        aria-labelledby="site-heading"
        data-testid="design-kit-site"
      >
        <div className="design-kit-section-head">
          <h2 id="site-heading" className="design-kit-section-title">
            Site — homepage benchmark
          </h2>
          <p className="design-kit-section-note">
            Marketing uses <code>scheme-*</code>, <code>home-tool-card--dark</code>,{" "}
            <code>.btn-primary</code>.
          </p>
        </div>
        <div className="design-kit-materials">
          {SITE_MATERIALS.map((item) => (
            <figure
              key={item.id}
              className={`design-kit-swatch design-kit-swatch--site-${item.id}`}
            >
              <div className="design-kit-swatch-plate" aria-hidden="true" />
              <figcaption className="design-kit-swatch-label">{item.label}</figcaption>
              <code className="design-kit-swatch-hex">{item.hex}</code>
              {"detail" in item && item.detail ? (
                <code className="design-kit-swatch-detail">{item.detail}</code>
              ) : null}
              <code className="design-kit-swatch-token">{item.token}</code>
              <p className="design-kit-swatch-use">{item.use}</p>
            </figure>
          ))}
        </div>
      </section>

      <section
        id="site-surfaces"
        className="design-kit-section design-kit-section--site"
        aria-labelledby="site-surfaces-heading"
        data-testid="design-kit-site-surfaces"
      >
        <div className="design-kit-section-head">
          <h2 id="site-surfaces-heading" className="design-kit-section-title">
            Site surfaces &amp; panels
          </h2>
        </div>
        <div className="design-kit-site-compare">
          <div className="design-kit-site-light">
            <p className="design-kit-density-label">Scheme page · #FAFAF8 → #F3F2EF</p>
            <article className="scheme-panel scheme-border design-kit-scheme-panel-sample">
              <h3 className="design-kit-sample-title">Light scheme panel</h3>
              <p className="design-kit-sample-copy">
                Ecru paper with ocean mist gradient. Border uses soft ecru mix.
              </p>
              <Link href="/ooplanner/" className="btn-primary design-kit-sample-cta">
                Explore planner
              </Link>
            </article>
          </div>
          <div className="design-kit-site-dark home-section--accent-dark home-tools-band">
            <p className="design-kit-density-label design-kit-density-label--inverse">
              Accent dark · #070D12 + bronze rule #9D876C
            </p>
            <article className="home-tool-card home-tool-card--dark home-tool-card--row">
              <div className="home-tool-icon home-tool-icon--dark-lg" aria-hidden="true">
                <Sparkle size={22} weight="fill" />
              </div>
              <div className="home-tool-card__body">
                <div className="design-kit-dark-card-head">
                  <h3 className="home-tool-title home-tool-title--dark">Oando Planner</h3>
                  <span className="home-tool-badge home-tool-badge--dark home-tool-badge--inline">
                    FLAGSHIP
                  </span>
                </div>
                <p className="design-kit-sample-copy design-kit-sample-copy--inverse">
                  Open the planner and start from a blank shell or your own plan.
                </p>
                <span className="home-tool-link home-tool-link--dark">
                  Launch planner <ArrowRight size={16} weight="bold" aria-hidden />
                </span>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section
        id="product"
        className="design-kit-section design-kit-section--product"
        aria-labelledby="product-heading"
        data-testid="design-kit-product"
      >
        <div className="design-kit-section-head">
          <h2 id="product-heading" className="design-kit-section-title">
            Product — admin · FOCSS
          </h2>
          <p className="design-kit-section-note">
            Ecru paper chrome. Controls are FOCSS + React Aria (dialogs). No shadcn registry.
          </p>
        </div>
        <div className="design-kit-materials">
          {PRODUCT_MATERIALS.map((item) => (
            <figure
              key={item.id}
              className={`design-kit-swatch design-kit-swatch--product-${item.id}`}
            >
              <div className="design-kit-swatch-plate" aria-hidden="true" />
              <figcaption className="design-kit-swatch-label">{item.label}</figcaption>
              <code className="design-kit-swatch-hex">{item.hex}</code>
              {"detail" in item && item.detail ? (
                <code className="design-kit-swatch-detail">{item.detail}</code>
              ) : null}
              <code className="design-kit-swatch-token">{item.token}</code>
              <p className="design-kit-swatch-use">{item.use}</p>
            </figure>
          ))}
        </div>
      </section>

      <section
        id="product-forms"
        className="design-kit-section design-kit-section--product"
        aria-labelledby="product-forms-heading"
        data-testid="design-kit-forms"
      >
        <div className="design-kit-section-head">
          <h2 id="product-forms-heading" className="design-kit-section-title">
            Product form controls (FOCSS)
          </h2>
        </div>
        <div className="design-kit-form-showcase">
          <div className="design-kit-form-card">
            <p className="design-kit-density-label">Default</p>
            <Field label="Product name" htmlFor="dk-name" description="Catalog + planner label.">
              <Input id="dk-name" defaultValue="Workstation L-Shape" />
            </Field>
          </div>
          <div className="design-kit-form-card">
            <p className="design-kit-density-label">Error</p>
            <Field label="SKU" htmlFor="dk-sku" error="SKU must be unique in this family.">
              <Input id="dk-sku" defaultValue="WS-001" aria-invalid />
            </Field>
          </div>
          <div className="design-kit-form-card">
            <p className="design-kit-density-label">Disabled</p>
            <Field label="Revision" htmlFor="dk-rev">
              <Input id="dk-rev" defaultValue="12" disabled />
            </Field>
          </div>
          <div className="design-kit-form-card">
            <p className="design-kit-density-label">Toggle</p>
            <div className="design-kit-form-inline">
              <AdminCheckbox
                label="Include in publish"
                checked
                onChange={() => {
                  /* showcase */
                }}
              />
            </div>
            <div className="design-kit-form-switch-row">
              <Label htmlFor="dk-switch">Live preview</Label>
              <Switch id="dk-switch" defaultChecked />
            </div>
          </div>
        </div>
      </section>

      <section
        id="product-surfaces"
        className="design-kit-section design-kit-section--product"
        aria-labelledby="product-surfaces-heading"
        data-testid="design-kit-surfaces"
      >
        <div className="design-kit-section-head">
          <h2 id="product-surfaces-heading" className="design-kit-section-title">
            Product surfaces &amp; panels
          </h2>
        </div>
        <div className="design-kit-product-surfaces">
          <Panel className="design-kit-panel-sample">
            <PanelHeader>Inspector panel</PanelHeader>
            <div className="design-kit-panel-body">
              Ecru card · FOCSS <code>.admin-panel</code>
            </div>
          </Panel>
          <div className="design-kit-product-tiles">
            <div className="design-kit-product-tile design-kit-product-tile--ecru-page">
              <span className="design-kit-product-tile-title">Ecru page</span>
              <span className="design-kit-product-tile-hex">#F3F2EF</span>
            </div>
            <div className="design-kit-product-tile design-kit-product-tile--ecru-card">
              <span className="design-kit-product-tile-title">Ecru card</span>
              <span className="design-kit-product-tile-hex">#FAFAF8</span>
            </div>
            <div className="design-kit-product-tile design-kit-product-tile--studio">
              <span className="design-kit-product-tile-title">Studio well</span>
              <span className="design-kit-product-tile-hex">cool gradient</span>
            </div>
            <div className="design-kit-product-tile design-kit-product-tile--cad">
              <span className="design-kit-product-tile-title">CAD canvas</span>
              <span className="design-kit-product-tile-hex">#EEF2F6</span>
            </div>
          </div>
        </div>
      </section>

      <section
        className="design-kit-section design-kit-section--product"
        aria-labelledby="product-buttons-heading"
        data-testid="design-kit-buttons"
      >
        <div className="design-kit-section-head">
          <h2 id="product-buttons-heading" className="design-kit-section-title">
            Product buttons (FOCSS)
          </h2>
        </div>
        <div className="design-kit-grid-2">
          <div>
            <p className="design-kit-density-label">Variants · primary #1F3653</p>
            <div className="design-kit-row">
              {BUTTON_VARIANTS.map((variant) => (
                <Button key={variant} variant={variant}>
                  {variant}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <p className="design-kit-density-label">Sizes</p>
            <div className="design-kit-row">
              {BUTTON_SIZES.map((size) => (
                <Button key={size} size={size}>
                  {size}
                </Button>
              ))}
              <IconButton label="Settings" size="icon-sm">
                <Info size={16} weight="bold" aria-hidden />
              </IconButton>
            </div>
          </div>
        </div>
      </section>

      <section
        id="product-density"
        className="design-kit-section design-kit-section--product"
        aria-labelledby="product-density-heading"
        data-testid="design-kit-density"
      >
        <div className="design-kit-section-head">
          <h2 id="product-density-heading" className="design-kit-section-title">
            Product density tiers
          </h2>
        </div>
        <div className="design-kit-density-compare">
          <div className="design-kit-density-card">
            <p className="design-kit-density-label">Default · panel padding 0.75rem</p>
            <Panel className="design-kit-density-panel">
              <PanelHeader>Standard panel</PanelHeader>
              <div className="design-kit-density-panel-body design-kit-density-panel-body--default">
                <Field label="Label" htmlFor="dk-density-default">
                  <Input id="dk-density-default" defaultValue="Default spacing" />
                </Field>
                <div className="design-kit-row">
                  <Button size="default">Default</Button>
                  <Button size="sm" variant="outline">
                    Secondary
                  </Button>
                </div>
              </div>
            </Panel>
          </div>
          <div className="design-kit-density-card">
            <p className="design-kit-density-label">Dense · tools / inspector rails</p>
            <Panel className="design-kit-density-panel">
              <PanelHeader>Dense panel</PanelHeader>
              <div className="design-kit-density-panel-body design-kit-density-panel-body--dense">
                <Field label="Label" htmlFor="dk-density-dense">
                  <Input id="dk-density-dense" defaultValue="Dense spacing" />
                </Field>
                <div className="design-kit-row">
                  <Button size="xs">xs</Button>
                  <Button size="sm" variant="outline">
                    sm
                  </Button>
                  <IconButton label="Info" size="icon-sm" variant="outline">
                    <Info size={14} weight="bold" aria-hidden />
                  </IconButton>
                </div>
              </div>
            </Panel>
          </div>
          <div className="design-kit-density-card">
            <p className="design-kit-density-label">Touch · planner mobile floor</p>
            <Panel className="design-kit-density-panel">
              <PanelHeader>Touch targets</PanelHeader>
              <div className="design-kit-density-panel-body design-kit-density-panel-body--default">
                <p className="design-kit-density-touch-note">
                  Min 44px tap targets — use <code>size=&quot;lg&quot;</code> or touch density.
                </p>
                <div className="design-kit-row">
                  <Button size="lg">Place</Button>
                  <Button size="lg" variant="outline">
                    Library
                  </Button>
                </div>
              </div>
            </Panel>
          </div>
        </div>
      </section>

      <section
        id="product-states"
        className="design-kit-section design-kit-section--product"
        aria-labelledby="product-states-heading"
        data-testid="design-kit-states"
      >
        <div className="design-kit-section-head">
          <h2 id="product-states-heading" className="design-kit-section-title">
            Product workspace states
          </h2>
        </div>
        <div className="design-kit-states-grid" data-testid="design-kit-feedback">
          <Panel className="design-kit-state-card" data-testid="design-kit-state-empty">
            <p className="design-kit-density-label">Empty</p>
            <div className="design-kit-state-empty">
              <Cursor size={22} aria-hidden />
              <strong>No selection</strong>
              <p>Click a shape on the canvas to edit geometry here.</p>
            </div>
          </Panel>
          <Panel className="design-kit-state-card" data-testid="design-kit-state-loading">
            <p className="design-kit-density-label">Loading</p>
            <div className="admin-empty admin-empty--compact">
              <span className="admin-spinner" aria-hidden />
              <p className="admin-empty__copy">Loading catalog…</p>
            </div>
          </Panel>
          <Panel className="design-kit-state-card" data-testid="design-kit-state-error">
            <p className="design-kit-density-label">Error</p>
            <AdminAlert variant="error" title="Could not load inventory">
              Retry the catalog sync or check network access.
            </AdminAlert>
          </Panel>
          <div data-testid="design-kit-feedback-alerts">
            <AdminAlert variant="success" title="Publish ready">
              All validation checks passed.
            </AdminAlert>
            <AdminAlert variant="error" title="Publish blocked" className="mt-3">
              Fix validation errors before release.
            </AdminAlert>
            <AdminAlert variant="warn" className="mt-3">
              <WarningCircle size={16} aria-hidden /> Demo data is browser-local only.
            </AdminAlert>
            <span className="admin-badge admin-badge--active" data-slot="badge">
              Default
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
