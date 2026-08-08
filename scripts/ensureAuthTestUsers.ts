import { config as loadEnv } from "dotenv";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { getE2EAuthEnv, getE2EAuthSeedEnv } from "@/lib/auth/e2eAuthEnv";

loadEnv({ path: ".env.local", override: false, quiet: true });
loadEnv({ override: false, quiet: true });

export type ManagedUser = {
  email: string;
  password: string;
  role: string;
  reusableEmails?: string[];
};

type AuthAdminClient = SupabaseClient;

function createAuthSeedClient(seed: ReturnType<typeof getE2EAuthSeedEnv>): AuthAdminClient {
  // Script-safe client — do not import auth-admin.ts (server-only).
  return createClient(seed.authSupabaseUrl, seed.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

export async function ensureSupabaseUser(
  admin: AuthAdminClient,
  user: ManagedUser,
): Promise<"created" | "updated"> {
  try {
    const role = user.role.toLowerCase();
    const list = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (list.error) {
      throw new Error(`Unable to list users: ${list.error.message}`);
    }

    const existing = list.data.users.find(
      (u: User) => u.email?.toLowerCase() === user.email.toLowerCase(),
    );

    if (!existing) {
      const created = await admin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: { name: user.role, role },
        app_metadata: { role },
      });

      if (created.error) {
        throw new Error(`Unable to create ${user.role} test user: ${created.error.message}`);
      }
      return "created";
    }

    const updated = await admin.auth.admin.updateUserById(existing.id, {
      password: user.password,
      email_confirm: true,
      user_metadata: { name: user.role, role },
      app_metadata: { role },
    });

    if (updated.error) {
      throw new Error(`Unable to update ${user.role} test user: ${updated.error.message}`);
    }
    return "updated";
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Unable to ensure ${user.role} test user: ${message}`);
  }
}

export function buildManagedUsers(
  authEnv: ReturnType<typeof getE2EAuthEnv>,
): ManagedUser[] {
  return [
    {
      email: authEnv.adminEmail,
      password: authEnv.adminPassword,
      role: "Admin",
    },
    {
      email: authEnv.userEmail,
      password: authEnv.userPassword,
      role: "User",
      reusableEmails: ["demo@oando.co.in"],
    },
  ];
}

export async function main(
  deps: {
    getAuthEnv?: typeof getE2EAuthEnv;
    getSeedEnv?: typeof getE2EAuthSeedEnv;
    createAdmin?: (seed: ReturnType<typeof getE2EAuthSeedEnv>) => AuthAdminClient;
    ensureUser?: typeof ensureSupabaseUser;
    write?: (msg: string) => void;
  } = {},
): Promise<ManagedUser[]> {
  const getAuthEnv = deps.getAuthEnv ?? getE2EAuthEnv;
  const getSeedEnv = deps.getSeedEnv ?? getE2EAuthSeedEnv;
  const createAdmin = deps.createAdmin ?? createAuthSeedClient;
  const ensureUser = deps.ensureUser ?? ensureSupabaseUser;
  const write = deps.write ?? ((msg: string) => process.stdout.write(msg));

  const authEnv = getAuthEnv();
  const seedEnv = getSeedEnv();

  const admin = createAdmin(seedEnv);
  const users = buildManagedUsers(authEnv);

  for (const user of users) {
    const outcome = await ensureUser(admin, user);
    write(`${user.role}: ${outcome}\n`);
  }

  write("Supabase E2E auth users are provisioned on the admin/auth project.\n");
  return users;
}

function isMain(): boolean {
  const entry = (process.argv[1] ?? "").replace(/\\/g, "/");
  return entry.endsWith("ensureAuthTestUsers.ts") || entry.endsWith("ensureAuthTestUsers.js");
}

if (isMain()) {
  void main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  });
}
