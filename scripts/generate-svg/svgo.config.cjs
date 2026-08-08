/**
 * Locked SVGO plugin configuration (single source, used by both generate path and canonical sanitizer).
 * GS: BP-03 (Option A pipeline), anti-copy (no donor).
 * Integration test asserts this exact shape drives optimize.
 */
module.exports = {
  multipass: false,
  plugins: [
    {
      name: "preset-default",
      params: { floatPrecision: 4, overrides: { cleanupIds: false } },
    },
    "sortAttrs",
  ],
};
