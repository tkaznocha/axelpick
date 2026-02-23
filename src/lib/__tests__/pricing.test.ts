import { describe, it, expect } from "vitest";
import { getInitialPrice } from "../pricing";

describe("getInitialPrice", () => {
  it("rank 1 → $14M", () => {
    expect(getInitialPrice(1)).toBe(14_000_000);
  });

  it("rank 5 → $14M (boundary)", () => {
    expect(getInitialPrice(5)).toBe(14_000_000);
  });

  it("rank 6 → $10M (boundary)", () => {
    expect(getInitialPrice(6)).toBe(10_000_000);
  });

  it("rank 15 → $10M", () => {
    expect(getInitialPrice(15)).toBe(10_000_000);
  });

  it("rank 16 → $6M (boundary)", () => {
    expect(getInitialPrice(16)).toBe(6_000_000);
  });

  it("rank 30 → $6M", () => {
    expect(getInitialPrice(30)).toBe(6_000_000);
  });

  it("rank 31 → $3M (boundary)", () => {
    expect(getInitialPrice(31)).toBe(3_000_000);
  });

  it("rank 100 → $3M", () => {
    expect(getInitialPrice(100)).toBe(3_000_000);
  });

  it("null → $3M", () => {
    expect(getInitialPrice(null)).toBe(3_000_000);
  });

  it("0 → $3M (falsy)", () => {
    expect(getInitialPrice(0)).toBe(3_000_000);
  });
});
