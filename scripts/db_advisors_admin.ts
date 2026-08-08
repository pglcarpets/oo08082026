// Run advisor checks against the admin DB.
// Same lint definitions as scripts/db_advisors.ts but using SUPABASE_AUTH_DATABASE_URL.
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
require("./general/loadEnvLocal.cjs").loadEnvLocal();
process.env.PRODUCTS_DATABASE_URL = process.env.SUPABASE_AUTH_DATABASE_URL;

import("./db_advisors.js").catch((e) => {
  console.error(e);
  process.exit(1);
});
