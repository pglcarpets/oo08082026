import { createBrowserClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database as AuthDatabase } from "@/types/database.admin.types";
import type { Database } from "@/platform/supabase/types";
import {
  getAuthSupabaseEnv,
  getOptionalAuthSupabaseEnv,
  getOptionalPublicSupabaseEnv,
  getPublicSupabaseEnv,
} from "./env";

export type { Database };

export function createClient() {
  const { url, anonKey } = getPublicSupabaseEnv();
  return createBrowserClient<Database>(url, anonKey);
}

export function createAuthClient() {
  const { url, anonKey } = getAuthSupabaseEnv();
  return createBrowserClient<AuthDatabase>(url, anonKey);
}

export function createOptionalClient() {
  const env = getOptionalPublicSupabaseEnv();
  if (!env) return null;
  return createBrowserClient<Database>(env.url, env.anonKey);
}

export function createOptionalAuthClient() {
  const env = getOptionalAuthSupabaseEnv();
  if (!env) return null;
  return createBrowserClient<AuthDatabase>(env.url, env.anonKey);
}

export function createRawClient() {
  const { url, anonKey } = getPublicSupabaseEnv();
  return createSupabaseClient<Database>(url, anonKey);
}

export async function getBrowserSessionUser(
  client = createClient(),
) {
  const { data, error } = await client.auth.getUser();
  if (error) {
    throw error;
  }
  return data.user ?? null;
}