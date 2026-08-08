/**
 * Generate TypeScript types for the admin DB by introspecting information_schema.
 *
 * Mirrors the shape of Supabase's `gen types` output for the public schema.
 * Used because `supabase gen types --db-url` requires Docker.
 */
import { config } from "dotenv";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { writeFileSync } from "node:fs";
import postgres from "postgres";

config({ path: resolve(process.cwd(), ".env.local") });

export type Col = {
  column_name: string;
  data_type: string;
  udt_name: string;
  is_nullable: "YES" | "NO";
  column_default: string | null;
  is_identity: "YES" | "NO";
};

export type FK = {
  table_name: string;
  constraint_name: string;
  column_name: string;
  foreign_table: string;
  foreign_column: string;
};

export function tsTypeFor(col: Col): string {
  const dt = col.data_type;
  const udt = col.udt_name;
  let base: string;
  if (dt === "ARRAY") {
    const inner = udt.startsWith("_") ? udt.slice(1) : udt;
    return `${tsTypeFor({ ...col, data_type: inner, udt_name: inner })}[]`;
  }
  if (dt === "json" || dt === "jsonb") base = "Json";
  else if (
    dt === "text" || dt === "character varying" || dt === "uuid" ||
    dt === "varchar" || dt === "character" || dt === "char" ||
    dt === "name"
  ) base = "string";
  else if (
    dt === "integer" || dt === "bigint" || dt === "smallint" ||
    dt === "numeric" || dt === "real" || dt === "double precision" ||
    dt === "int4" || dt === "int8" || dt === "int2" || dt === "float8" || dt === "float4"
  ) base = "number";
  else if (dt === "boolean" || dt === "bool") base = "boolean";
  else if (
    dt === "timestamp with time zone" || dt === "timestamp without time zone" ||
    dt === "date" || dt === "time" || dt === "timestamptz" || dt === "timestamp"
  ) base = "string";
  else base = "string";
  return base;
}

export function indent(s: string, n: number): string {
  const pad = " ".repeat(n);
  return s.split("\n").map((l) => l ? pad + l : l).join("\n");
}

export function colToRowField(c: Col): string {
  const t = tsTypeFor(c);
  const nullable = c.is_nullable === "YES" ? " | null" : "";
  return `          ${c.column_name}: ${t}${nullable}`;
}

export async function main(): Promise<void> {
  const url = process.env.SUPABASE_AUTH_DATABASE_URL?.trim();
  if (!url) {
    console.error("Missing SUPABASE_AUTH_DATABASE_URL");
    process.exit(1);
  }
  const sql = postgres(url, { prepare: false, max: 1 });

  const tables = await sql<Array<{ table_name: string }>>`
    select c.relname as table_name
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
    order by c.relname;
  `;

  const views = await sql<Array<{ table_name: string }>>`
    select c.relname as table_name
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('v', 'm')
    order by c.relname;
  `;

  const fks = (await sql<FK[]>`
    select
      tc.table_name,
      tc.constraint_name,
      kcu.column_name,
      ccu.table_name as foreign_table,
      ccu.column_name as foreign_column
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu
      on tc.constraint_name = kcu.constraint_name and tc.table_name = kcu.table_name
    join information_schema.constraint_column_usage ccu
      on tc.constraint_name = ccu.constraint_name
    where tc.table_schema = 'public' and tc.constraint_type = 'FOREIGN KEY';
  `);

  const tableBlocks: string[] = [];
  for (const { table_name } of tables) {
    const cols = await sql<Col[]>`
      select column_name, data_type, udt_name, is_nullable, column_default, is_identity
      from information_schema.columns
      where table_schema = 'public' and table_name = ${table_name}
      order by ordinal_position;
    `;
    const tableFks = fks.filter((f) => f.table_name === table_name);

    const rowFields = cols
      .map((c) => {
        const t = tsTypeFor(c);
        const nullable = c.is_nullable === "YES" ? " | null" : "";
        return `          ${c.column_name}: ${t}${nullable}`;
      })
      .join("\n");
    const insertFields = cols
      .map((c) => {
        const t = tsTypeFor(c);
        const optional =
          c.is_nullable === "YES" ||
          c.column_default !== null ||
          c.is_identity === "YES"
            ? "?"
            : "";
        const nullable = c.is_nullable === "YES" ? " | null" : "";
        return `          ${c.column_name}${optional}: ${t}${nullable}`;
      })
      .join("\n");
    const updateFields = cols
      .map((c) => {
        const t = tsTypeFor(c);
        const nullable = c.is_nullable === "YES" ? " | null" : "";
        return `          ${c.column_name}?: ${t}${nullable}`;
      })
      .join("\n");

    const relsBlock = tableFks.length === 0
      ? "        Relationships: []"
      : "        Relationships: [\n" +
        tableFks
          .map((f) => indent(
`{
  foreignKeyName: "${f.constraint_name}"
  columns: ["${f.column_name}"]
  isOneToOne: false
  referencedRelation: "${f.foreign_table}"
  referencedColumns: ["${f.foreign_column}"]
}`,
            10,
          ))
          .join(",\n") +
        "\n        ]";

    tableBlocks.push(
`      ${table_name}: {
        Row: {
${rowFields}
        }
        Insert: {
${insertFields}
        }
        Update: {
${updateFields}
        }
${relsBlock}
      }`
    );
  }

  const viewBlocks: string[] = [];
  for (const { table_name } of views) {
    const cols = await sql<Col[]>`
      select column_name, data_type, udt_name, is_nullable, column_default, is_identity
      from information_schema.columns
      where table_schema = 'public' and table_name = ${table_name}
      order by ordinal_position;
    `;
    const rowFields = cols
      .map((c) => {
        const t = tsTypeFor(c);
        const nullable = c.is_nullable === "YES" ? " | null" : "";
        return `          ${c.column_name}: ${t}${nullable}`;
      })
      .join("\n");
    viewBlocks.push(
`      ${table_name}: {
        Row: {
${rowFields}
        }
        Relationships: []
      }`
    );
  }

  const out =
`export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
${tableBlocks.join("\n")}
    }
    Views: {
${viewBlocks.length ? viewBlocks.join("\n") : "      [_ in never]: never"}
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
`;

  // Must land where the app imports it: site/types/database.admin.types.ts
  // re-exports this file, and platform/supabase/auth-admin.ts types its client
  // from that re-export. Writing anywhere else regenerates into the void.
  const outDir = resolve("site", "platform", "types");
  const outRel = "site/platform/types/database.admin.types.ts";
  mkdirSync(outDir, { recursive: true });
  writeFileSync(resolve(outDir, "database.admin.types.ts"), out, "utf8");
  console.log(`Wrote ${outRel} (${out.length} bytes)`);
  await sql.end({ timeout: 5 });
}

function isMain(): boolean {
  const entry = (process.argv[1] ?? "").replace(/\\/g, "/");
  return entry.endsWith("db_gen_admin_types.ts") || entry.endsWith("db_gen_admin_types.js");
}

if (isMain()) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
