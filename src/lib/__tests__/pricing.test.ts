import { describe, it, expect } from "vitest";
import { getInitialPrice } from "../pricing";

describe("getInitialPrice", () => {
  // Tier 1: ranks 1–5, $15M → $12M (−$750K/rank)
  it("rank 1 → $15M", () => {
    expect(getInitialPrice(1)).toBe(15_000_000);
  });

  it("rank 3 → $13.5M", () => {
    expect(getInitialPrice(3)).toBe(13_500_000);
  });

  it("rank 5 → $12M (tier 1 boundary)", () => {
    expect(getInitialPrice(5)).toBe(12_000_000);
  });

  // Tier 2: ranks 6–15, $12M → $8.4M (−$400K/rank)
  it("rank 6 → $12M (tier 2 start)", () => {
    expect(getInitialPrice(6)).toBe(12_000_000);
  });

  it("rank 10 → $10.4M", () => {
    expect(getInitialPrice(10)).toBe(10_400_000);
  });

  it("rank 15 → $8.4M (tier 2 boundary)", () => {
    expect(getInitialPrice(15)).toBe(8_400_000);
  });

  // Tier 3: ranks 16–30, $8M → $5.2M (−$200K/rank)
  it("rank 16 → $8M (tier 3 start)", () => {
    expect(getInitialPrice(16)).toBe(8_000_000);
  });

  it("rank 20 → $7.2M", () => {
    expect(getInitialPrice(20)).toBe(7_200_000);
  });

  it("rank 30 → $5.2M (tier 3 boundary)", () => {
    expect(getInitialPrice(30)).toBe(5_200_000);
  });

  // Tier 4: ranks 31+, $5M → floor $2M (−$100K/rank)
  it("rank 31 → $5M (tier 4 start)", () => {
    expect(getInitialPrice(31)).toBe(5_000_000);
  });

  it("rank 45 → $3.6M", () => {
    expect(getInitialPrice(45)).toBe(3_600_000);
  });

  it("rank 60 → $2.1M", () => {
    expect(getInitialPrice(60)).toBe(2_100_000);
  });

  it("rank 61 → $2M (floor)", () => {
    expect(getInitialPrice(61)).toBe(2_000_000);
  });

  it("rank 100 → $2M (floor)", () => {
    expect(getInitialPrice(100)).toBe(2_000_000);
  });

  // Edge cases
  it("null → $3M", () => {
    expect(getInitialPrice(null)).toBe(3_000_000);
  });

  it("0 → $3M (falsy)", () => {
    expect(getInitialPrice(0)).toBe(3_000_000);
  });
});
