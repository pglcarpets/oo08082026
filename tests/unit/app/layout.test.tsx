import { expect, test, vi } from "vitest";
import RootLayout from "@/app/layout";
import * as nextIntlServer from "next-intl/server";

vi.mock("@/lib/layout/siteLayoutContext", () => ({
  getSiteLayoutContext: vi.fn().mockResolvedValue({ messages: {}, locale: "en", lang: "en-IN" }),
}));

vi.mock("next-intl/server", () => ({
  getLocale: vi.fn(async () => "en"),
}));

test("RootLayout renders with children", async () => {
  const children = <div id="test-child">Test Child</div>;
  const jsx = await RootLayout({ children });
  expect(jsx).toBeDefined();
  expect(jsx.type).toBe("html");
  // Root shell is locale-prefixless (next-intl localePrefix: never); html lang defaults to en-IN.
  expect(jsx.props.lang).toBe("en-IN");
});

test("RootLayout reflects the active locale on <html lang> (TST-S23)", async () => {
  vi.mocked(nextIntlServer.getLocale).mockResolvedValueOnce("hi");
  const jsx = await RootLayout({ children: <div /> });
  expect(jsx.props.lang).toBe("hi-IN");

  vi.mocked(nextIntlServer.getLocale).mockResolvedValueOnce("fr");
  const jsxFr = await RootLayout({ children: <div /> });
  expect(jsxFr.props.lang).toBe("fr-IN");
});

test("RootLayout falls back to en when next-intl context is absent", async () => {
  vi.mocked(nextIntlServer.getLocale).mockRejectedValueOnce(new Error("no request context"));
  const jsx = await RootLayout({ children: <div /> });
  expect(jsx.props.lang).toBe("en-IN");
});
