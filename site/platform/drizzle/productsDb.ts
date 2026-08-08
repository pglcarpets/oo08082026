import "server-only";

import { createPostgresDrizzle } from "./createPostgresDrizzle";
import { resolveProductsDatabaseUrl } from "./databaseUrls";

let cachedDb: ReturnType<typeof createPostgresDrizzle> | null = null;

export function getProductsDb() {
  if (cachedDb) return cachedDb;

  const connectionString = resolveProductsDatabaseUrl();
  if (!connectionString) {
    throw new Error(
      "PRODUCTS_DATABASE_URL is missing. Set it in repo-root .env.local for catalog Drizzle access.",
    );
  }

  cachedDb = createPostgresDrizzle(connectionString);
  return cachedDb;
}

export const productsDb = new Proxy({} as ReturnType<typeof createPostgresDrizzle>, {
  get(_target, property, receiver) {
    return Reflect.get(getProductsDb(), property, receiver);
  },
});
