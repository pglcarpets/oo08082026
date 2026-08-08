import { defineConfig } from "drizzle-kit";
import { createRequire } from "node:module";
import { resolvePlannerDatabaseUrl } from "./databaseUrls";

const require = createRequire(import.meta.url);
require("../../../scripts/general/loadEnvLocal.cjs").loadEnvLocal();

export default defineConfig({
  schema: ["platform/drizzle/schema/catalog.ts", "platform/drizzle/schema/planner.ts"],
  out: "platform/drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: resolvePlannerDatabaseUrl() ?? "",
  },
});
