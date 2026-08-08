/**
 * Name-mirror: features/shared/components/GuestBadge
 */

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { GuestBadge } from "@/features/shared/components/GuestBadge";

describe("GuestBadge", () => {
  it("renders the guest read-only label", () => {
    render(<GuestBadge />);
    expect(screen.getByText("Guest (Read-Only)")).toBeInTheDocument();
  });
});
