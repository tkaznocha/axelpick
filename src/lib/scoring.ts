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

  return {
    raw: points,
    final: Math.round(points * event.points_multiplier),
  };
}
