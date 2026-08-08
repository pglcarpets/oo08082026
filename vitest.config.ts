import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    environmentMatchGlobs: [["tests/**/*.test.tsx", "happy-dom"]],
    globalSetup: ["tests/helpers/globalSetup.ts"],
  },
  resolve: {
    alias: [
      // Category-specific anchored aliases (must precede the general @ alias)
      { find: /^@planner\/components(?=\/|$)/, replacement: path.resolve(__dirname, "site/components/Planner") },
      { find: /^@planner\/lib(?=\/|$)/, replacement: path.resolve(__dirname, "site/lib/Planner") },
      { find: /^@planner\/hooks(?=\/|$)/, replacement: path.resolve(__dirname, "site/hooks/Planner") },
      { find: /^@planner\/store(?=\/|$)/, replacement: path.resolve(__dirname, "site/store/Planner") },
      { find: /^@planner\/server(?=\/|$)/, replacement: path.resolve(__dirname, "site/server/Planner") },
      { find: /^@studio\/components(?=\/|$)/, replacement: path.resolve(__dirname, "site/components/Studio") },
      { find: /^@studio\/lib(?=\/|$)/, replacement: path.resolve(__dirname, "site/lib/Studio") },
      { find: /^@studio\/hooks(?=\/|$)/, replacement: path.resolve(__dirname, "site/hooks/Studio") },
      { find: /^@studio\/store(?=\/|$)/, replacement: path.resolve(__dirname, "site/store/Studio") },
      { find: /^@studio\/server(?=\/|$)/, replacement: path.resolve(__dirname, "site/server/Studio") },
      // General aliases
      { find: /^@focss(?=\/|$)/, replacement: path.resolve(__dirname, "site/focss") },
      { find: /^@(?=\/)/, replacement: path.resolve(__dirname, "site") },
    ],
  },
});
