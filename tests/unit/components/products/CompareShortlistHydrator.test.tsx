import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { CompareShortlistHydrator } from "@/components/products/CompareShortlistHydrator";

const replace = vi.fn();
const get = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => ({ get }),
}));

vi.mock("@/lib/store/productCompare", () => ({
  useProductCompare: (
    selector: (s: {
      items: Array<{ productUrlKey: string; id: string }>;
    }) => unknown,
  ) =>
    selector({
      items: [
        { id: "a", productUrlKey: "chair-a" },
        { id: "b", productUrlKey: "desk-b" },
      ],
    }),
}));

describe("CompareShortlistHydrator", () => {
  beforeEach(() => {
    replace.mockClear();
    get.mockReset();
  });

  it("rewrites to items query when URL has no items but store has a shortlist", () => {
    get.mockReturnValue(null);
    render(<CompareShortlistHydrator />);
    expect(replace).toHaveBeenCalledWith(
      "/compare?items=chair-a%2Cdesk-b",
    );
  });

  it("does not rewrite when items query is already present", () => {
    get.mockReturnValue("chair-a");
    render(<CompareShortlistHydrator />);
    expect(replace).not.toHaveBeenCalled();
  });
});
