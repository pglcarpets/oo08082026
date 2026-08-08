/**
 * Name-mirror: components/site/MaintenanceBanner
 */
import { afterEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { MaintenanceBanner } from "@/components/site/MaintenanceBanner";

describe("MaintenanceBanner", () => {
  const previous = process.env.SITE_MAINTENANCE_MODE;

  afterEach(() => {
    if (previous === undefined) {
      delete process.env.SITE_MAINTENANCE_MODE;
    } else {
      process.env.SITE_MAINTENANCE_MODE = previous;
    }
  });

  it("renders nothing when maintenance mode is off", () => {
    delete process.env.SITE_MAINTENANCE_MODE;
    const { container } = render(<MaintenanceBanner />);
    expect(container.firstChild).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("shows a status banner with the readonly maintenance label", () => {
    process.env.SITE_MAINTENANCE_MODE = "readonly";
    render(<MaintenanceBanner />);

    const banner = screen.getByRole("status");
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveTextContent(/Read-only maintenance/i);
    expect(banner).toHaveClass("border-b");
  });
});
