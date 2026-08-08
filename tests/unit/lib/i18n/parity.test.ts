import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..", "site");
const messagesDir = path.join(siteRoot, "i18n", "messages");
const manifest = JSON.parse(
  fs.readFileSync(path.join(siteRoot, "i18n/marketing-parity-manifest.json"), "utf8"),
);

describe("i18n marketing parity", () => {
  it("check-i18n-key-parity exits 0 for wave1 and deferred locales", () => {
    const output = execFileSync(process.execPath, [path.join(siteRoot, "..", "scripts/check-i18n-key-parity.mjs")], {
      cwd: siteRoot,
      encoding: "utf8",
    });
    expect(output).toContain("check-i18n-key-parity: ok");
    expect(output).toMatch(/hi, de, es, fr/);
  }, 30_000);

  it("deferred locales translate wave1 hero copy away from English", () => {
    const en = JSON.parse(fs.readFileSync(path.join(messagesDir, "en.json"), "utf8"));
    for (const locale of manifest.deferredLocales) {
      const messages = JSON.parse(fs.readFileSync(path.join(messagesDir, `${locale}.json`), "utf8"));
      for (const namespace of manifest.wave1Namespaces) {
        const enSample =
          en[namespace]?.heroTitle ??
          en[namespace]?.heroTitleLead ??
          en[namespace]?.headlineLead ??
          en[namespace]?.subtitle ??
          en[namespace]?.hero?.title?.[0];
        const localeSample =
          messages[namespace]?.heroTitle ??
          messages[namespace]?.heroTitleLead ??
          messages[namespace]?.headlineLead ??
          messages[namespace]?.subtitle ??
          messages[namespace]?.hero?.title?.[0];
        if (typeof enSample === "string") {
          expect(localeSample, `${locale}/${namespace}`).not.toBe(enSample);
        }
      }
    }
  });
});
