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

  // V3 Wide scoring: extended to top-20, strong podium premium,
  // meaningful points for mid-field so spread strategies are viable.
  // Raw pts × event.points_multiplier (2× for Worlds).
  // TODO: make this configurable per event when non-Worlds events need different scoring.
  const placementMap: Record<number, number> = {
    1: 18, 2: 15, 3: 13, 4: 11, 5: 9,
    6: 8,  7: 7,  8: 6,  9: 5,  10: 5,
    11: 4, 12: 4, 13: 3, 14: 3, 15: 3,
    16: 2, 17: 2, 18: 1, 19: 1, 20: 1,
  };

  if (result.final_placement) {
    points += placementMap[result.final_placement] || 0;
  }

  return {
    raw: points,
    final: Math.round(points * event.points_multiplier),
  };
}
