interface Result {
  final_placement: number | null;
  sp_placement: number | null;
  falls: number;
  is_personal_best: boolean;
  is_withdrawal: boolean;
}

interface Event {
  points_multiplier: number;
}

export function calculateFantasyPoints(result: Result, event: Event) {
  let points = 0;

  const placementMap: Record<number, number> = {
    1: 25, 2: 18, 3: 15, 4: 12, 5: 10,
    6: 8, 7: 6, 8: 4, 9: 2, 10: 1,
  };

  if (result.final_placement) {
    points += placementMap[result.final_placement] || 0;
  }

  const spBonusMap: Record<number, number> = { 1: 5, 2: 3, 3: 1 };
  if (result.sp_placement) {
    points += spBonusMap[result.sp_placement] || 0;
  }

  if (result.falls === 0) points += 3; // Clean skate bonus
  if (result.is_personal_best) points += 5;

  points -= result.falls * 2; // Fall penalty
  if (result.is_withdrawal) points -= 10;

  return {
    raw: points,
    final: Math.round(points * event.points_multiplier),
  };
}
