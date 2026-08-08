import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export type GitUserIdentity = {
  email: string | null;
  name: string | null;
};

/** Repo root when Next runs via `next dev site` from monorepo root. */
function gitCwd(): string {
  return process.cwd();
}

async function readGitConfig(key: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync("git", ["config", key], {
      cwd: gitCwd(),
      windowsHide: true,
    });
    const value = stdout.trim();
    return value || null;
  } catch {
    return null;
  }
}

export async function readGitUserIdentity(): Promise<GitUserIdentity> {
  const [gitEmail, gitName] = await Promise.all([
    readGitConfig("user.email"),
    readGitConfig("user.name"),
  ]);
  const envEmail = process.env.GIT_USER_EMAIL?.trim() || null;
  const envName = process.env.GIT_USER_NAME?.trim() || null;
  return {
    email: gitEmail || envEmail,
    name: gitName || envName,
  };
}
