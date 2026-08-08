import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { AdminAlert } from "@/features/admin/ui/AdminAlert";
import {
  AdminCheckbox,
  AdminField,
  AdminSelect,
  AdminTextInput,
  AdminTextarea,
} from "@/features/admin/ui/AdminFormFields";
import { AdminPanelCard } from "@/features/admin/ui/AdminPanelCard";

describe("admin FOCSS form shell (13b)", () => {
  it("AdminAlert uses FOCSS classes, not shadcn data-slot", () => {
    const html = renderToStaticMarkup(
      <AdminAlert variant="warn" title="Heads up">
        Check the price book
      </AdminAlert>,
    );
    expect(html).toContain("admin-alert");
    expect(html).toContain("admin-alert--warn");
    expect(html).toContain("Heads up");
    expect(html).toContain("Check the price book");
    expect(html).not.toContain("data-slot=");
  });

  it("AdminPanelCard uses admin-panel surface", () => {
    const html = renderToStaticMarkup(
      <AdminPanelCard title="Recent" action={<a href="/admin">All</a>}>
        <p>Body</p>
      </AdminPanelCard>,
    );
    expect(html).toContain("admin-panel");
    expect(html).toContain("admin-panel-card__title");
    expect(html).toContain("Recent");
    expect(html).toContain("Body");
    expect(html).not.toContain("data-slot=");
  });

  it("AdminField + controls use FOCSS field classes", () => {
    const html = renderToStaticMarkup(
      <AdminField label="Name" htmlFor="name-field" hint="Required">
        <AdminTextInput id="name-field" defaultValue="Acme" />
      </AdminField>,
    );
    expect(html).toContain("admin-field");
    expect(html).toContain("admin-field__label");
    expect(html).toContain("admin-field__control");
    expect(html).toContain("admin-field__help");
    expect(html).toContain('for="name-field"');
    expect(html).not.toContain("data-slot=");
  });

  it("AdminSelect and AdminTextarea stay native + FOCSS", () => {
    const selectHtml = renderToStaticMarkup(
      <AdminSelect defaultValue="a">
        <option value="a">A</option>
      </AdminSelect>,
    );
    const areaHtml = renderToStaticMarkup(
      <AdminTextarea defaultValue="notes" />,
    );
    expect(selectHtml).toContain("<select");
    expect(selectHtml).toContain("admin-field__control");
    expect(areaHtml).toContain("<textarea");
    expect(areaHtml).toContain("admin-field__control--mono");
  });

  it("AdminField wires control id to label for accessible name", () => {
    const html = renderToStaticMarkup(
      <AdminField label="Period">
        <AdminSelect defaultValue="30d">
          <option value="30d">30 days</option>
        </AdminSelect>
      </AdminField>,
    );
    const forMatch = html.match(/for="([^"]+)"/);
    const idMatch = html.match(/<select[^>]*\sid="([^"]+)"/);
    expect(typeof forMatch?.[1]).toBe("string");
    expect((forMatch?.[1] ?? "").length).toBeGreaterThan(0);
    expect(idMatch?.[1]).toBe(forMatch?.[1]);
  });

  it("AdminCheckbox is a native checkbox with FOCSS chrome", () => {
    const onChange = vi.fn();
    const html = renderToStaticMarkup(
      <AdminCheckbox label="Published" checked={true} onChange={onChange} />,
    );
    expect(html).toContain('type="checkbox"');
    expect(html).toContain("admin-checkbox");
    expect(html).toContain("admin-checkbox__input");
    expect(html).toContain("Published");
    expect(html).not.toContain("data-slot=");
  });
});
