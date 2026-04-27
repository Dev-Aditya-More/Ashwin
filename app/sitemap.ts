import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://ashwin.world";

  return [
    {
      url: baseUrl,
      lastModified: new Date("2026-04-24"),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/portfolio`,
      lastModified: new Date("2026-04-24"),
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];
}