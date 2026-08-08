#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

import { baseUrl as resolveBaseUrl } from "./lib/scriptEnv.mjs";

const DEFAULT_OUTPUT_DIR = "screenshots/launch-smoke";

const args = process.argv.slice(2);

function getArgValue(name, fallback = "") {
  const prefix = `${name}=`;
  const direct = args.find((arg) => arg.startsWith(prefix));
  if (direct) return direct.slice(prefix.length);
  const index = args.indexOf(name);
  if (index >= 0 && args[index + 1]) return args[index + 1];
  return fallback;
}

function normalizeBaseUrl(value) {
  const raw = (value || resolveBaseUrl()).trim();
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  return withProtocol.replace(/\/+$/, "");
}

const baseUrl = normalizeBaseUrl(getArgValue("--url", resolveBaseUrl()));
const outputDir = getArgValue("--out", DEFAULT_OUTPUT_DIR);

const launchRoutes = [
  { name: "home", path: "/" },
  { name: "products", path: "/products" },
  { name: "login", path: "/login" },
  { name: "contact", path: "/contact" },
  { name: "trusted-by", path: "/trusted-by" },
  { name: "sustainability", path: "/sustainability" },
  { name: "planner-entry", path: "/choose-product" },
];

const criticalConsolePatterns = [
  /failed to fetch/i,
  /cors/i,
  /hydration failed/i,
  /uncaught/i,
];

function isCriticalConsoleMessage(message) {
  return criticalConsolePatterns.some((pattern) => pattern.test(message));
}

fs.mkdirSync(outputDir, { recursive: true });

const browser = await chromium.launch();
const results = [];

try {
  for (const viewport of [
    { label: "desktop", width: 1440, height: 900 },
    { label: "mobile", width: 390, height: 844 },
  ]) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
    });
    const page = await context.newPage();

    for (const route of launchRoutes) {
      const consoleMessages = [];
      const pageErrors = [];
      const failedRequests = [];

      page.removeAllListeners("console");
      page.removeAllListeners("pageerror");
      page.removeAllListeners("requestfailed");

      page.on("console", (message) => {
        if (message.type() === "error" || message.type() === "warning") {
          consoleMessages.push(message.text());
        }
      });
      page.on("pageerror", (error) => {
        pageErrors.push(error.message);
      });
      page.on("requestfailed", (request) => {
        failedRequests.push({
          url: request.url(),
          failure: request.failure()?.errorText || "",
        });
      });

      const url = `${baseUrl}${route.path}`;
      const screenshotPath = path.join(
        outputDir,
        `${viewport.label}-${route.name}.png`,
      );

      let status = 0;
      let finalUrl = "";
      let error = "";

      try {
        const response = await page.goto(url, {
          waitUntil: "networkidle",
          timeout: 45000,
        });
        status = response?.status() || 0;
        finalUrl = page.url();
        await page.screenshot({ path: screenshotPath, fullPage: false });
      } catch (caught) {
        error = caught instanceof Error ? caught.message : String(caught);
        try {
          await page.screenshot({ path: screenshotPath, fullPage: false });
        } catch {}
      }

      const criticalConsoleMessages = consoleMessages.filter(
        isCriticalConsoleMessage,
      );
      const ok =
        status >= 200 &&
        status < 400 &&
        !error &&
        pageErrors.length === 0 &&
        criticalConsoleMessages.length === 0;

      results.push({
        viewport: viewport.label,
        route: route.path,
        url,
        finalUrl,
        status,
        ok,
        error,
        screenshotPath,
        criticalConsoleMessages,
        consoleMessages: consoleMessages.slice(0, 10),
        pageErrors,
        failedRequests: failedRequests.slice(0, 10),
      });
    }

    await context.close();
  }
} finally {
  await browser.close();
}

const summary = {
  ok: results.every((result) => result.ok),
  checkedAt: new Date().toISOString(),
  baseUrl,
  outputDir,
  results,
};

fs.writeFileSync(
  path.join(outputDir, "launch-smoke-summary.json"),
  JSON.stringify(summary, null, 2),
);

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);

if (!summary.ok) {
  process.exitCode = 1;
}
