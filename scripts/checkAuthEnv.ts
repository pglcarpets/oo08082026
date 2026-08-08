import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { getE2EAuthEnv } from "@/lib/auth/e2eAuthEnv";

loadEnv({ path: ".env.local", override: false, quiet: true });
loadEnv({ override: false, quiet: true });

async function verifyCredential(params: {
  supabaseUrl: string;
  anonKey: string;
  email: string;
  password: string;
  label: string;
}) {
  const client = createClient(params.supabaseUrl, params.anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  const { data, error } = await client.auth.signInWithPassword({
    email: params.email,
    password: params.password,
  });

  if (error) {
    throw new Error(`${params.label} auth failed: ${error.message}`);
  }

  if (!data.user) {
    throw new Error(`${params.label} auth failed: missing user in Supabase response`);
  }

  await client.auth.signOut();
}

async function main() {
  const env = getE2EAuthEnv();

  await verifyCredential({
    supabaseUrl: env.authSupabaseUrl,
    anonKey: env.authSupabaseAnonKey,
    email: env.adminEmail,
    password: env.adminPassword,
    label: "Admin",
  });

  await verifyCredential({
    supabaseUrl: env.authSupabaseUrl,
    anonKey: env.authSupabaseAnonKey,
    email: env.userEmail,
    password: env.userPassword,
    label: "User",
  });

  process.stdout.write(
    "Admin/auth Supabase env sanity passed for admin and user credentials.\n",
  );
}

void main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
