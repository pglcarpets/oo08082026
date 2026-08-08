import { describe, it, expect, beforeEach } from "vitest";
import { useQuoteCart } from "@/lib/store/quoteCart";

describe("quoteCart store", () => {
  beforeEach(() => {
    // Reset state manually if clearCart doesn't call set
    useQuoteCart.setState({ items: [], totalQty: 0 });
  });

  it("should initialize with empty items", () => {
    const state = useQuoteCart.getState();
    expect(state.items).toEqual([]);
    expect(state.totalQty).toBe(0);
  });

  it("should add a new item to cart", () => {
    useQuoteCart.getState().addItem({ id: "item-1", name: "Chair A" });
    const state = useQuoteCart.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0]).toEqual({
      id: "item-1",
      name: "Chair A",
      qty: 1,
      image: undefined,
      href: undefined,
    });
    expect(state.totalQty).toBe(1);
  });

  it("should increment quantity of existing item", () => {
    useQuoteCart.getState().addItem({ id: "item-1", name: "Chair A" });
    useQuoteCart.getState().addItem({ id: "item-1", name: "Chair A", qty: 2 });

    const state = useQuoteCart.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].qty).toBe(3);
    expect(state.totalQty).toBe(3);
  });

  it("should remove item from cart", () => {
    useQuoteCart.getState().addItem({ id: "item-1", name: "Chair A" });
    useQuoteCart.getState().addItem({ id: "item-2", name: "Desk B" });

    useQuoteCart.getState().removeItem("item-1");

    const state = useQuoteCart.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].id).toBe("item-2");
    expect(state.totalQty).toBe(1);
  });

  it("should update quantity and remove if quantity is 0 or less", () => {
    useQuoteCart.getState().addItem({ id: "item-1", name: "Chair A", qty: 5 });

    useQuoteCart.getState().setQty("item-1", 3);
    expect(useQuoteCart.getState().items[0].qty).toBe(3);
    expect(useQuoteCart.getState().totalQty).toBe(3);

    useQuoteCart.getState().setQty("item-1", 0);
    expect(useQuoteCart.getState().items).toHaveLength(0);
    expect(useQuoteCart.getState().totalQty).toBe(0);
  });

  it("should test clearCart function return value", () => {
    const res = useQuoteCart.getState().clearCart();
    expect(res).toEqual({ items: [], totalQty: 0 });
  });
});
