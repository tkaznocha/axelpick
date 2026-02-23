import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Axel Pick — Fantasy Figure Skating",
    short_name: "Axel Pick",
    description:
      "Pick your skaters, earn points from real results, and compete on the leaderboard.",
    start_url: "/dashboard",
    display: "standalone",
    theme_color: "#00A572",
    background_color: "#FAFAF9",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
