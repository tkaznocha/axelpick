import { describe, it, expect } from "vitest";
import { calculateFantasyPoints } from "../scoring";

const base = {
  final_placement: null as number | null,
  sp_placement: null as number | null,
  falls: 0,
  is_personal_best: false,
  is_withdrawal: false,
};

const event = (multiplier = 1) => ({ points_multiplier: multiplier });

describe("calculateFantasyPoints", () => {
  it("1st place → 25", () => {
    const r = { ...base, final_placement: 1 };
    expect(calculateFantasyPoints(r, event())).toEqual({ raw: 25, final: 25 });
  });

  it("2nd place → 18", () => {
    const r = { ...base, final_placement: 2 };
    expect(calculateFantasyPoints(r, event())).toEqual({ raw: 18, final: 18 });
  });

  it("3rd place → 15", () => {
    const r = { ...base, final_placement: 3 };
    expect(calculateFantasyPoints(r, event())).toEqual({ raw: 15, final: 15 });
  });

  it("4th place → 12", () => {
    const r = { ...base, final_placement: 4 };
    expect(calculateFantasyPoints(r, event())).toEqual({ raw: 12, final: 12 });
  });

  it("5th place → 10", () => {
    const r = { ...base, final_placement: 5 };
    expect(calculateFantasyPoints(r, event())).toEqual({ raw: 10, final: 10 });
  });

  it("6th–10th place points", () => {
    expect(calculateFantasyPoints({ ...base, final_placement: 6 }, event()).raw).toBe(8);
    expect(calculateFantasyPoints({ ...base, final_placement: 7 }, event()).raw).toBe(6);
    expect(calculateFantasyPoints({ ...base, final_placement: 8 }, event()).raw).toBe(4);
    expect(calculateFantasyPoints({ ...base, final_placement: 9 }, event()).raw).toBe(2);
    expect(calculateFantasyPoints({ ...base, final_placement: 10 }, event()).raw).toBe(1);
  });

  it("11th place (outside map) → 0", () => {
    const r = { ...base, final_placement: 11 };
    expect(calculateFantasyPoints(r, event())).toEqual({ raw: 0, final: 0 });
  });

  it("null placement → 0", () => {
    const r = { ...base, final_placement: null };
    expect(calculateFantasyPoints(r, event())).toEqual({ raw: 0, final: 0 });
  });

  it("bonuses and penalties in data have no effect", () => {
    const r = {
      ...base,
      final_placement: 1,
      sp_placement: 1,
      falls: 3,
      is_personal_best: true,
      is_withdrawal: true,
    };
    // Only placement matters: 1st = 25
    expect(calculateFantasyPoints(r, event())).toEqual({ raw: 25, final: 25 });
  });

  it("multiplier: raw 25 × 1.5 = 38 (rounded)", () => {
    const r = { ...base, final_placement: 1 };
    expect(calculateFantasyPoints(r, event(1.5))).toEqual({ raw: 25, final: 38 });
  });

  it("multiplier: raw 1 × 2.0 = 2", () => {
    const r = { ...base, final_placement: 10 };
    expect(calculateFantasyPoints(r, event(2.0))).toEqual({ raw: 1, final: 2 });
  });
});
