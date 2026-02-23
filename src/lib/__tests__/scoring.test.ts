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
  it("gold medalist, clean skate, PB → 25+3+5 = 33", () => {
    const r = { ...base, final_placement: 1, is_personal_best: true };
    expect(calculateFantasyPoints(r, event())).toEqual({ raw: 33, final: 33 });
  });

  it("2nd place, SP 1st, 1 fall → 18+5-2 = 21 (no clean bonus)", () => {
    const r = { ...base, final_placement: 2, sp_placement: 1, falls: 1 };
    expect(calculateFantasyPoints(r, event())).toEqual({ raw: 21, final: 21 });
  });

  it("10th place, clean, no PB → 1+3 = 4", () => {
    const r = { ...base, final_placement: 10 };
    expect(calculateFantasyPoints(r, event())).toEqual({ raw: 4, final: 4 });
  });

  it("11th place (outside map) → 0 placement points + clean bonus", () => {
    const r = { ...base, final_placement: 11 };
    expect(calculateFantasyPoints(r, event())).toEqual({ raw: 3, final: 3 });
  });

  it("withdrawal → -10 penalty applied", () => {
    const r = { ...base, is_withdrawal: true };
    // clean bonus 3, withdrawal -10 = -7
    expect(calculateFantasyPoints(r, event())).toEqual({ raw: -7, final: -7 });
  });

  it("0 falls gets +3 clean bonus", () => {
    const r = { ...base, falls: 0 };
    expect(calculateFantasyPoints(r, event()).raw).toBe(3);
  });

  it("3 falls → -6 and no clean bonus", () => {
    const r = { ...base, falls: 3 };
    expect(calculateFantasyPoints(r, event()).raw).toBe(-6);
  });

  it("multiplier: raw 33 × 1.5 = 50 (rounded)", () => {
    const r = { ...base, final_placement: 1, is_personal_best: true };
    expect(calculateFantasyPoints(r, event(1.5))).toEqual({
      raw: 33,
      final: 50,
    });
  });

  it("multiplier: raw 4 × 2.0 = 8", () => {
    const r = { ...base, final_placement: 10 };
    expect(calculateFantasyPoints(r, event(2.0))).toEqual({
      raw: 4,
      final: 8,
    });
  });

  it("null placement → 0 placement points", () => {
    const r = { ...base, final_placement: null };
    expect(calculateFantasyPoints(r, event()).raw).toBe(3); // just clean bonus
  });

  it("withdrawn + placement (both apply)", () => {
    const r = { ...base, final_placement: 1, is_withdrawal: true };
    // 25 + 3 (clean) - 10 (withdrawal) = 18
    expect(calculateFantasyPoints(r, event()).raw).toBe(18);
  });

  it("SP placement bonuses: 1st=5, 2nd=3, 3rd=1, 4th=0", () => {
    expect(
      calculateFantasyPoints({ ...base, sp_placement: 1 }, event()).raw
    ).toBe(8); // 5 + 3 clean
    expect(
      calculateFantasyPoints({ ...base, sp_placement: 2 }, event()).raw
    ).toBe(6); // 3 + 3 clean
    expect(
      calculateFantasyPoints({ ...base, sp_placement: 3 }, event()).raw
    ).toBe(4); // 1 + 3 clean
    expect(
      calculateFantasyPoints({ ...base, sp_placement: 4 }, event()).raw
    ).toBe(3); // 0 + 3 clean
  });
});
