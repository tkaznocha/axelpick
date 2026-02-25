// Skater pricing logic — continuous within each tier
// Initial price based on ISU World Standings:
//   #1–5:  $15M → $12M   (−$750K per rank)
//   #6–15: $12M → $8.4M  (−$400K per rank)
//   #16–30: $8M → $5.2M  (−$200K per rank)
//   #31+:   $5M → $2M    (−$100K per rank, floor $2M)
//   null/unranked: $3M

export function getInitialPrice(worldRanking: number | null): number {
  if (!worldRanking || worldRanking < 1) return 3_000_000;
  if (worldRanking <= 5) return 15_000_000 - (worldRanking - 1) * 750_000;
  if (worldRanking <= 15) return 12_000_000 - (worldRanking - 6) * 400_000;
  if (worldRanking <= 30) return 8_000_000 - (worldRanking - 16) * 200_000;
  return Math.max(2_000_000, 5_000_000 - (worldRanking - 31) * 100_000);
}
