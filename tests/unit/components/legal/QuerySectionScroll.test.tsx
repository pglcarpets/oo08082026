import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { QuerySectionScroll } from "@/components/legal/QuerySectionScroll";

let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParams,
}));

describe("QuerySectionScroll", () => {
  beforeEach(() => {
    searchParams = new URLSearchParams();
    document.body.innerHTML = "";
  });

  it("scrolls to the section id from the query param", async () => {
    const scrollIntoView = vi.fn();
    const imprint = document.createElement("section");
    imprint.id = "imprint";
    imprint.scrollIntoView = scrollIntoView;
    document.body.appendChild(imprint);

    searchParams = new URLSearchParams("section=imprint");
    render(<QuerySectionScroll param="section" />);

    await waitFor(() => {
      expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
    });
  });

  it("does nothing when the query param is absent", async () => {
    const scrollIntoView = vi.fn();
    const imprint = document.createElement("section");
    imprint.id = "imprint";
    imprint.scrollIntoView = scrollIntoView;
    document.body.appendChild(imprint);

    render(<QuerySectionScroll param="section" />);

    await waitFor(() => {
      expect(scrollIntoView).not.toHaveBeenCalled();
    });
  });
});
