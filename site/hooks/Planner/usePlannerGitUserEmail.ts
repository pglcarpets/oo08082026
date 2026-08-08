"use client";

import { useEffect, useState } from "react";

type GitUserIdentity = {
  email: string | null;
  name: string | null;
};

const GIT_USER_API = "/api/git-user";

export function useGitUserEmail(): GitUserIdentity | null {
  const [identity, setIdentity] = useState<GitUserIdentity | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(GIT_USER_API);
        if (!res.ok) return;
        const data = (await res.json()) as GitUserIdentity;
        if (!cancelled) setIdentity(data);
      } catch {
        /* hide on failure */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return identity;
}
