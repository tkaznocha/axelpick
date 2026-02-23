import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://axelpick.app", lastModified: new Date(), priority: 1.0 },
    { url: "https://axelpick.app/how-to-play", lastModified: new Date(), priority: 0.7 },
    { url: "https://axelpick.app/login", lastModified: new Date(), priority: 0.5 },
    { url: "https://axelpick.app/privacy", lastModified: new Date(), priority: 0.3 },
    { url: "https://axelpick.app/terms", lastModified: new Date(), priority: 0.3 },
  ];
}
