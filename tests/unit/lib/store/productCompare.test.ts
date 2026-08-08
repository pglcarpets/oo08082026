import { describe, it, expect, beforeEach } from "vitest";
import { useProductCompare, MAX_COMPARE_ITEMS } from "@/lib/store/productCompare";

describe("productCompare store", () => {
  beforeEach(() => {
    useProductCompare.getState().clear();
  });

  it("should initialize with empty items list", () => {
    const state = useProductCompare.getState();
    expect(state.items).toEqual([]);
  });

  it("should add items and respect MAX_COMPARE_ITEMS limit", () => {
    const store = useProductCompare.getState();

    store.addItem({ id: "1", name: "Chair A", productUrlKey: "chair-a", categoryId: "seating" });
    expect(useProductCompare.getState().items).toHaveLength(1);

    // Add duplicate - should be ignored
    useProductCompare.getState().addItem({ id: "1", name: "Chair A", productUrlKey: "chair-a", categoryId: "seating" });
    expect(useProductCompare.getState().items).toHaveLength(1);

    // Add up to limit
    useProductCompare.getState().addItem({ id: "2", name: "Chair B", productUrlKey: "chair-b", categoryId: "seating" });
    useProductCompare.getState().addItem({ id: "3", name: "Chair C", productUrlKey: "chair-c", categoryId: "seating" });
    useProductCompare.getState().addItem({ id: "4", name: "Chair D", productUrlKey: "chair-d", categoryId: "seating" });
    useProductCompare.getState().addItem({ id: "5", name: "Chair E", productUrlKey: "chair-e", categoryId: "seating" });

    // Should slice and only keep the last 4 items (MAX_COMPARE_ITEMS)
    const items = useProductCompare.getState().items;
    expect(items).toHaveLength(MAX_COMPARE_ITEMS);
    expect(items.map(i => i.id)).toEqual(["2", "3", "4", "5"]);
  });

  it("should remove items by id", () => {
    useProductCompare.getState().addItem({ id: "1", name: "Chair A", productUrlKey: "chair-a", categoryId: "seating" });
    useProductCompare.getState().addItem({ id: "2", name: "Chair B", productUrlKey: "chair-b", categoryId: "seating" });

    useProductCompare.getState().removeItem("1");
    expect(useProductCompare.getState().items).toHaveLength(1);
    expect(useProductCompare.getState().items[0].id).toBe("2");
  });

  it("should toggle items (adding when absent, removing when present)", () => {
    const item = { id: "1", name: "Chair A", productUrlKey: "chair-a", categoryId: "seating" };

    // Toggle on (should add)
    useProductCompare.getState().toggleItem(item);
    expect(useProductCompare.getState().items).toHaveLength(1);

    // Toggle off (should remove)
    useProductCompare.getState().toggleItem(item);
    expect(useProductCompare.getState().items).toHaveLength(0);
  });

  it("should clear all items", () => {
    useProductCompare.getState().addItem({ id: "1", name: "Chair A", productUrlKey: "chair-a", categoryId: "seating" });
    useProductCompare.getState().clear();
    expect(useProductCompare.getState().items).toEqual([]);
  });
});
