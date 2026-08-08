/**
 * Next 16 `CONFIG_FILES` prefers `next.config.js` when both exist.
 * This re-export is a safety net only — edit `site/next.config.js`.
 */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const config = require("./next.config.js") as Record<string, unknown>;
export default config;
