/**
 * Theme Runtime Verification — Phase 11
 *
 * Utility that can be invoked at runtime or in tests to verify
 * the dynamic block theme system is correctly mounted and injecting tokens.
 */

export type ThemeVerificationResult = {
  passed: boolean;
  styleTagExists: boolean;
  tokenCount: number;
  tokens: Record<string, string>;
  errors: string[];
};

/**
 * Expected minimum token keys that must be present in a valid theme injection.
 */
const REQUIRED_TOKENS = [
  "block-text",
  "block-accent",
  "block-border",
  "block-surface-alt",
] as const;

/**
 * Verify that the dynamic theme system has correctly injected tokens into the DOM.
 * Call this from a browser context (client component or test).
 */
export function verifyThemeRuntime(): ThemeVerificationResult {
  const errors: string[] = [];
  const tokens: Record<string, string> = {};

  // Check for the style tag
  const styleTag = document.getElementById("dynamic-block-theme");
  const styleTagExists = styleTag !== null;

  if (!styleTagExists) {
    errors.push("Style tag #dynamic-block-theme not found in document.head");
    return { passed: false, styleTagExists: false, tokenCount: 0, tokens, errors };
  }

  // Parse injected CSS vars from the style tag content
  const content = styleTag.textContent ?? "";
  const varMatches = content.matchAll(/--([\w-]+):\s*([^;]+)/g);

  for (const match of varMatches) {
    const key = match[1];
    const value = match[2].trim();
    tokens[key] = value;
  }

  const tokenCount = Object.keys(tokens).length;

  if (tokenCount === 0) {
    errors.push("Style tag exists but contains no CSS variables");
  }

  // Check required tokens
  for (const required of REQUIRED_TOKENS) {
    if (!(required in tokens)) {
      errors.push(`Missing required token: --${required}`);
    }
  }

  return {
    passed: errors.length === 0,
    styleTagExists,
    tokenCount,
    tokens,
    errors,
  };
}

/**
 * Verify theme from computed styles (works even if tokens come from static CSS).
 */
export function verifyThemeComputedTokens(element?: HTMLElement): Record<string, string> {
  const el = element ?? document.documentElement;
  const computed = getComputedStyle(el);
  const result: Record<string, string> = {};

  for (const token of REQUIRED_TOKENS) {
    const inlineValue = el.style.getPropertyValue(`--${token}`).trim();
    const computedValue = computed.getPropertyValue(`--${token}`).trim();
    const value = inlineValue || computedValue;
    if (value) {
      result[token] = value;
    }
  }

  return result;
}
