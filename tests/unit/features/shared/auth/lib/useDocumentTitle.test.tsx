/**
 * Name-mirror: features/shared/auth/lib/useDocumentTitle
 */

import { describe, expect, it, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { useDocumentTitle } from "@/features/shared/auth/lib/useDocumentTitle";

function TitleProbe({ title }: { title: string | null }) {
  useDocumentTitle(title);
  return <div data-testid="probe">ok</div>;
}

describe("useDocumentTitle", () => {
  afterEach(() => {
    cleanup();
    document.title = "";
  });

  it("sets document.title when a title is provided", () => {
    document.title = "Previous";
    render(<TitleProbe title="Login | Oando" />);
    expect(document.title).toBe("Login | Oando");
  });

  it("restores the previous title on unmount", () => {
    document.title = "Home";
    const { unmount } = render(<TitleProbe title="Signup" />);
    expect(document.title).toBe("Signup");
    unmount();
    expect(document.title).toBe("Home");
  });

  it("does not change the title when title is null", () => {
    document.title = "Unchanged";
    render(<TitleProbe title={null} />);
    expect(document.title).toBe("Unchanged");
  });
});
