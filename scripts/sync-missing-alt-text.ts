import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Support local developer env files first, then fall back to default dotenv lookup.
loadEnv({ path: ".env.local", override: false, quiet: true });
loadEnv({ quiet: true });

type ProductRow = {
  id: string;
  name: string;
  category_id: string | null;
  description: string | null;
  alt_text: string | null;
  metadata: Record<string, unknown> | null;
};

type AltPatch = {
  id: string;
  altText: string;
  updatePayload: Record<string, unknown>;
};

type LoggerLike = Pick<typeof console, "log" | "warn" | "error">;

type SyncOptions = {
  apply?: boolean;
  limit?: number;
  batchSize?: number;
  retries?: number;
  supabase?: ReturnType<typeof createClient>;
  logger?: LoggerLike;
  env?: NodeJS.ProcessEnv;
  argv?: string[];
};

function parseNumberArg(argv: string[], name: string, fallback: number): number {
  const prefix = `--${name}=`;
  const arg = argv.find((entry) => entry.startsWith(prefix));
  if (!arg) return fallback;
  const parsed = Number.parseInt(arg.slice(prefix.length), 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function parseCliOptions(argv: string[]): Required<Pick<SyncOptions, "apply" | "limit" | "batchSize" | "retries">> {
  const apply = argv.includes("--apply");
  const limit = parseNumberArg(argv, "limit", 0);
  const batchSize = Math.max(1, parseNumberArg(argv, "batch-size", 20));
  const retries = Math.max(1, parseNumberArg(argv, "retries", 3));
  return { apply, limit, batchSize, retries };
}

function createSupabaseClientFromEnv(env: NodeJS.ProcessEnv): ReturnType<typeof createClient> {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || "";
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || "";
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!supabaseUrl || (!serviceRoleKey && !anonKey)) {
    throw new Error(
      "Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY).",
    );
  }
  return createClient(supabaseUrl, serviceRoleKey || anonKey);
}

function resolveAltTextProvider(env: NodeJS.ProcessEnv) {
  const geminiKey = env.GEMINI_API_KEY?.trim();
  if (geminiKey) {
    return {
      apiKey: geminiKey,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
      model: env.GEMINI_MODEL || "gemini-2.5-flash",
    };
  }

  const openRouterKey = env.OPENROUTER_API_KEY_PRIMARY?.trim() || env.OPENROUTER_API_KEY_BACKUP?.trim();
  if (openRouterKey) {
    return {
      apiKey: openRouterKey,
      baseURL: "https://openrouter.ai/api/v1",
      model: env.OPENROUTER_MODEL || "openrouter/auto",
    };
  }

  return null;
}

async function requestAltText(prompt: string, env: NodeJS.ProcessEnv): Promise<string | null> {
  const provider = resolveAltTextProvider(env);
  if (!provider) {
    return null;
  }

  const response = await fetch(`${provider.baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify({
      model: provider.model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 60,
    }),
  });

  if (!response.ok) {
    return null;
  }

  const completion = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return completion.choices?.[0]?.message?.content?.trim() ?? null;
}

function normalizeCategory(categoryId: string | null): string {
  return (categoryId || "furniture").replace(/^oando-/, "").replace(/-/g, " ");
}

function fallbackAltText(row: ProductRow): string {
  return `${row.name} ${normalizeCategory(row.category_id)}`.replace(/\s+/g, " ").trim().slice(0, 140);
}

async function generateAltText(row: ProductRow, env: NodeJS.ProcessEnv): Promise<string> {

  const prompt = [
    "Generate concise product image alt text for office furniture.",
    "Return plain text only, max 15 words.",
    `Category: ${normalizeCategory(row.category_id)}`,
    `Name: ${row.name}`,
    row.description ? `Description: ${row.description}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const generated = await requestAltText(prompt, env);
    if (!generated) return fallbackAltText(row);
    return generated.replace(/\s+/g, " ").trim().slice(0, 140);
  } catch {
    return fallbackAltText(row);
  }
}

function hasExistingAlt(row: ProductRow): boolean {
  const metadata = row.metadata || {};
  const aiAlt =
    (typeof metadata.ai_alt_text === "string" && metadata.ai_alt_text) ||
    (typeof metadata.aiAltText === "string" && metadata.aiAltText) ||
    "";
  return Boolean(row.alt_text || aiAlt);
}

async function retry<T>(fn: () => Promise<T>, maxAttempts: number): Promise<T> {
  let attempt = 0;
  let lastError: unknown = null;
  while (attempt < maxAttempts) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      attempt += 1;
      if (attempt >= maxAttempts) break;
      const delayMs = 250 * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastError;
}

function createPatch(row: ProductRow, altText: string, hasAltTextColumn: boolean): AltPatch {
  const metadata = {
    ...row.metadata,
    ai_alt_text: altText,
  };
  const updatePayload = hasAltTextColumn
    ? { alt_text: row.alt_text || altText, metadata }
    : { metadata };
  return { id: row.id, altText, updatePayload };
}

export function formatPatchSet(patches: AltPatch[]): string {
  const printable = patches.map((patch) => ({
    id: patch.id,
    ...patch.updatePayload,
  }));
  return JSON.stringify(printable, null, 2);
}

export async function runAltTextSync(options: SyncOptions = {}) {
  const argv = options.argv || process.argv;
  const cli = parseCliOptions(argv);
  const apply = options.apply ?? cli.apply;
  const limit = options.limit ?? cli.limit;
  const batchSize = options.batchSize ?? cli.batchSize;
  const retries = options.retries ?? cli.retries;
  const env = options.env || process.env;
  const logger = options.logger || console;
  const supabase = options.supabase || createSupabaseClientFromEnv(env);

  let hasAltTextColumn = true;
  let rows: ProductRow[] = [];

  const withAltText = await supabase
    .from("products")
    .select("id,name,category_id,description,alt_text,metadata")
    .order("name", { ascending: true });

  if (withAltText.error) {
    if (withAltText.error.message.includes("column products.alt_text does not exist")) {
      hasAltTextColumn = false;
      const withoutAltText = await supabase
        .from("products")
        .select("id,name,category_id,description,metadata")
        .order("name", { ascending: true });
      if (withoutAltText.error) {
        throw new Error(`Supabase read failed: ${withoutAltText.error.message}`);
      }
      rows = ((withoutAltText.data || []) as Omit<ProductRow, "alt_text">[]).map((row) => ({
        ...row,
        alt_text: null,
      }));
    } else {
      throw new Error(`Supabase read failed: ${withAltText.error.message}`);
    }
  } else {
    rows = (withAltText.data || []) as ProductRow[];
  }

  const missing = rows.filter((row) => !hasExistingAlt(row));
  const target = limit > 0 ? missing.slice(0, limit) : missing;

  logger.log(`Found ${rows.length} products; ${missing.length} missing alt text.`);
  logger.log(`Targeting ${target.length} records (${apply ? "apply" : "dry-run"} mode).`);

  if (target.length === 0) {
    return { patches: [] as AltPatch[], patchOutput: "[]", updated: 0 };
  }

  const patches: AltPatch[] = [];
  for (const row of target) {
    const altText = await generateAltText(row, env);
    patches.push(createPatch(row, altText, hasAltTextColumn));
  }

  const patchOutput = formatPatchSet(patches);
  logger.log("Patch set:");
  logger.log(patchOutput);

  if (!apply) {
    logger.log("Run with --apply to persist updates.");
    return { patches, patchOutput, updated: 0 };
  }

  let updated = 0;
  for (let index = 0; index < patches.length; index += batchSize) {
    const batch = patches.slice(index, index + batchSize);
    await Promise.all(
      batch.map((patch) =>
        retry(async () => {
          const { error: updateError } = await supabase
            .from("products")
            .update(patch.updatePayload as never)
            .eq("id", patch.id);
          if (updateError) {
            throw new Error(`Update failed for ${patch.id}: ${updateError.message}`);
          }
          updated += 1;
        }, retries),
      ),
    );
    logger.log(`Updated ${Math.min(index + batch.length, patches.length)}/${patches.length}`);
  }

  logger.log(`Completed. Updated ${updated} records.`);
  return { patches, patchOutput, updated };
}

if (process.env.NODE_ENV !== "test") {
  runAltTextSync().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
