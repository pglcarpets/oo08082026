"use client";

import type { ReactNode } from "react";

import { MemberSuiteShell } from "@/features/shared/shell/MemberSuiteShell";

/** Member portal chrome — outer max-w-7xl frame; portal pages use inner max-w-4xl. */
export function PortalShell({ children }: { children: ReactNode }) {
  return <MemberSuiteShell variant="portal">{children}</MemberSuiteShell>;
}
