// Skater pricing logic
// Initial price based on ISU World Standings:
//   #1–5   = $12M–$15M
//   #6–15  = $8M–$12M
//   #16–30 = $5M–$8M
//   #31+   = $2M–$5M
// Floor $2M, ceiling $18M

export function getInitialPrice(worldRanking: number | null): number {
  if (!worldRanking || worldRanking > 30) return 3_000_000;
  if (worldRanking > 15) return 6_000_000;
  if (worldRanking > 5) return 10_000_000;
  return 14_000_000;
}
