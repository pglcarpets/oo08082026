// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  checkComposerStyles,
  findRenderedClassNames,
  findStyledClassNames,
} from "../../../scripts/general/check-composer-styles.mjs";

describe("composer class-name extraction", () => {
  it("reads a plain string className", () => {
    expect([...findRenderedClassNames('<div className="shape-composer__canvas" />')]).toEqual([
      "shape-composer__canvas",
    ]);
  });

  it("reads string literals out of a cn() expression", () => {
    const source = 'className={cn("product-studio-toolbar__button", className)}';
    expect([...findRenderedClassNames(source)]).toEqual(["product-studio-toolbar__button"]);
  });

  it("reads a class name split by a template-literal interpolation", () => {
    const source = [
      "className={`product-studio-upload__mode-btn${",
      '  active ? " product-studio-upload__mode-btn--active" : ""',
      "}`}",
    ].join("\n");
    expect([...findRenderedClassNames(source)].sort()).toEqual([
      "product-studio-upload__mode-btn",
      "product-studio-upload__mode-btn--active",
    ]);
  });

  it("does not treat a data-testid as a class name", () => {
    const source = '<div data-testid="shape-composer-canvas" className="shape-composer__canvas" />';
    expect([...findRenderedClassNames(source)]).toEqual(["shape-composer__canvas"]);
  });

  it("reads class names out of compound and stateful selectors", () => {
    const css = `
      .shape-composer__canvas .react-flow { inline-size: 100%; }
      .shape-composer-node[data-selected="true"] { outline: 1px solid red; }
      @media (pointer: coarse) { .product-studio-toolbar__button { min-block-size: 2.75rem; } }
    `;
    expect([...findStyledClassNames(css)].sort()).toEqual([
      "product-studio-toolbar__button",
      "shape-composer-node",
      "shape-composer__canvas",
    ]);
  });

  it("ignores selectors inside comments", () => {
    expect([...findStyledClassNames("/* .shape-composer__gone {} */")]).toEqual([]);
  });
});

describe("composer style coverage over the live tree", () => {
  it("has a rule for every composer class name in source", () => {
    expect(checkComposerStyles().unstyled).toEqual([]);
  });

  it("has no rule for a class name nothing renders", () => {
    expect(checkComposerStyles().dead).toEqual([]);
  });
});
