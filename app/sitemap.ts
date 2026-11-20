import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://freeappgentools.com";
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/tarot`, changeFrequency: "monthly", priority: 0.9 },

  ];
}