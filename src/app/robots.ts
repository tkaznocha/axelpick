import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/privacy", "/terms", "/how-to-play"],
        disallow: [
          "/dashboard",
          "/events",
          "/skaters",
          "/leagues",
          "/leaderboard",
          "/settings",
          "/admin",
          "/auth",
        ],
      },
    ],
    sitemap: "https://axelpick.app/sitemap.xml",
  };
}
