"use client";

import { useGitUserEmail } from "@studio/hooks/useStudioGitUserEmail";

export function TopBarGitUser() {
  const identity = useGitUserEmail();
  const email = identity?.email?.trim();
  if (!email) return null;

  const name = identity?.name?.trim();
  const title = name ? `Git: ${name} <${email}>` : `Git: ${email}`;

  return (
    <span className="topbar__git-user" title={title} data-testid="topbar-git-email">
      {email}
    </span>
  );
}

export default TopBarGitUser;
