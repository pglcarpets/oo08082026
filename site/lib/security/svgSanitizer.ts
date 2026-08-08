/**
 * Phase 03A SVG Sanitizer
 *
 * Sanitizes SVG content to prevent XSS and unsafe behavior.
 * Prohibits: scripts, event handlers, external execution, unsafe attributes, foreign objects.
 *
 * Used to validate:
 * - Generated inventory symbols (internal trust but verify)
 * - Any imported or user-provided SVG
 * - SVG content before any DOM insertion
 */

// ── Blocked elements ──

const BLOCKED_ELEMENTS = new Set([
  "script",
  "foreignObject",
  "iframe",
  "embed",
  "object",
]);

// ── Blocked attributes ──

const BLOCKED_ATTRIBUTES = new Set([
  "onload",
  "onclick",
  "onmouseover",
  "onmouseout",
  "onmousedown",
  "onmouseup",
  "onfocus",
  "onblur",
  "onchange",
  "onsubmit",
  "onreset",
  "onkeydown",
  "onkeypress",
  "onkeyup",
  "onerror",
  "onabort",
  "onscroll",
  "onunload",
  "onresize",
  "ondrag",
  "ondrop",
  "xlink:type",
  "xlink:role",
  "xlink:arcrole",
  "xlink:title",
  "xlink:show",
  "xlink:actuate",
  "src",
  "formaction",
  "poster",
]);

const UNSAFE_PROTOCOLS = /^(javascript|data|vbscript):/i;
const URL_REFERENCE = /url\(\s*['"]?\s*([^'")\s]+)[^)]*\)/i;
const MAX_SVG_BYTES = 100_000;
const MAX_ATTRIBUTE_BYTES = 4_096;
const URL_REFERENCE_ATTRIBUTES = new Set(["href", "xlink:href"]);

function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

function isFragmentReference(value: string): boolean {
  return /^#[A-Za-z_][A-Za-z0-9_.:-]*$/.test(value.trim());
}

// ── Sanitization result ──

export interface SvgSanitizationResult {
  /** Whether the SVG passed sanitization */
  safe: boolean;
  /** Sanitized SVG (original if safe, empty string if blocked) */
  sanitized: string;
  /** Reported issues */
  issues: string[];
}

// ── Sanitization ──

/**
 * Sanitize an SVG string.
 *
 * Rules:
 * - No script elements
 * - No event handler attributes
 * - No unsafe external references; fragment-only hrefs remain allowed
 * - No foreignObject, iframe, embed, object
 * - No javascript:/data: protocols in attributes
 * - Namespace must be http://www.w3.org/2000/svg
 */
export function sanitizeSvg(svg: string): SvgSanitizationResult {
  const issues: string[] = [];

  if (!svg || typeof svg !== "string" || svg.trim().length === 0) {
    return { safe: false, sanitized: "", issues: ["empty or non-string SVG input"] };
  }

  if (new TextEncoder().encode(svg).length > MAX_SVG_BYTES) {
    return { safe: false, sanitized: "", issues: ["SVG payload exceeds maximum size"] };
  }

  if (!/<\s*svg[\s>]/i.test(svg) || !/<\/\s*svg\s*>\s*$/i.test(svg.trim())) {
    return { safe: false, sanitized: "", issues: ["malformed SVG root"] };
  }

  // Check for script tags (case-insensitive)
  if (/<\s*script[\s>]/i.test(svg)) {
    issues.push("contains <script> element");
    return { safe: false, sanitized: "", issues };
  }

  // Check for foreignObject (covers <foreignObject>, <foreignObject/>, <foreignObject > etc)
  if (/<\s*foreignObject[\s>/]/i.test(svg)) {
    issues.push("contains <foreignObject> element");
    return { safe: false, sanitized: "", issues };
  }

  if (/<!ENTITY|<!DOCTYPE/i.test(svg)) {
    return { safe: false, sanitized: "", issues: ["contains external entity or doctype"] };
  }

  // Check for event handler attributes
  for (const attr of BLOCKED_ATTRIBUTES) {
    const pattern = new RegExp(`\\b${attr}\\s*=`, "i");
    if (pattern.test(svg)) {
      issues.push(`contains blocked attribute: ${attr}`);
      return { safe: false, sanitized: "", issues };
    }
  }

  for (const match of svg.matchAll(/\s([:\w-]+)\s*=\s*(?:(["'])(.*?)\2|([^\s>]+))/g)) {
    const attrName = match[1].toLowerCase();
    const attrValue = match[3] ?? match[4] ?? "";
    if (attrName.startsWith("on")) {
      issues.push(`contains blocked event attribute: ${attrName}`);
      return { safe: false, sanitized: "", issues };
    }
    if (BLOCKED_ATTRIBUTES.has(attrName)) {
      issues.push(`contains blocked attribute: ${attrName}`);
      return { safe: false, sanitized: "", issues };
    }
    if (utf8ByteLength(attrValue) > MAX_ATTRIBUTE_BYTES) {
      issues.push(`contains oversized attribute value: ${attrName}`);
      return { safe: false, sanitized: "", issues };
    }
    if (URL_REFERENCE_ATTRIBUTES.has(attrName)) {
      const trimmed = attrValue.trim();
      if (!isFragmentReference(trimmed)) {
        issues.push(`contains unsafe URL reference: ${trimmed.slice(0, 50)}`);
        return { safe: false, sanitized: "", issues };
      }
      continue;
    }
    if (UNSAFE_PROTOCOLS.test(attrValue.trim())) {
      issues.push(`contains unsafe protocol in attribute: ${attrValue.slice(0, 50)}`);
      return { safe: false, sanitized: "", issues };
    }
    const urlMatch = URL_REFERENCE.exec(attrValue);
    if (urlMatch && !isFragmentReference(urlMatch[1])) {
      issues.push(`contains unsafe URL reference: ${urlMatch[1].slice(0, 50)}`);
      return { safe: false, sanitized: "", issues };
    }
  }

  // Check for unsafe protocols in any quoted attribute value.
  for (const match of svg.matchAll(/=\s*(["'])(.*?)\1/g)) {
    const value = match[2];
    const urlMatch = URL_REFERENCE.exec(value);
    if (UNSAFE_PROTOCOLS.test(value) || (urlMatch && !isFragmentReference(urlMatch[1]))) {
      issues.push(`contains unsafe protocol in attribute: ${value.slice(0, 50)}`);
      return { safe: false, sanitized: "", issues };
    }
  }

  // Check for basic namespace
  if (!svg.includes("xmlns=\"http://www.w3.org/2000/svg\"") && !svg.includes("xmlns='http://www.w3.org/2000/svg'")) {
    // Only warn, not block — some valid SVG variants
    issues.push("missing standard SVG namespace");
  }

  // Quick check for forbidden elements (iframe/embed/object)
  for (const el of BLOCKED_ELEMENTS) {
    if (el === "script" || el === "foreignObject") {continue;} // already checked above
    const pattern = new RegExp(`<\\s*${el}[\\s>/]`, "i");
    if (pattern.test(svg)) {
      issues.push(`contains blocked element: <${el}>`);
      return { safe: false, sanitized: "", issues };
    }
  }

  // Passed all checks
  return { safe: true, sanitized: svg, issues };
}

/**
 * Quick check: is this SVG safe?
 */
export function isSvgSafe(svg: string): boolean {
  return sanitizeSvg(svg).safe;
}
