#!/usr/bin/env node
/**
 * Copy Wave 1 marketing namespaces from en.json into hi.json (Phase 4b scaffold).
 * Applies light Hindi overrides for visible hero/title keys.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(scriptsDir, "..", "site");
const messagesDir = path.join(siteRoot, "i18n", "messages");
const manifest = JSON.parse(
  fs.readFileSync(path.join(siteRoot, "i18n", "marketing-parity-manifest.json"), "utf8"),
);

export const HI_OVERRIDES = {
  home: {
    title: "ओआंडो प्लेटफॉर्म",
    subtitle: "पेशेवर स्पेस प्लानिंग और डिज़ाइन टूल",
    getStarted: "शुरू करें",
    hero: {
      kicker: "पैन-इंडिया · 2011 से",
      primaryCta: { label: "उत्पाद देखें", href: "/products" },
      secondaryCta: { label: "कोटेशन अनुरोध", href: "/#contact" },
    },
  },
  about: {
    heroTitle: "वन एंड ओनली के बारे में",
    heroSubtitle:
      "हम व्यावहारिक, टिकाऊ और स्केलेबल वर्कस्पेस सिस्टम डिज़ाइन और डिलीवर करते हैं।",
  },
  contact: {
    heroTitle: "संपर्क करें",
    heroSubtitle: "अपनी वर्कस्पेस आवश्यकता साझा करें और हमारी टीम अगले कदम बताएगी।",
  },
  products: {
    headlineLead: "वर्कस्पेस",
    headlineAccent: "उत्पाद",
    heroSubtitle: "लाइव कैटलॉग से श्रेणियां ब्राउज़ करें और अपनी टीम के लिए सही मिक्स चुनें।",
  },
  solutions: {
    heroTitleLead: "वर्कस्पेस",
    heroTitleAccent: "समाधान",
    heroSubtitle: "योजना से डिलीवरी तक — एक टीम, स्पष्ट समयरेखा, मापनीय परिणाम।",
  },
};

export function deepMerge(base, overrides) {
  if (!overrides) return base;
  const out = { ...base };
  for (const [key, value] of Object.entries(overrides)) {
    out[key] =
      value && typeof value === "object" && !Array.isArray(value)
        ? deepMerge(base?.[key] ?? {}, value)
        : value;
  }
  return out;
}

export function buildHiWave1Messages(en, hi, namespaces = manifest.wave1Namespaces, overrides = HI_OVERRIDES) {
  const next = { ...hi };
  for (const namespace of namespaces) {
    next[namespace] = deepMerge(structuredClone(en[namespace]), overrides[namespace]);
  }
  return next;
}

export function syncHiWave1Messages({
  messagesDir: dir = messagesDir,
  write = true,
} = {}) {
  const en = JSON.parse(fs.readFileSync(path.join(dir, "en.json"), "utf8"));
  const hi = JSON.parse(fs.readFileSync(path.join(dir, "hi.json"), "utf8"));
  const next = buildHiWave1Messages(en, hi);
  if (write) {
    fs.writeFileSync(path.join(dir, "hi.json"), `${JSON.stringify(next, null, 2)}\n`, "utf8");
  }
  return { namespaces: manifest.wave1Namespaces, next };
}

function isDirectRun() {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return path.resolve(entry) === fileURLToPath(import.meta.url);
  } catch {
    return false;
  }
}

if (isDirectRun()) {
  const { namespaces } = syncHiWave1Messages();
  console.log(`Updated hi.json wave1 namespaces: ${namespaces.join(", ")}`);
}
