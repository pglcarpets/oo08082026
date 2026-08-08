import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useDocumentTitle } from "@/features/shared/auth/lib/useDocumentTitle";

function TitleProbe({ title }: { title: string | null }) {
  useDocumentTitle(title);
  return null;
}

describe("useDocumentTitle", () => {
  it("sets and restores the document title", () => {
    document.title = "Previous title";

    const { unmount } = render(<TitleProbe title="New title" />);
    expect(document.title).toBe("New title");

    unmount();
    expect(document.title).toBe("Previous title");
  });

  it("does nothing when title is null", () => {
    document.title = "Stable title";
    render(<TitleProbe title={null} />);
    expect(document.title).toBe("Stable title");
  });
});